import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';

import config from 'Config';
import fixSassJson from 'Utils/fixSassJson';
config = fixSassJson(config);

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / NowPlayingHandler');

import { generateCuepointTrackId } from './CuepointHandler';
import { setCuePoint } from './CuepointHandler';

let player;
let nowPlayingInterval;

/**
 * Initialize timer interval to fetch now playing data
 */
export const initOfflineNowPlaying = (newPlayer = null) => {
	if (!newPlayer) {
		throw new Error('You must supply a player object parameter.');
	}
	if (!newPlayer.NowPlayingApi) {
		throw new Error('Player must have NowPlayingApi module.');
	}

	player = newPlayer;

	log.debug(
		'Attaching listener',
		{ event: 'list-loaded', callback_name: listLoaded.name },
		listLoaded
	);
	player.addEventListener('list-loaded', listLoaded);

	const interval = config.offline_nowplaying_interval || 120000;
	nowPlayingInterval = setInterval(() => nowPlayingTick(), interval);

	log.debug('Offline Now Playing interval has begun.', { interval });
	nowPlayingTick();
};

/**
 * Called at nowPlayingInterval to fetch fresh Now Playing data for
 * all registered stations.
 * @returns  {void}
 */
const nowPlayingTick = () => {
	const { playerState } = store.getState();

	if (!Object.keys(playerState.station_data).length) {
		log.warn('nowPlayingTick: No stations registered.', {
			state: playerState,
		});
		return;
	}

	for (let mount in playerState.station_data) {
		const station = playerState.station_data[mount];
		const last_cuepoint_time = station.last_track_cuepoint_received;
		const unresolved_requests = station.unresolved_nowplaying_requests;
		const max_unresolved_requests =
			config.max_unresolved_nowplaying_requests || 10;

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
			// If last cuepoint was more than 30 minutes ago, re-enable fetch for next interval
			if (Date.now() - last_cuepoint_time > 1800000) {
				enableFetch(mount);
				resetUnresolvedRequests(mount);
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
		player.NowPlayingApi.load({
			mount,
			numberToFetch: 1,
		});
		incrementUnresolvedRequests(mount);
	}
};

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

	const station = playerState.station_data?.[mount];
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

	const cuepoint = e?.data?.list?.length ? e?.data?.list[0] : false;
	if (!cuepoint) {
		log.debug('Offline Now Playing list was empty', { event: e, station });
		return;
	}

	if (!cuepoint.trackID) {
		cuepoint.trackId = generateCuepointTrackId(
			cuepoint?.artistName,
			cuepoint?.cueTitle
		);
	}

	// Don't handle if track id hasn't changed
	if (cuepoint.trackID === station?.cuepoint?.track_id) {
		return;
	}

	cuepoint.type = 'offline-track';

	log.debug('Received new offline Now Playing data', {
		event: e,
		cuepoint,
		station,
	});
	setCuePoint(mount, cuepoint);
};

/**
 * Set fetch_nowplaying state for a station
 * @param {string} mount
 * @param {boolean} flag
 */
const setFetchFlag = (mount, flag = true) => {
	store.dispatch(
		playerStateActions['set/station/fetch_nowplaying']({
			[mount]: flag,
		})
	);
};

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
			'set/station/unresolved_nowplaying_requests/increment'
		](mount)
	);
};

/**
 * Decrement unresolved requests tracker for a station
 * @param {string} mount
 */
const decrementUnresolvedRequests = (mount) => {
	store.dispatch(
		playerStateActions[
			'set/station/unresolved_nowplaying_requests/decrement'
		](mount)
	);
};

/**
 * Reset unresolved requests tracker for a station to 0
 * @param {string} mount
 */
const resetUnresolvedRequests = (mount) => {
	store.dispatch(
		playerStateActions['set/station/unresolved_nowplaying_requests']({
			[mount]: 0,
		})
	);
};
