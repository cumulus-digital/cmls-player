import { h, Component, Fragment } from 'preact';
import throttle from 'lodash/throttle';

import store from 'Store';
import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

import isParentWindow from 'Utils/isParentWindow';
import domReady from 'Utils/domReady';

import config from 'Config';
import fixSassJson from 'Utils/fixSassJson';
config = fixSassJson(config);

import sdkConfig from './sdk-config.json';
sdkConfig = fixSassJson(sdkConfig);

import { stream_status } from 'Consts';

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK');

import { initSDK, player } from './InitSDK';
import { MediaPlayer } from './MediaPlayer';

export class TritonSDK {
	static player;
	static mediaPlayer;
	static scriptTag;
	static ready = false;
	static interactive = false;

	static previouslyPlayed = false;

	static init(scriptUrl) {
		//if (isParentWindow()) {
		this.scriptTag = document.createElement('script');
		this.scriptTag.setAttribute('async', true);
		this.scriptTag.setAttribute('src', scriptUrl);
		this.scriptTag.onload = (e) => {
			initSDK(this);
			this.mediaPlayer = new MediaPlayer(this.player, this.playStation);
			store.dispatch(playerStateActions['set/interactive'](true));
		};
		window.self.document.head.appendChild(this.scriptTag);

		// Handle stop requests across tabs
		store.subscribe(() => {
			const { playerState } = store.getState();

			if (!this.player) {
				return;
			}

			if (this.previouslyPlayed !== playerState.playing) {
				this.previouslyPlayed = playerState.playing;

				if (!playerState.playing) {
					this.stop();
				}
			}

			if (this.interactive !== playerState.interactive) {
				this.interactive = playerState.interactive;
			}
		});
		//}
	}

	static setPlayer(player) {
		this.player = player;
		return this.player;
	}
	static getPlayer() {
		return this.player;
	}

	static isReady() {
		return this.ready;
	}

	static isInteractive() {
		const { playerState } = store.getState();
		return this.ready && playerState.interactive;
	}

	static isPlaying() {
		const { playerState } = store.getState();
		return !!playerState.playing;
	}

	static play(mount) {
		const { playerState } = store.getState();

		if (!mount) {
			mount = playerState.station_primary;
		}

		/*
		if (!isPlaying()) {
			return;
		}
		*/

		if (this.isPlaying()) {
			this.stop();
		}

		log.debug('Play station!', { state: playerState });
		store.dispatch(playerStateActions['set/playing'](mount));
		store.dispatch(playerStateActions['set/interactive'](false));

		this.mediaPlayer.playVastAd(
			playerState.station_data[mount].vast,
			() => {
				this.beginStream(mount);
			}
		);
	}

	static beginStream(mount) {
		this.player.play({
			mount,
			trackingParameters: { player: 'cmls-webplayer' },
		});

		store.dispatch(playerStateActions['set/interactive'](true));
	}

	static stop() {
		const { playerState } = store.getState();

		this.player.stop();

		store.dispatch(playerStateActions['set/playing'](false));
		store.dispatch(playerStateActions['set/interactive'](true));
	}
}
TritonSDK.init(sdkConfig.sdk_url);

/*
if (isParentWindow()) {
	// Inject script tag and media player
	const scriptTag = document.createElement('script');
	scriptTag.setAttribute('async', true);
	scriptTag.setAttribute('src', sdkConfig.sdk_url);
	scriptTag.onload = (e) => {
		initSDK(e);
		mediaPlayerInstance = new MediaPlayer(player, playStation);
	};
	window.self.document.head.appendChild(scriptTag);

	const isReady = () => {
		const { playerState } = store.getState();
		return !!playerState.ready;
	};

	const isInteractive = () => {
		const { playerState } = store.getState();
		return isReady() && !!playerState.interactive;
	};

	const isPlaying = () => {
		const { playerState } = store.getState();
		return !!playerState.playing;
	};

	const playStation = () => {
		const { playerState } = store.getState();

		if (!isPlaying()) {
			return;
		}

		log.debug('Play station!', { state: playerState });

		player.play({
			mount: playerState.playing,
			trackingParameters: { player: 'cmls-webplayer' },
		});

		store.dispatch(playerStateActions['set/interactive'](true));
	};

	const stopStation = () => {
		const { playerState } = store.getState();

		player.stop();

		store.dispatch(playerStateActions['set/interactive'](true));
	};

	const beginPreroll = () => {
		const { playerState } = store.getState();
		mediaPlayerInstance.playVastAd();
	};

	const togglePlay = throttle(
		() => {
			const { playerState } = store.getState();

			if (!isInteractive()) {
				return;
			}

			if (!isPlaying()) {
				log.debug('togglePlay stop');
				stopStation();
				return;
			}

			log.debug('togglePlay play');
			store.dispatch(playerStateActions['set/interactive'](false));

			if (playerState.status !== stream_status.LIVE_STOP) {
				player.stop();
				setTimeout(() => beginPreroll(), 200);
			} else {
				beginPreroll();
			}
		},
		200,
		{ leading: true, trailing: false }
	);

	let lastPlaying;
	store.subscribe(() => {
		const { playerState } = store.getState();

		if (!player) {
			return;
		}

		if (lastPlaying === playerState.playing) {
			return;
		}

		if (lastPlaying && playerState.playing) {
			log.debug('Switching stations', {
				previous: lastPlaying,
				next: playerState.playing,
			});

			player.stop();
			setTimeout(() => beginPreroll(playStation), 200);
			lastPlaying = playerState.playing;
			return;
		}

		if (!lastPlaying && playerState.playing) {
			lastPlaying = playerState.playing;
			beginPreroll(playStation);
			return;
		}

		if (!playerState.playing) {
			lastPlaying = playerState.playing;
			player.stop();
		}
	});
}
*/
