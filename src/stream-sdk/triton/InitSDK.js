import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';

import config from 'Config';
import fixSassJson from 'Utils/fixSassJson';
config = fixSassJson(config);

import sdkConfig from './sdk-config.json';

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / Init');

import { stream_status } from 'Consts';

import { initTrackCuePointHandler } from './CuepointHandler';
import { initOfflineNowPlaying } from './NowPlayingHandler';

export let player;

window._CMLS = window._CMLS || {};

export const initSDK = () => {
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

	player = new window.TDSdk(tdPlayerConfig);
	window._CMLS.webplayer_instance = player;
	log.debug('SDK Initialized', tdPlayerConfig, player);
};

const onPlayerReady = (e) => {
	if (!player) {
		log.error('onPlayerReady called, but player is not available.');
		throw new Error('onPlayerReady called, but player is not available.');
	}

	log.debug(
		'Attaching listener',
		{ event: 'stream-status', callback_name: onStreamStatusChange.name },
		onStreamStatusChange
	);
	player.addEventListener('stream-status', onStreamStatusChange);

	store.dispatch(playerStateActions['set/ready'](true));
	log.debug('SDK is ready.');

	initTrackCuePointHandler(player);
	initOfflineNowPlaying(player);

	const { playerState } = store.getState();

	log.debug('Modules configured.', playerState);
};

const onConfigError = (e) => {
	throw e;
};

const onModuleError = (e) => {
	throw e;
};

const adBlockerDetected = (e) => {
	log.warn('Ad blocker detected', e);
	store.dispatch(playerStateActions['set/ad_blocker_detected'](true));
};

const onStreamStatusChange = (e) => {
	if (typeof e?.data?.code === 'undefined') {
		return;
	}
	if (typeof stream_status?.[e.data.code] === 'undefined') {
		return;
	}

	const { playerState } = store.getState();

	log.debug('Status:', stream_status[e.data.code], e);
	store.dispatch(
		playerStateActions['set/status'](stream_status[e.data.code])
	);

	// Handle when stream automatically pauses
	if (
		playerState.playing &&
		stream_status[e.data.code] === stream_status.LIVE_PAUSE
	) {
		store.dispatch(playerStateActions['action/stop']());
	}
};
