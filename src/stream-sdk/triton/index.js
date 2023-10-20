import { h } from 'Utils/createElement';

import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';

import baseConfig from 'Config';
import fixSassJson from 'Utils/fixSassJson';
const config = fixSassJson(baseConfig);

import baseSDKConfig from './config.json';
const sdkConfig = fixSassJson(baseSDKConfig);

import { stream_status } from 'Consts';

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK');

import { initSdk } from './initSdk';
import isParentWindow from 'Utils/isParentWindow';
import { forceNowPlayingTick } from './NowPlayingHandler';
import { batch } from 'react-redux';

import { appSignals } from '@/signals';
import { CuePoint } from 'Store/CuePoint';
import { setCuePoint } from './CuePointHandler';

export class TritonSDK {
	static player;
	static mediaPlayer;
	static mediaPlayerId;
	static scriptTag;
	static previousStation = false;
	static playingHere = false;

	static init(scriptUrl = null) {
		const self = this;
		if (!scriptUrl) {
			scriptUrl = sdkConfig.url;
		}
		this.scriptTag = (
			<script
				id={config.sdk_id}
				async={true}
				src={scriptUrl}
				onLoad={this.onScriptLoad.bind(self)}
			/>
		);
		document.head.appendChild(this.scriptTag);

		// Handle state changes and cross-window stops
		store.subscribe(() => {
			const { playerState } = store.getState();

			if (!this.player) {
				return;
			}

			if (this.previousStation !== playerState.playing) {
				this.previousStation = playerState.playing;

				if (!playerState.playing && this.isPlayingHere()) {
					this.onStopMessage();
				}
			}

			if (
				this.isPlayingHere() &&
				playerState.status === stream_status.LIVE_PAUSE
			) {
				this.stop();
			}
		});

		if (isParentWindow()) {
			// Stop playing if the playing window is closed
			window.addEventListener('beforeunload', (e) => {
				if (this.isPlayingHere()) {
					this.stop();
				}
			});

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
	}

	static isReady() {
		//const { playerState } = store.getState();
		//return playerState.ready;
		return appSignals.sdk.ready.peek();
	}
	static setReady(ready = true) {
		//store.dispatch(playerStateActions['set/ready'](ready));
		appSignals.sdk.ready.value = ready;
	}

	static isPlayingHere() {
		return !!this.playingHere;
	}

	static onScriptLoad(e) {
		initSdk.call(this);
		//playerState.interactive = true;
	}

	static setPlayer(player) {
		this.player = player;

		window._CMLS = window._CMLS || {};
		window._CMLS.webplayer_instance = player;

		return this.player;
	}

	static getPlayer() {
		return this.player;
	}

	static onPlayMessage(mount) {
		const { playerState } = store.getState();

		if (!mount) {
			mount = playerState.primary_station;
		}

		if (playerState.playing) {
			this.stop();
			batch(() => {
				store.dispatch(
					playerStateActions['set/status'](
						stream_status.LIVE_CONNECTING
					)
				);
				store.dispatch(playerStateActions['set/interactive'](false));
			});
			setTimeout(() => {
				this.onPlayMessage.call(this, mount);
			}, 250);
			return;
		}

		log.debug('Play station!', { playerState });
		batch(() => {
			store.dispatch(playerStateActions['set/playing'](mount));
			store.dispatch(playerStateActions['set/station/active'](mount));
			store.dispatch(playerStateActions['set/interactive'](false));
		});
		this.playingHere = true;

		if (this.mediaPlayer) {
			try {
				this.mediaPlayer.playVastAd(
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

	static play(mount) {
		if (isParentWindow()) {
			this.onPlayMessage(mount);
		} else {
			log.debug('Sending play message to parent');
			window[config.siteframe_id]?.postMessage(
				{
					action: 'cmls-player:play',
					mount,
				},
				'*'
			);
		}
	}

	static beginStream(mount) {
		this.player.play({
			mount,
			trackingParameters: { player: 'cmls-webplayer' },
		});

		store.dispatch(playerStateActions['set/interactive'](true));
	}

	static onStopMessage() {
		const { playerState } = store.getState();
		const wasPlaying = playerState.playing;
		const wasStatus = playerState.status;
		log.debug('Stopping', wasPlaying);
		batch(() => {
			if (wasPlaying) {
				log.debug('Resetting cuepoint', wasPlaying);
				setCuePoint(wasPlaying, false);
			}
			store.dispatch(playerStateActions['set/playing'](false));
			if (wasStatus !== stream_status.LIVE_PLAYING) {
				store.dispatch(
					playerStateActions['set/status'](stream_status.LIVE_STOP)
				);
			}
		});
		if (this.isPlayingHere()) {
			this.player.stop();
			this.playingHere = false;
			forceNowPlayingTick.call(this);
		}
	}

	static stop() {
		if (isParentWindow()) {
			this.onStopMessage();
		} else {
			log.debug('Sending stop message to parent');
			window[config.siteframe_id]?.postMessage(
				{
					action: 'cmls-player:stop',
				},
				'*'
			);
		}
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
		this.player.playAd('vastAd', adConfig);
	}
}
