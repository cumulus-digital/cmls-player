import { h } from 'Utils/createElement';

import store from 'Store';
import { playerStateActions, playerStateSelects } from 'Store/playerStateSlice';
import { batch } from 'react-redux';

import baseConfig from 'Config';
import fixSassJson from 'Utils/fixSassJson';
const config = fixSassJson(baseConfig);

import baseSDKConfig from './config.json';
const sdkConfig = fixSassJson(baseSDKConfig);

import { stream_status } from 'Consts';

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK');

//import { forceNowPlayingTick } from './NowPlayingHandler';
//import { setCuePoint } from './CuePointHandler';

import CuePointHandler from './CuePointHandler';
import MediaPlayer from './MediaPlayer';
import NowPlayingHandler from './NowPlayingHandler';
import { SDK } from 'SDK';
import { appSignals } from '@/signals';

export default class TritonSDK {
	static player;
	static mediaPlayer;
	static mediaPlayerId;
	static delayPlay;

	static modules = {};

	static init(scriptUrl = null) {
		log.debug('Init!');
		if (!scriptUrl) {
			scriptUrl = sdkConfig.url;
		}

		const self = this;

		const scriptTag = (
			<script
				id={config.sdk_id}
				class="do-not-remove"
				async={true}
				src={scriptUrl}
				onLoad={this.onScriptLoad.bind(self)}
			/>
		);
		document.head.appendChild(scriptTag);
	}

	static onScriptLoad(e) {
		if (!window.TDSdk) {
			throw new Error(
				'initSDK called without window.TDSdk available! Triton SDK must be included.'
			);
		}

		const tdPlayerConfig = {
			...sdkConfig.td_player_config,
			playerReady: this.onPlayerReady.bind(this),
			configurationError: this.onConfigError,
			moduleError: this.onModuleError,
			adBlockerDetected: this.adBlockerDetected,
		};

		// Generate random mediaplayer ID
		parent.mediaPlayerId = Math.floor(
			100000000 + Math.random() * 900000000
		);
		tdPlayerConfig.coreModules.find(
			(mod) => mod.id == 'MediaPlayer'
		).playerId = `${config.mediaplayer_id_prefix}-${parent.mediaPlayerId}`;

		const player = this.setPlayer(new window.TDSdk(tdPlayerConfig));
		this.player = player;

		this.modules.MediaPlayer = new MediaPlayer(this);
		this.modules.CuePointHandler = new CuePointHandler(this);
		this.modules.NowPlayingHandler = new NowPlayingHandler(this);

		for (const mod in this.modules) {
			if (this.modules[mod]?.configure) {
				this.modules[mod]?.configure();
			}
		}

		log.debug(
			'Triton SDK Initialized, awaiting ready state',
			tdPlayerConfig,
			player
		);
	}

	static onPlayerReady(e) {
		if (!this.player) {
			log.error('onPlayerReady called, but player is not available.');
			throw new Error(
				'onPlayerReady called, but player is not available.'
			);
		}

		const listeners = {
			'stream-status': this.onStreamStatusChange.bind(this),
			'stream-start': this.onStreamStart.bind(this),
			'stream-stop': this.onStreamStop.bind(this),
			'stream-fail': this.onStreamError.bind(this),
			'stream-error': this.onStreamError.bind(this),
		};

		for (let ev in listeners) {
			log.debug(
				'Attaching global player listener',
				{ event: ev, callback_name: listeners[ev].name },
				listeners[ev]
			);
			this.player.addEventListener(ev, listeners[ev]);
		}

		for (const mod in this.modules) {
			if (this.modules[mod]?.onReady) {
				log.debug(`Calling ${mod} onReady handler`);
				this.modules[mod]?.onReady(this.player);
			}
		}

		SDK.setReady(true);
		log.debug('SDK is ready.');
	}

	static onConfigError(e) {
		throw e;
	}

	static onModuleError(e) {
		throw e;
	}

	static adBlockerDetected(e) {
		log.warn('Ad blocker detected', e);
		//store.dispatch(playerStateActions['set/ad_blocker_detected'](true));
		appSignals.sdk.ad_blocker_detected.value = true;
	}

	static onStreamStatusChange(e) {
		if (typeof e?.data?.code === 'undefined') {
			return;
		}
		const map_code = sdkConfig.status_map[e.data.code];
		if (typeof stream_status?.[map_code] === 'undefined') {
			log.debug('Unknown status received', e);
			return;
		}

		const { playerState } = store.getState();

		log.debug('Status change:', {
			mount: playerState.playing,
			status: stream_status[map_code],
			event: e,
		});
		store.dispatch(
			playerStateActions['set/status'](stream_status[map_code])
		);

		const ev = new CustomEvent('cmls-player-stream-status', {
			detail: {
				code: map_code,
				status: stream_status[map_code],
				event: e,
			},
		});
		SDK.emit(ev);

		// Handle when stream automatically pauses
		if (
			playerState.playing &&
			stream_status[map_code] === stream_status.LIVE_PAUSE
		) {
			console.log('LIVE_PAUSE status interpreted as STOP');
			this.stop();
		}
	}

	static onStreamStart(e) {
		const station = playerStateSelects['station/current'](store.getState());
		const ev = new CustomEvent('cmls-player-stream-start', {
			detail: {
				mount: station?.mount,
			},
		});
		SDK.emit(ev);
	}
	static onStreamStop(e) {
		const station = playerStateSelects['station/current'](store.getState());
		const ev = new CustomEvent('cmls-player-stream-stop', {
			detail: {
				mount: station?.mount,
			},
		});
		SDK.emit(ev);
	}
	static onStreamError(e) {
		const station = playerStateSelects['station/current'](store.getState());
		const ev = new CustomEvent('cmls-player-stream-error', {
			detail: {
				mount: station?.mount,
				error: e,
			},
		});
		SDK.emit(ev);
	}

	static setPlayer(player) {
		this.player = player;
		window._CMLS = window._CMLS || {};
		window._CMLS.triton_player = player;

		return this.player;
	}

	static getPlayer() {
		return this.player;
	}

	static play(mount) {
		if (this.delayPlay) {
			log.debug('Playing delayed, waiting for next tick...');
			return;
		}

		let { playerState } = store.getState();

		if (!mount) {
			mount = playerState.primary_station;
		}

		// If we're currently playing, we will stop for a
		// tick before calling onPlayMessage again.
		if (playerState.playing) {
			log.debug('Currently playing, stopping and delaying play');
			SDK.stop();
			batch(() => {
				store.dispatch(playerStateActions['set/interactive'](false));
				store.dispatch(
					playerStateActions['set/status'](
						stream_status.LIVE_CONNECTING
					)
				);
			});
			this.delayPlay = setInterval(() => {
				const { playerState } = store.getState();
				if (playerState.playing) return;
				clearInterval(this.delayPlay);
				this.delayPlay = null;
				SDK.onPlayMessage(mount);
			}, 300);
			return;
		}

		log.debug('Play station!', { mount });
		batch(() => {
			SDK.setCuePoint({ mount, cue: false });
			store.dispatch(playerStateActions['set/playing'](mount));
			store.dispatch(playerStateActions['set/station/active'](mount));
			store.dispatch(playerStateActions['set/interactive'](false));
		});
		this.playingHere = true;

		if (this.modules?.MediaPlayer) {
			try {
				playerState = store.getState()?.playerState;
				this.modules.MediaPlayer.playVastAd(
					playerState.stations[mount].vast,
					(e) => {
						this.beginStream(mount);
					}
				);
			} catch (e) {
				log.error('Error playing vast ad!', e);
				this.beginStream(mount);
			}
		} else {
			this.beginStream(mount);
		}
	}

	static beginStream(mount) {
		this.player.play({
			mount,
			trackingParameters: { dist: 'cmls-webplayer' },
		});

		store.dispatch(playerStateActions['set/interactive'](true));
	}

	static stop() {
		this.player.stop();
	}

	static playVastAd(requestConfig) {
		const adConfig = {
			trackingParameters: {},
			...requestConfig,
		};
		if (!adConfig.trackingParameters?.player) {
			adConfig.trackingParameters.player = 'cmls-webplayer';
		}
		store.dispatch(
			playerStateActions['set/status'](stream_status.LIVE_PREROLL)
		);
		try {
			this.player.playAd('vastAd', adConfig);
		} catch (e) {
			log.error('Error playing vast ad!', e);
			this.modules?.MediaPlayer?.onPlaybackError(e);
		}
	}
}
