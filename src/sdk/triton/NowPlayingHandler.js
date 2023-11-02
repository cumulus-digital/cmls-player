import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';

import fixSassJson from 'Utils/fixSassJson';

import baseConfig from 'Config';
const config = fixSassJson(baseConfig);

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / NowPlayingHandler');

//import { setCuePoint } from './CuePointHandler';
import generateIdFromString from 'Utils/generateIdFromString';
import { SDK } from 'SDK';
import isParentWindow from 'Utils/isParentWindow';
import { isLeader } from 'Utils/leaderElection';

let nowPlayingInterval;

export default class NowPlayingHandler {
	parent;
	nowPlayingInterval;

	constructor(parent) {
		this.parent = parent;
	}

	onReady(player = null) {
		if (!player) {
			log.error('You must supply a player object parameter.');
			throw new Error('You must supply a player object parameter.');
		}
		if (!player?.NowPlayingApi) {
			log.error('Player must have NowPlayingApi module.');
			throw new Error('Player must have NowPlayingApi module.');
		}

		const listeners = {
			'list-loaded': this.onListLoaded.bind(this),
			'stream-stop': this.forceNowPlayingTick.bind(this),
			'stream-error': this.forceNowPlayingTick.bind(this),
			'stream-fail': this.forceNowPlayingTick.bind(this),
		};

		for (let ev in listeners) {
			log.debug(
				'Attaching listener',
				{ event: ev, callback_name: listeners[ev].name },
				listeners[ev]
			);
			player.addEventListener(ev, listeners[ev]);
		}

		const interval = config.offline_nowplaying_interval || 30000;
		this.nowPlayingInterval = setInterval(
			this.nowPlayingTick.bind(this),
			interval
		);

		let hiddenTime;
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				log.debug('Tab hidden');
				hiddenTime = Date.now();
			} else {
				log.debug('Tab focus returned');
				const now = Date.now();
				if (
					now > hiddenTime + interval &&
					now < hiddenTime + interval * 2
				) {
					log.debug(
						'Tab focused after tick would have fired, forcing fire'
					);
					this.forceNowPlayingTick.call(this);
				}
			}
		});

		log.debug('Offline Now Playing interval has begun.', { interval });
		this.nowPlayingTick.call(this);
	}

	/**
	 * Called at nowPlayingInterval to fetch fresh Now Playing data for
	 * all registered stations.
	 * @param {boolean} forced True forces a fetch even if disabled or not the leader
	 * @returns  {void}
	 */
	async nowPlayingTick(forced = false) {
		if (!isParentWindow()) {
			log.debug('Not parent window');
			return;
		}

		if (document.hidden) {
			log.debug('Tab is hidden, skipping tick');
			return;
		}

		function doTick(forced = false) {
			const { playerState } = store.getState();

			if (!playerState.fetch_nowplaying && forced !== true) {
				log.debug(
					'Now playing fetch globally disabled during this tick.'
				);
				return;
			}

			if (!Object.keys(playerState.stations).length) {
				log.warn('nowPlayingTick: No stations registered.', {
					state: playerState,
				});
				return;
			}

			for (let mount in playerState.stations) {
				const station = playerState.stations[mount];
				const last_unresolved_cuepoint =
					station.last_unresolved_cuepoint;
				const unresolved_requests =
					station.unresolved_nowplaying_requests;
				const max_unresolved_requests =
					config.max_unresolved_nowplaying_requests || 5;

				// Do not fetch if station is currently playing
				if (mount === playerState.playing) {
					continue;
				}

				// Do not fetch if fetch_nowplaying is disabled
				if (!station.fetch_nowplaying) {
					continue;
				}

				// Do not fetch if station has too many unresolved requests
				if (unresolved_requests > max_unresolved_requests) {
					// but try again once every 10 minutes until we hit
					// 150% of max unresolved requests
					if (
						unresolved_requests < max_unresolved_requests * 1.5 &&
						Date.now() - last_unresolved_cuepoint > 600000
					) {
						log.debug(
							'Attempting a failsave request after 10 minutes of being disabled.'
						);
						this.enableFetch(mount);
						this.incrementUnresolvedRequests(mount);
						continue;
					} else if (station.fetch_nowplaying) {
						log.warn(
							`Mount has more than ${max_unresolved_requests} unresolved requests, disabling fetch.`,
							station
						);

						// Disable future fetching
						this.disableFetch(mount);
						continue;
					}
				}
				log.debug('Requesting last played', { mount, station });
				this.parent.getPlayer().NowPlayingApi.load({
					mount,
					numberToFetch: 1,
				});
				this.incrementUnresolvedRequests(mount);
			}
		}

		if (forced) {
			doTick.call(this, forced);
		} else {
			isLeader().then((areWeLeader) => {
				if (!areWeLeader) {
					log.debug('Not leader window, skipping now playing tick');
					return;
				}

				doTick.call(this, forced);
			});
		}
	}

	forceNowPlayingTick() {
		this.nowPlayingTick(true);
	}

	/**
	 * Handle a list-loaded event
	 * @param {Event} e
	 * @returns {void}
	 */
	onListLoaded(e) {
		const mount = e?.data?.mount;
		if (!mount) {
			log.warn('No mount in offline Now Playing data!', { event: e });
			return;
		}

		const { playerState } = store.getState();

		const station = playerState.stations?.[mount];
		if (!station) {
			log.warn(
				'Received offline Now Playing data for an unregistered station',
				{ event: e }
			);

			return;
		}

		this.decrementUnresolvedRequests(mount);

		// Don't handle a station already playing
		if (mount === playerState.playing) {
			return;
		}

		const cueData = e.data?.list?.length ? e?.data?.list[0] : false;
		if (!cueData) {
			log.debug('Offline Now Playing list was empty', {
				event: e,
				station,
			});
			return;
		}

		if (!cueData.trackID) {
			cueData.trackID = generateIdFromString(
				[cueData?.artistName, cueData?.cueTitle].filter((k) =>
					k.trim ? k.trim() : ''
				)
			);
		}

		// Don't handle if track id hasn't changed
		if (cueData.trackID === playerState.cuepoints?.[mount]?.track_id) {
			return;
		}

		const newCue = {
			artist: cueData?.artistName,
			title: cueData.cueTitle,
			track_id: cueData?.trackID,
			type: 'offline-track',
		};

		log.debug('Received new offline Now Playing data', {
			event: e,
			newCue,
			station,
		});
		SDK.setCuePoint({
			mount,
			cue: newCue,
		});
		this.resetUnresolvedRequests(mount);
	}

	setFetchFlag(mount, flag = true) {
		store.dispatch(
			playerStateActions['set/station/fetch_nowplaying']({
				[mount]: flag,
			})
		);
	}

	/**
	 * Enable fetch_nowplaying for a station
	 * @param {string} mount
	 */
	enableFetch(mount) {
		this.setFetchFlag(mount, true);
	}

	/**
	 * Disable fetch_nowplaying for a station
	 * @param {string} mount
	 */
	disableFetch(mount) {
		this.setFetchFlag(mount, false);
	}

	/**
	 * Increment unresolved requests tracker for a station
	 * @param {string} mount
	 */
	incrementUnresolvedRequests(mount) {
		store.dispatch(
			playerStateActions[
				'action/station/unresolved_nowplaying_requests/increment'
			]([mount])
		);
	}

	/**
	 * Decrement unresolved requests tracker for a station
	 * @param {string} mount
	 */
	decrementUnresolvedRequests(mount) {
		store.dispatch(
			playerStateActions[
				'action/station/unresolved_nowplaying_requests/decrement'
			]([mount])
		);
	}

	resetUnresolvedRequests(mount) {
		store.dispatch(
			playerStateActions['set/station/unresolved_nowplaying_requests']({
				[mount]: 0,
			})
		);
	}
}
