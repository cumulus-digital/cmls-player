import store from 'Store';
import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

import domReady from 'Utils/domReady';

import config from 'Config';
import fixSassJson from 'Utils/fixSassJson';
config = fixSassJson(config);

import sdkConfig from '../sdk-config.json';
sdkConfig = fixSassJson(sdkConfig);

import { stream_status } from 'Consts';

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / MediaPlayer');

import(
	/* webpackChunkName: 'stream-sdk/triton/MediaPlayer' */
	/* webpackMode: 'lazy' */
	'./MediaPlayer.scss'
);

export const initMediaPlayer = (player, callback) => {
	return new MediaPlayer(player, callback);
};

export class MediaPlayer {
	el;
	player;
	playbackCompleteCallback;
	hasPlayed = false;

	constructor(player, callback) {
		this.player = player;
		if (callback) {
			this.playbackCompleteCallback = callback;
		}

		this.el = document.createElement('div');
		this.el.id = `${sdkConfig.mediaplayer_id_prefix}-wrapper`;
		this.el.innerHTML = `
			<div class="container">
				<div id="${sdkConfig.mediaplayer_id_prefix}-player"></div>
			</div>
		`;

		domReady(() => {
			if (
				!document.getElementById(
					`${sdkConfig.mediaplayer_id_prefix}-wrapper`
				)
			) {
				document.body.appendChild(this.el);
			}

			const listeners = {
				'ad-playback-complete': this.onPlaybackComplete.bind(this),
				'ad-playback-error': this.onPlaybackError.bind(this),
				'ad-playback-start': this.onPlaybackStart.bind(this),
			};

			for (let k in listeners) {
				player.addEventListener(k, listeners[k]);
			}
		});
	}

	isTimeForAnotherPreroll() {
		return true;

		const { playerState } = store.getState();

		if (playerState.minutes_between_preroll && playerState.last_preroll) {
			if (
				Date.now() - playerState.last_preroll <
				playerState.minutes_between_preroll * 60000
			) {
				return false;
			}
		}
		return true;
	}

	onPlaybackStart(e) {
		log.debug('Playback start');
		store.dispatch(playerStateActions['set/interactive'](false));
		this.hasPlayed = true;
		this.el.classList.add('show');
	}

	onPlaybackError(e) {
		log.debug('Playback error!', e);
		this.onPlaybackComplete(e);
	}

	onPlaybackComplete(e) {
		if (this.hasPlayed) {
			log.debug('Playback complete');
			store.dispatch(playerStateActions['set/last_preroll'](Date.now()));
		}
		store.dispatch(playerStateActions['set/interactive'](true));
		this.hasPlayed = false;
		this.el.classList.remove('show');

		if (this.playbackCompleteCallback) {
			this.playbackCompleteCallback();
		}
	}

	playVastAd(url, callback) {
		const { playerState } = store.getState();

		if (playerState.ad_blocker_detected) {
			log.debug('Ad blocker detected, skipping preroll');
			return this.onPlaybackComplete();
		}

		if (!this.isTimeForAnotherPreroll()) {
			log.debug('Last preroll was less than minutesBetweenPreroll', {
				minutes_between_preroll: playerState.minutes_between_preroll,
				now: Date.now(),
				last_preroll: playerState.last_preroll,
				last_preroll_in_minutes:
					(Date.now() - playerState.last_preroll) / 60000,
			});
			return this.onPlaybackComplete();
		}

		const vast_url = new URL(
			url || playerState.station_data?.[playerState?.playing]?.vast
		);

		if (!vast_url) {
			return this.onPlaybackComplete();
		}

		vast_url.searchParams.set('correlator', Date.now());
		vast_url.searchParams.set('description_url', window.self.location);
		vast_url.searchParams.set('url', window.self.location);

		const adConfig = {
			stationName: playerState.playing.replace('AAC', ''),
			url: vast_url.toString(),
			trackingParameters: { player: 'cmls-webplayer' },
		};

		if (callback) {
			this.playbackCompleteCallback = callback;
		}

		log.debug('Playing ad', adConfig);
		store.dispatch(
			playerStateActions['set/status'](stream_status.LIVE_PREROLL)
		);
		this.player.playAd('vastAd', adConfig);
	}
}
