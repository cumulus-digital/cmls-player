import { h } from 'Utils/createElement';

import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';

import baseConfig from 'Config';
import fixSassJson from 'Utils/fixSassJson';
const config = fixSassJson(baseConfig);

//import baseSDKConfig from './config.json';
//const sdkConfig = fixSassJson(baseSDKConfig);

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / MediaPlayer');

import { stream_status } from 'Consts';

import { SDK } from '..';
import { batch } from 'react-redux';

export class MediaPlayer {
	el;
	player;
	defaultCallback;
	playbackCompleteCallback;
	hasPlayed = false;

	constructor(defaultCallback = null) {
		if (defaultCallback) {
			this.defaultCallback = defaultCallback;
		}

		import(
			/* webpackChunkName: 'stream-sdk/triton/MediaPlayer' */
			/* webpackMode: 'lazy' */
			'./MediaPlayer.scss'
		);

		this.el = (
			<div class={`cmls-player-mediaplayer do-not-remove`}>
				<div class="container">
					<div
						id={`${config.mediaplayer_id_prefix}-${SDK.mediaPlayerId}`}
						class="player"
					></div>
				</div>
			</div>
		);
		document.body.appendChild(this.el);

		const listeners = {
			'ad-playback-complete': this.onPlaybackComplete.bind(this),
			'ad-playback-error': this.onPlaybackError.bind(this),
			'ad-playback-start': this.onPlaybackStart.bind(this),
		};

		for (let k in listeners) {
			SDK.getPlayer().addEventListener(k, listeners[k]);
		}
	}

	isTimeForAnotherPreroll() {
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
		log.warn('Playback error!', e);
		this.onPlaybackComplete(e);
	}

	onPlaybackComplete(e) {
		batch(() => {
			if (this.hasPlayed) {
				log.debug('Playback complete');
				store.dispatch(
					playerStateActions['set/last_preroll'](Date.now())
				);
			}
			store.dispatch(playerStateActions['set/interactive'](true));
		});
		this.hasPlayed = false;
		this.el.classList.remove('show');

		if (this.playbackCompleteCallback) {
			return this.playbackCompleteCallback();
		}
		if (this.defaultCallback) {
			return this.defaultCallback();
		}
	}

	playVastAd(url, callback = null) {
		if (callback) {
			this.playbackCompleteCallback = callback;
		}

		const { playerState } = store.getState();

		if (playerState.ad_blocker_detected) {
			log.debug('Ad blocker detected, skipping preroll');
			return this.onPlaybackComplete();
		}

		if (!this.isTimeForAnotherPreroll()) {
			log.debug(
				'Last preroll was less than minutes_betwee_preroll',
				playerState.minutes_between_preroll
			);
			return this.onPlaybackComplete();
		}

		const vast_url = new URL(
			url || playerState.station_data?.[playerState.playing]?.vast
		);

		if (!vast_url) {
			log.debug('Invalid vast URL', {
				called_with: url,
				station_state_has:
					playerState.station_data?.[playerState.playing]?.vast,
			});
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
		SDK.playVastAd(adConfig);
	}
}