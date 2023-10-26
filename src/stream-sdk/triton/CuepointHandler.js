import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / CuePointHandler');

import generateIdFromString from 'Utils/generateIdFromString';
import { fetchItunesArtwork } from 'Utils/iTunesHelper';

export function initTrackCuePointHandler() {
	if (!this.player) {
		throw new Error('Track Cue Point Handler initialized without player.');
	}

	if (!this.player.NowPlayingApi) {
		throw new Error('Player must have NowPlayingApi module.');
	}

	const listeners = {
		'track-cue-point': onTrackCuePoint.bind(this),
		'speech-cue-point': onSpeechCuePoint.bind(this),
		'custom-cue-point': onCustomCuePoint.bind(this),
		'ad-break-cue-point': onAdBreakCuePointStart.bind(this),
		'ad-break-cue-point-complete': onAdBreakCuePointComplete.bind(this),
	};

	for (let ev in listeners) {
		log.debug(
			'Attaching listener',
			{ event: ev, callback_name: listeners[ev].name },
			listeners[ev]
		);
		this.player.addEventListener(ev, listeners[ev]);
	}
}

export function onTrackCuePoint(e) {
	const cuePoint = e?.data?.cuePoint;

	const { playerState } = store.getState();

	const logExtra = { event: e, playerState };

	if (!cuePoint) {
		log.warn(
			'Received a live track cue point without cuePoint data!',
			logExtra
		);
		return;
	}

	const mount = cuePoint.mount;
	if (!mount) {
		log.warn('Received a live track cue point without a mount!', logExtra);
		return;
	}

	log.debug('Live track cue point received', logExtra);

	setCuePoint(mount, cuePoint);
}

export function fetchArtwork(mount, cuePoint = null) {
	const { playerState } = store.getState();

	if (!cuePoint) {
		cuePoint = playerState.cuepoints?.[mount];
	}

	const station = playerState.stations[mount];

	if (cuePoint && cuePoint.artist !== station?.name && !cuePoint?.artwork) {
		store.dispatch(
			playerStateActions['set/station/cuepoint/artwork']({
				[mount]: false,
			})
		);
		fetchItunesArtwork(cuePoint.artist, cuePoint.title)
			.then((artUrl) => {
				if (artUrl?.length) {
					log.debug('Setting cuepoint artwork', {
						mount,
						cuePoint,
						artUrl,
					});
					store.dispatch(
						playerStateActions['set/station/cuepoint/artwork']({
							[mount]: artUrl,
						})
					);
				} else {
					log.debug('No artwork found', { mount, cuePoint, artUrl });
					store.dispatch(
						playerStateActions['set/station/cuepoint/artwork']({
							[mount]: false,
						})
					);
				}
			})
			.catch((e) => {
				log.debug('Could not fetch artwork!', { mount, cuePoint });
				store.dispatch(
					playerStateActions['set/station/cuepoint/artwork']({
						[mount]: false,
					})
				);
			});
	}
}

export function onSpeechCuePoint(e) {
	const cuePoint = e?.data?.cuePoint;

	const { playerState } = store.getState();

	const logExtra = { event: e, playerState };

	if (!cuePoint) {
		log.warn(
			'Received a live speech cue point without cuePoint data!',
			logExtra
		);
		return;
	}

	const mount = cuePoint.mount;
	if (!mount) {
		log.warn('Received a live speech cue point without a mount!', logExtra);
		return;
	}

	log.debug('Live speech cue point received', logExtra);

	setCuePoint(mount, cuePoint);
}

export function onCustomCuePoint(e) {
	log.debug('Custom cue point received', e);
}

export function onAdBreakCuePointStart(e) {
	const { playerState } = store.getState();

	const station = playerState.stations[playerState.playing];
	if (!station) {
		log.warn('Received an ad break cue point without a playing station!', {
			event: e,
			playerState,
		});
		return;
	}

	log.debug('Ad break start', { event: e, playerState });

	setCuePoint(playerState.playing, {
		artistName: station?.tagline || '',
		cueTitle: "We'll return after these messages",
		type: 'ad',
	});
}

export function onAdBreakCuePointComplete(e) {
	const { playerState } = store.getState();

	const station = playerState.stations[playerState.playing];
	if (!station) {
		log.warn('Received an ad break cue point without a playing station!', {
			event: e,
			playerState,
		});
		return;
	}

	log.debug('Ad break complete', { event: e, playerState });
	setCuePoint(playerState.playing);
}

export function setCuePoint(mount, cuePoint = {}) {
	const { playerState } = store.getState();

	if (!mount || !playerState.stations[mount]) {
		log.warn('Attempted to set a cue point without a registered mount.', {
			mount,
			cuePoint,
			playerState,
		});

		return;
	}

	const station = playerState.stations[mount];
	const cuepoint = playerState.cuepoints[mount];

	let cueData = {
		artist: cuePoint.artistName || station.name || '',
		title: cuePoint.cueTitle || station.tagline || '',
		track_id: cuePoint.trackID || '',
		type: cuePoint.type || '',
	};

	/*
	if (!cuePoint) {
		cueData = {
			...cueData,
			artist: station.name || '',
			title: station.tagline || '',
		};
	} else {
		cueData = {
			...cueData,
			artist: cuePoint.artistName || '',
			title: cuePoint.cueTitle || '',
			track_id: cuePoint.trackID || '',
			type: cuePoint.type || '',
		};
	}
	*/

	// If we're playing but no artist or title is set, use our tagline
	if (playerState.playing && !(cueData.artist && cueData.title)) {
		cueData = {
			artist: station.tagline || '',
			title: '',
			type: 'tagline',
		};
	}

	// If no track id is provided, generate one from artist+title
	if (!cueData.track_id) {
		cueData.track_id = generateIdFromString(
			[cueData.artist, cueData.title]
				.filter((k) => (k.trim ? k.trim() : ''))
				.join(' – ')
		);
	}

	if (cueData.track_id !== cuepoint?.track_id) {
		log.debug('Setting cue point', {
			mount,
			received: cuePoint,
			using: cueData,
		});

		store.dispatch(
			playerStateActions['set/station/cuepoint']({ [mount]: cueData })
		);
	}

	if (cueData.type === 'track') {
		// fetch artwork for track types
		fetchArtwork(mount, cueData);
	}
}
