import './MediaSessionApi';
import { appSignals } from '@/signals';
import isParentWindow from 'Utils/isParentWindow';
import { observeStore } from 'Store/index';

import store from 'Store/index';
import { playerStateActions, playerStateSelects } from 'Store/playerStateSlice';
import { stream_status } from 'Consts';
import { CuePoint } from 'Store/CuePoint';
import { fetchItunesArtwork } from 'Utils/iTunesHelper';

import Logger from 'Utils/Logger';
import { batch } from 'react-redux';
import { isLeader } from 'Utils/leaderElection';
import { addReloadAction, addUnloadAction } from 'Utils/unloadActionCue';

//import TritonSDK from './triton';

const log = new Logger('SDK Controller');

export class SDK {
	static interface;

	static playingHere = false;
	static previousStation = false;
	static playingHere = false;

	/**
	 * Call init on the selected interface and instantiate global observers/listeners
	 * @param {string} interface_type
	 */
	static init(interface_type) {
		if (!appSignals.sdk.type.peek() || interface_type) {
			appSignals.sdk.type.value = interface_type;
		} else {
			throw new Error('SDK interface must be provided at init.');
		}

		import(
			/* webpackChunkName: "sdk/[request]" */
			/* webpackMode: 'lazy' */
			`./${appSignals.sdk.type.value}/index`
		)
			.then((scr) => {
				log.debug('SDK loaded', scr);
				if (scr.default) {
					this.interface = scr.default;
					this.interface.init();
				}
			})
			.catch((e) => {
				log.error('Failed to load interface', e);
			});

		/*
		const interfaces = {
			triton: TritonSDK,
		};

		if (interfaces?.[appSignals.sdk.type.value]) {
			this.interface = interfaces[appSignals.sdk.type.value];
			this.interface.init();
		} else {
			log.error('Failed to load interface!', e);
			return;
		}
		*/

		// Handle state changes and cross-window stops
		const handleStateChange = ({ status, playing }) => {
			if (!this.interface) return;

			// Handle LIVE_PAUSE
			if (this.isPlayingHere() && status === stream_status.LIVE_PAUSE) {
				return this.stop();
			}

			// Handle remote stop requests
			if (playing !== this.previousStation) {
				this.previousStation = playing;

				if (!playing) {
					this.onStopMessage();
				}
			}
		};
		const stateObserver = new observeStore(
			store,
			handleStateChange.bind(this),
			(state) => {
				return {
					status: playerStateSelects.status(state),
					playing: playerStateSelects.playing(state),
				};
			}
		);

		if (isParentWindow()) {
			// Handle requests from children
			window.addEventListener('message', (e) => {
				const data = e?.data;
				if (!data?.action) return;

				if (data.action === 'cmls-player:play') {
					this.onPlayMessage(data.mount);
				}
				if (data.action === 'cmls-player:stop') {
					this.onStopMessage();
				}
			});
		}

		// Stop playing if a playing window is closed
		addUnloadAction(() => {
			stateObserver.unsubscribe();
			if (this.isPlayingHere()) {
				batch(() => {
					this.onStopMessage();
					store.dispatch(playerStateActions['set/playing'](false));
					store.dispatch(
						playerStateActions['set/status'](
							stream_status.LIVE_STOP
						)
					);
				});
			}
		}, 0);

		addReloadAction(() => {
			if (stateObserver) stateObserver.subscribe();
		});
	}

	/**
	 *
	 * @param {CustomEvent} ev
	 */
	static emit(ev) {
		window.dispatchEvent(ev);
	}

	static testForInterface() {
		if (!this.interface) {
			throw new Error(
				'SDK interface method called before interface was selected!'
			);
		}
	}

	/**
	 * Is the SDK interface ready?
	 * @returns {boolean}
	 */
	static isReady() {
		return appSignals.sdk.ready.peek();
	}
	static setReady(ready = true) {
		appSignals.sdk.ready.value = ready;
	}

	/**
	 * Determine if the current window is where we're playing from
	 * @returns {boolean}
	 */
	static isPlayingHere() {
		return !!this.playingHere;
	}

	/**
	 * Send a message to the parent and siteframe windows
	 * @param {mixed} message
	 */
	static sendMessage(message) {
		[window.parent, window[config.siteframe_id]].forEach((w) => {
			w?.postMessage(message, '*');
		});
	}

	static onStreamStart() {}
	static onStreamStop() {}
	static onStreamError() {}

	/**
	 * Should never be called directly!
	 * Handle a play message for the given mount, passed to current interface.
	 * @param {string} mount
	 */
	static onPlayMessage(mount) {
		this.testForInterface();

		const { playerState } = store.getState();

		if (!mount) {
			mount = playerState.primary_station;
		}

		if (this.interface?.play) {
			this.interface.play(mount);
		}
		this.playingHere = true;
	}

	/**
	 * Inform the player to play a mount
	 * @param {string} mount
	 */
	static play(mount) {
		this.testForInterface();

		if (isParentWindow()) {
			this.onPlayMessage(mount);
		} else {
			log.debug('Sending play message to parent');
			this.sendMessage({
				action: 'cmls-player:play',
				mount,
			});
		}
	}

	/**
	 * Should never be called directly!
	 * Handle a stop message, passed to current interface.
	 */
	static onStopMessage() {
		this.testForInterface();

		const { playerState } = store.getState();
		const wasPlaying = playerState.playing;
		const wasStatus = playerState.status;
		log.debug('Stopping', wasPlaying);

		batch(() => {
			if (wasPlaying) {
				log.debug('Resetting cuepoint', wasPlaying);
				this.setCuePoint({ mount: wasPlaying, cue: false });
			}
			log.debug('Setting playing to false');
			store.dispatch(playerStateActions['set/playing'](false));

			// Handle any funky previous states
			if (wasStatus !== stream_status.LIVE_PLAYING) {
				log.debug('Setting status to LIVE_STOP');
				store.dispatch(
					playerStateActions['set/status'](stream_status.LIVE_STOP)
				);
			}

			if (this.isPlayingHere()) {
				log.debug('Telling interface to stop.');
				this.interface?.stop();
				this.playingHere = false;
			}
		});
		isLeader().then((iAmLeader) => {
			if (iAmLeader) {
				this.interface?.forceUpdateCuepoints();
			}
		});
	}

	static stop() {
		if (isParentWindow()) {
			this.onStopMessage();
		} else {
			log.debug('Sending stop message to parent');
			this.sendMessage({
				action: 'cmls-player:stop',
			});
		}
	}

	/**
	 * Generate button and cue labels for the current state
	 * @returns {{buttonLabel<string>, cueLabel<string>}}
	 */
	static generateLabels() {
		// Allow override from interface
		if (this.interface?.generateLabels) {
			return this.interface.generateLabels();
		}

		const state = store.getState();

		const status = playerStateSelects.status(state);
		const current_station = playerStateSelects['station/current'](state);
		const cueLabel = playerStateSelects['station/cuelabel'](
			state,
			current_station
		);

		let newButtonLabel = appSignals.offline_label.value;
		let newCueLabel = current_station?.fetch_nowplaying ? cueLabel : '';
		switch (status) {
			case stream_status.LIVE_PREROLL:
			case stream_status.LIVE_CONNECTING:
			case stream_status.LIVE_RECONNECTING:
			case stream_status.GETTING_STATION_INFORMATION:
				newButtonLabel = 'Connecting…';
				newCueLabel = 'The stream will begin momentarily…';
				break;
			case stream_status.LIVE_BUFFERING:
				newButtonLabel = 'Buffering…';
				break;
			case stream_status.LIVE_PLAYING:
				newButtonLabel = current_station?.name || 'Now Playing';
				break;
			case stream_status.LIVE_FAILED:
				newButtonLabel = 'Stream failed!';
				newCueLabel = 'Please try again later';
				break;
			case stream_status.STATION_NOT_FOUND:
				newButtonLabel = 'Station not found!';
				newCueLabel =
					'Player is misconfigured, please contact the station';
				break;
			case stream_status.PLAY_NOT_ALLOWED:
				newButtonLabel = 'Not Allowed';
				newCueLabel =
					'Playback is not allowed at this time, please try again later';
				break;
			case stream_status.STREAM_GEOBLOCKED:
			case stream_status.STREAM_GEO_BLOCKED_ALTERNATE:
			case stream_status.STREAM_GEO_BLOCKED_NO_ALTERNATE:
				newButtonLabel = 'Unavailable!';
				newCueLabel =
					'Sorry, this content is not available in your area.';
				break;
		}
		const ret = { buttonLabel: newButtonLabel, cueLabel: newCueLabel };
		/*
		log.debug('Returning labels', {
			status,
			station: current_station,
			cue: cueLabel,
			labels: ret,
		});
		*/
		return ret;
	}

	/**
	 * Set a cue point for a mount
	 * @param {object} param0
	 * @param {string} param0.mount Station mount ID
	 * @param {CuePoint|false} param0.cue Cue point or false to reset
	 * @returns {void}
	 */
	static setCuePoint({ mount = null, cue = {} }) {
		if (!isParentWindow()) return;

		try {
			const { playerState } = store.getState();

			if (!mount || !playerState.stations[mount]) {
				log.warn(
					'Attempted to set a cue point without a registered mount.',
					{
						mount,
						data,
						stations: Object.keys(playerState.stations),
					}
				);

				return;
			}

			const station = playerState.stations[mount];
			const oldCue = playerState.cuepoints?.[mount];

			if (cue === false) {
				store.dispatch(
					playerStateActions['set/station/cuepoint']({
						[mount]: null,
					})
				);
				return;
			}

			let newCue = Object.assign({}, cue);

			if (!cue || !Object.values(cue).length) {
				// No data received, setting a vanity cue
				Object.assign(newCue, {
					artist: station?.name || '',
					title: station?.tagline || '',
					type: CuePoint.types.VANITY,
				});
			}

			// If we're playing but no artist and title is set
			if (playerState.playing) {
				if (station?.name) {
					if (!newCue.artist) {
						newCue.artist = station.name;
					}
					if (!newCue.title) {
						newCue.title = station.name;
					}
					if (!newCue.artist && !newCue.title) {
						newCue.artist = station?.tagline;
						newCue.title = station?.name;
						newCue.type = CuePoint.types.VANITY;
					}
				}
			}

			newCue = new CuePoint(newCue);

			if (newCue.track_id !== oldCue?.track_id) {
				log.debug('Setting cue point', {
					mount,
					received: cue,
					using: newCue,
				});

				store.dispatch(
					playerStateActions['set/station/cuepoint']({
						[mount]: Object.assign({}, newCue),
					})
				);
			}

			if (newCue.type === 'track') {
				// fetch artwork for track types
				log.debug(this);
				this.fetchArtwork({ mount, cue: newCue });
			}
		} catch (e) {
			log.warn(e);
		}
	}

	/**
	 * Fetch artwork for a mount cue point
	 * @param {object} param0
	 * @param {string} param0.mount Station mount ID
	 * @param {object} param0.cue Cue point
	 * @param {string} param0.cue.artist
	 * @param {string} param0.cue.title
	 * @returns {Promise|false}
	 */
	static async fetchArtwork({ mount = null, cue = {} }) {
		if (!isParentWindow()) return;

		const { playerState } = store.getState();

		if (!cue) {
			cue = playerState.cuepoints?.[mount];
		}

		const station = playerState.stations[mount];

		if (
			cue &&
			cue.artist &&
			cue.title &&
			cue.artist !== station?.name &&
			cue.title !== station?.name &&
			!cue?.artwork
		) {
			log.debug('Fetching artwork', { mount, cue });
			store.dispatch(
				playerStateActions['set/station/cuepoint/artwork']({
					[mount]: false,
				})
			);
			return fetchItunesArtwork(cue.artist, cue.title)
				.then((artUrl) => {
					if (artUrl?.length) {
						log.debug('Setting cuepoint artwork', {
							mount,
							cue,
							artUrl,
						});
						store.dispatch(
							playerStateActions['set/station/cuepoint/artwork']({
								[mount]: artUrl,
							})
						);
					} else {
						log.debug('No artwork found', { mount, cue, artUrl });
						store.dispatch(
							playerStateActions['set/station/cuepoint/artwork']({
								[mount]: false,
							})
						);
					}
				})
				.catch((e) => {
					log.debug('Could not fetch artwork!', {
						mount,
						cue,
						error: e,
					});
					store.dispatch(
						playerStateActions['set/station/cuepoint/artwork']({
							[mount]: false,
						})
					);
				});
		}
		return false;
	}
}

//export const SDK = TritonSDK;
