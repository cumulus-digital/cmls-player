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
import generateUuid from 'Utils/generateUuid';
import { Framer } from '@/framer/Framer';

export default class TritonSDK {
	static tritonPlayer;
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
				class={Framer.safeClass}
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
		this.mediaPlayerId = generateUuid();
		tdPlayerConfig.coreModules.find(
			(mod) => mod.id == 'MediaPlayer'
		).playerId = `${config.mediaplayer_id_prefix}-${this.mediaPlayerId}`;

		window.cmls_player_tdsdk = new window.TDSdk(tdPlayerConfig);
		this.setPlayer(window.cmls_player_tdsdk);

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
			this.getPlayer()
		);
	}

	static onPlayerReady(e) {
		if (!this.getPlayer()) {
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
			this.getPlayer().addEventListener(ev, listeners[ev]);
		}

		for (const mod in this.modules) {
			if (this.modules[mod]?.onReady) {
				log.debug(`Calling ${mod} onReady handler`);
				this.modules[mod]?.onReady(this.getPlayer());
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

		SDK.emitEvent('stream-status', {
			code: map_code,
			status: stream_status[map_code],
			event: e,
		});

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
		SDK.emitEvent('stream-start', { mount: station?.mount });
		SDK?.onStreamStart();
	}
	static onStreamStop(e) {
		const station = playerStateSelects['station/current'](store.getState());
		SDK.emitEvent('stream-stop', { mount: station?.mount });
		SDK?.onStreamStop();
	}
	static onStreamError(e) {
		const station = playerStateSelects['station/current'](store.getState());
		SDK.emitEvent('stream-error', { mount: stations?.mount, error: e });
		SDK?.onStreamError();
	}

	static setPlayer(player) {
		this.tritonPlayer = player;
		window._CMLS = window._CMLS || {};
		window._CMLS.triton_player = player;

		return this.tritonPlayer;
	}

	static getPlayer() {
		return this.tritonPlayer;
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

		// If we're currently playing, we must stop for a
		// tick before attempting to play. Triton gets confused.
		const mediaElement = this.getPlayer()?.MediaElement;
		if (mediaElement?.isStopped && !mediaElement.isStopped()) {
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
				if (!mediaElement.isStopped()) return;
				clearInterval(this.delayPlay);
				this.delayPlay = setTimeout(() => {
					this.delayPlay = undefined;
					SDK.onPlayMessage(mount);
				}, 250);
			}, 100);
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
		this.getPlayer().play({
			mount,
			trackingParameters: { dist: 'cmls-webplayer' },
		});

		store.dispatch(playerStateActions['set/interactive'](true));
	}

	static stop() {
		log.debug('Stopping!');
		this.getPlayer().stop();
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
			this.getPlayer().playAd('vastAd', adConfig);
		} catch (e) {
			log.error('Error playing vast ad!', e);
			this.modules?.MediaPlayer?.onPlaybackError(e);
		}
	}

	static forceUpdateCuepoints() {
		this.modules?.NowPlayingHandler?.forceNowPlayingTick();
	}
}
