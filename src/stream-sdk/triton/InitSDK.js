import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';

import fixSassJson from 'Utils/fixSassJson';

import baseConfig from 'Config';
const config = fixSassJson(baseConfig);

import baseSDKConfig from './config.json';
const sdkConfig = fixSassJson(baseSDKConfig);

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / Init');

import { stream_status } from 'Consts';

import { initTrackCuePointHandler } from './CuePointHandler';
import { initOfflineNowPlaying } from './NowPlayingHandler';
import { MediaPlayer } from './MediaPlayer';

import { appSignals } from '@/signals';

export function initSdk() {
	if (!window.TDSdk) {
		throw new Error(
			'initSDK called without window.TDSdk available! Triton SDK must be included.'
		);
	}

	const tdPlayerConfig = {
		...sdkConfig.td_player_config,
		playerReady: onPlayerReady.bind(this),
		configurationError: onConfigError.bind(this),
		moduleError: onModuleError.bind(this),
		adBlockerDetected: adBlockerDetected.bind(this),
	};

	// Generate random mediaplayer ID
	this.mediaPlayerId = Math.floor(100000000 + Math.random() * 900000000);
	tdPlayerConfig.coreModules.find(
		(mod) => mod.id == 'MediaPlayer'
	).playerId = `${config.mediaplayer_id_prefix}-${this.mediaPlayerId}`;

	const player = this.setPlayer(new window.TDSdk(tdPlayerConfig));
	log.debug('SDK Initialized, awaiting ready state', tdPlayerConfig, player);

	this.mediaPlayer = new MediaPlayer();
}

function onPlayerReady(e) {
	if (!this.player) {
		log.error('onPlayerReady called, but player is not available.');
		throw new Error('onPlayerReady called, but player is not available.');
	}

	log.debug(
		'Attaching listener',
		{
			event: 'stream-status',
			callback_name: onStreamStatusChange.bind(this).name,
		},
		onStreamStatusChange.bind(this)
	);
	this.player.addEventListener(
		'stream-status',
		onStreamStatusChange.bind(this)
	);

	this.setReady(true);
	log.debug('SDK is ready.');

	initTrackCuePointHandler.call(this);
	initOfflineNowPlaying.call(this);
	if (this.mediaPlayer) {
		this.mediaPlayer.init();
	}

	log.debug('Modules configured.', this);
}

function onConfigError(e) {
	throw e;
}

function onModuleError(e) {
	throw e;
}

function adBlockerDetected(e) {
	log.warn('Ad blocker detected', e);
	//store.dispatch(playerStateActions['set/ad_blocker_detected'](true));
	appSignals.sdk.ad_blocker_detected.value = true;
}

function onStreamStatusChange(e) {
	if (typeof e?.data?.code === 'undefined') {
		return;
	}
	if (typeof stream_status?.[e.data.code] === 'undefined') {
		return;
	}

	log.debug('Status change:', stream_status[e.data.code], e);
	store.dispatch(
		playerStateActions['set/status'](stream_status[e.data.code])
	);

	// Handle when stream automatically pauses
	const { playerState } = store.getState();
	if (
		playerState.playing &&
		stream_status[e.data.code] === stream_status.LIVE_PAUSE
	) {
		this.stop();
	}
}
