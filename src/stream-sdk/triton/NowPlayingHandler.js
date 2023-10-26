import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';

import fixSassJson from 'Utils/fixSassJson';

import baseConfig from 'Config';
const config = fixSassJson(baseConfig);

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / NowPlayingHandler');

import { setCuePoint } from './CuePointHandler';
import generateIdFromString from 'Utils/generateIdFromString';
import { SDK } from '..';

let nowPlayingInterval;

/**
 * Initialize timer interval to fetch now playing data
 */
export function initOfflineNowPlaying() {
	if (!this.player) {
		throw new Error('You must supply a player object parameter.');
	}
	if (!this.player.NowPlayingApi) {
		throw new Error('Player must have NowPlayingApi module.');
	}

	log.debug(
		'Attaching listener',
		{ event: 'list-loaded', callback: 'listLoaded' },
		listLoaded
	);
	this.player.addEventListener('list-loaded', listLoaded.bind(this));

	const interval = config.offline_nowplaying_interval || 60000;
	nowPlayingInterval = setInterval(nowPlayingTick.bind(this), interval);

	/*
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			log.debug('Tab hidden, pausing now playing interval');
			store.dispatch(playerStateActions['set/fetch_nowplaying'](false));
		} else {
			log.debug('Tab focus returned, resuming now playing interval');
			store.dispatch(playerStateActions['set/fetch_nowplaying'](true));
		}
	});
	*/

	log.debug('Offline Now Playing interval has begun.', { interval });
	nowPlayingTick.call(this);
}

export function forceNowPlayingTick() {
	nowPlayingTick.call(SDK, true);
}

/**
 * Called at nowPlayingInterval to fetch fresh Now Playing data for
 * all registered stations.
 * @returns  {void}
 */
function nowPlayingTick(forced) {
	const { playerState } = store.getState();

	if (!playerState.fetch_nowplaying && forced !== true) {
		log.debug('Now playing fetch globally disabled during this tick.');
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
		const last_cuepoint = station.last_cuepoint;
		const unresolved_requests = station.unresolved_nowplaying_requests;
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
			// try once every 10 minutes until we hit max * 1.5 unresolved requests
			if (
				unresolved_requests < max_unresolved_requests * 1.5 &&
				Date.now() - last_cuepoint > 600000
			) {
				log.debug(
					'Attempting a failsave now playing request after 10 minutes of being disabled.'
				);
				enableFetch(mount);
				//incrementUnresolvedRequests(mount);
				continue;
			} else {
				log.warn(
					`Mount has more than ${max_unresolved_requests} unresolved requests, disabling fetch.`,
					station
				);

				// Disable future fetching
				disableFetch(mount);
				continue;
			}
		}
		log.debug('Requesting last played', { mount, station });
		this.player.NowPlayingApi.load({
			mount,
			numberToFetch: 1,
		});
		incrementUnresolvedRequests(mount);
	}
}

/**
 * Handle a list-loaded event
 * @param {Event} e
 * @returns {void}
 */
const listLoaded = (e) => {
	const mount = e?.data?.mount;
	if (!mount) {
		log.warn('No mount in offline Now Playing data!', { event: e });
		return;
	}

	const { playerState } = store.getState();

	const station = playerState.stations[mount];
	if (!station) {
		log.warn(
			'Received offline Now Playing data for an unregistered station',
			{ event: e }
		);

		return;
	}

	decrementUnresolvedRequests(mount);

	// Don't handle a station already playing
	if (mount === playerState.playing) {
		return;
	}

	const cueData = e.data?.list?.length ? e?.data?.list[0] : false;
	if (!cueData) {
		log.debug('Offline Now Playing list was empty', { event: e, station });
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

	cueData.type = 'offline-track';

	log.debug('Received new offline Now Playing data', {
		event: e,
		cueData,
		station,
	});
	setCuePoint(mount, cueData);
	resetUnresolvedRequests(mount);
};

/**
 * Set fetch_nowplaying state for a station
 * @param {string} mount
 * @param {boolean} flag
 */
function setFetchFlag(mount, flag = true) {
	store.dispatch(playerStateActions['set/station/fetch_nowplaying'](flag));
}

/**
 * Enable fetch_nowplaying for a station
 * @param {string} mount
 */
const enableFetch = (mount) => {
	setFetchFlag(mount, true);
};

/**
 * Disable fetch_nowplaying for a station
 * @param {string} mount
 */
const disableFetch = (mount) => {
	setFetchFlag(mount, false);
};

/**
 * Increment unresolved requests tracker for a station
 * @param {string} mount
 */
const incrementUnresolvedRequests = (mount) => {
	store.dispatch(
		playerStateActions[
			'action/station/unresolved_nowplaying_requests/increment'
		]([mount])
	);
};

/**
 * Decrement unresolved requests tracker for a station
 * @param {string} mount
 */
const decrementUnresolvedRequests = (mount) => {
	store.dispatch(
		playerStateActions[
			'action/station/unresolved_nowplaying_requests/decrement'
		]([mount])
	);
};

const resetUnresolvedRequests = (mount) => {
	store.dispatch(
		playerStateActions['set/station/unresolved_nowplaying_requests']({
			[mount]: 0,
		})
	);
};
