import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';

import { fetchItunesArtwork } from 'Utils/iTunesHelper';

import config from 'Config';
import fixSassJson from 'Utils/fixSassJson';
config = fixSassJson(config);

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / CuepointHandler');

let player;

/**
 * Initialize online track change handlers
 *
 * @param {object} newPlayer Triton player instance
 */
export const initTrackCuePointHandler = (newPlayer) => {
	if (!newPlayer) {
		throw new Error('You must supply a player object parameter.');
	}
	if (!newPlayer.NowPlayingApi) {
		throw new Error('Player must have NowPlayingApi module.');
	}

	player = newPlayer;

	const listeners = {
		'track-cue-point': onTrackCuePoint.bind(this),
		'speech-cue-point': onSpeechCuePoint.bind(this),
		'ad-break-cue-point': onAdBreakCuePointStart.bind(this),
		'ad-break-cue-point-complete': onAdBreakCuePointComplete.bind(this),
	};

	for (let ev in listeners) {
		log.debug(
			'Attaching listener',
			{ event: ev, callback_name: listeners[ev].name },
			listeners[ev]
		);
		player.addEventListener(ev, listeners[ev]);
	}
};

/**
 * Handle live track cuepoint events
 */
export const onTrackCuePoint = (e) => {
	const { playerState } = store.getState();

	const cuePoint = e?.data?.cuePoint;

	if (!cuePoint) {
		log.warn('Received a live track cue point without cuePoint data!', {
			event: e,
			state: playerState,
		});
		return;
	}

	const mount = cuePoint.mount;
	if (!mount) {
		log.warn('Received a live track cue point without a mount!', {
			event: e,
			state: playerState,
		});
		return;
	}

	log.debug('Live track cue point received', {
		event: e,
		state: playerState,
	});

	setCuePoint(mount, cuePoint);

	if (config.fetch_artwork) {
		// Call itunes artwork fetcher
	}
};

/**
 * Handle speech cue points (is this ever used?)
 */
export const onSpeechCuePoint = (e) => {
	const { playerState } = store.getState();

	const cuePoint = e?.data?.cuePoint;

	if (!cuePoint) {
		log.warn('Received a speach cue point without cuePoint data!', {
			event: e,
			state: playerState,
		});
		return;
	}

	const mount = cuePoint.mount;
	if (!mount) {
		log.warn('Received a speech cue point without a mount!', {
			event: e,
			state: playerState,
		});
		return;
	}

	log.debug('Speech cue point received', {
		event: e,
		state: playerState,
	});

	setCuePoint(mount, cuePoint);
};

/**
 * Handle an ad-break-cue-point event
 * @param {Event} e
 * @returns
 */
export const onAdBreakCuePointStart = (e) => {
	const { playerState } = store.getState();

	const station = playerState.station_data?.[playerState?.playing];
	if (!station) {
		log.warn('Received an ad break cue without a playing station', {
			event: e,
			state: playerState,
		});
		return;
	}

	log.debug('Ad break start', { event: e, state: playerState });

	setCuePoint(playerState.playing, {
		artistName: station?.name || '',
		cueTitle: "We'll return after these messages",
		type: 'ad',
	});
};

/**
 * Handle an ad-break-cue-point-complete event
 * @param {Event} e
 * @returns
 */
export const onAdBreakCuePointComplete = (e) => {
	const { playerState } = store.getState();

	const station = playerState.station_data?.[playerState?.playing];
	if (!station) {
		log.warn('Received an ad break cue without a playing station', {
			event: e,
			state: playerState,
		});
		return;
	}

	log.debug('Ad break complete', { event: e, state: playerState });
	setCuePoint(playerState.playing);
};

/**
 * Update a registered station's current cuepoint
 *
 * @param {string} mount Station mount ID
 * @param {object} cuePoint
 * @returns {void}
 */
export const setCuePoint = (mount, cuePoint = {}) => {
	const { playerState } = store.getState();

	if (!mount || !playerState.station_data?.[mount]) {
		log.warn('Attempted to set cuepoint without a registered mount', {
			mount,
			cuePoint,
			playerState,
		});
		return;
	}

	let cueData = {
		artist: '',
		title: '',
		track_id: '',
		type: '',
	};

	if (!cuePoint) {
		cueData = {
			...cueData,
			artist: playerState.staton_data[mount]?.name || '',
			title: playerState.station_data[mount]?.tagline || '',
		};
	} else {
		cueData = {
			...cueData,
			artist: cuePoint?.artistName || '',
			title: cuePoint?.cueTitle || '',
			track_id: cuePoint?.trackID || '',
			type: cuePoint?.type || '',
		};
	}

	// If no track id is provided, generate one from artist+title
	if (!cueData.track_id) {
		cueData.track_id = generateCuepointTrackId(
			cueData.artist,
			cueData.title
		);
	}

	log.debug('Setting cue point', {
		mount,
		received: cuePoint,
		using: cueData,
	});

	store.dispatch(
		playerStateActions['set/station/cuepoint']({ [mount]: cueData })
	);

	if (cueData?.type?.includes('track')) {
		updateLastTrackCuepointReceived(mount);

		// Fetch artwork
		fetchItunesArtwork(cueData.artist, cueData.title)
			.then((artUrl) => {
				if (artUrl?.length) {
					log.debug('Got artwork', artUrl);
					store.dispatch(
						playerStateActions['set/station/cuepoint/artwork']({
							[mount]: artUrl,
						})
					);
				} else {
					store.dispatch(
						playerStateActions['set/station/cuepoint/artwork']({
							[mount]: '',
						})
					);
				}
			})
			.catch((e) => {
				store.dispatch(
					playerStateActions['set/station/cuepoint/artwork']({
						[mount]: '',
					})
				);
			});
	}
};

/**
 * Update the time when a station last received a cuepoint
 *
 * @param {string} mount Registered station mount ID
 */
const updateLastTrackCuepointReceived = (mount) => {
	store.dispatch(
		playerStateActions['set/station/last_track_cuepoint_received']({
			[mount]: Date.now(),
		})
	);
};

/**
 * Generate a track id
 *
 * @param {string} artist
 * @param {string} title
 * @returns {string}
 */
export const generateCuepointTrackId = (artist, title) => {
	let value = artist + title;
	let res = 0;
	for (let i = 0; i < value.length; i++) {
		res += value.charCodeAt(i);
	}
	return res % 16;
};
