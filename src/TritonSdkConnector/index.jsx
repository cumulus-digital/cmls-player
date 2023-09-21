import { h, Component, Fragment } from 'preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { useSelector, useDispatch } from 'react-redux';

import Logger from 'Utils/Logger';
import store from '../store';

import {
	playerStateActions,
	selectPlayerState,
} from '../store/playerStateSlice';

import { stream_status } from '../consts';

import sdkConfig from '../config.json';
// Remove single quotes necessary for using config in sass
for (let k in sdkConfig) {
	sdkConfig[k] = sdkConfig[k].replace(/^'(.*)'$/, '$1');
}
const { sdk_url, mediaplayer_id_prefix } = sdkConfig;

const log = new Logger('Triton SDK Connector');

let player;
window._CMLS = window._CMLS || {};

export function TritonSdkConnector(props) {
	const playerState = useSelector(selectPlayerState);
	const dispatch = useDispatch();
	const [nowPlayingEnabled, setNowPlayingEnabled] = useState({});

	const tdPlayerConfig = {
		coreModules: [
			{
				id: 'MediaPlayer',
				playerId: `${sdkConfig.mediaplayer_id_prefix}-player`,
				geoTargeting: {
					desktop: { isActive: false },
				},
				plugins: [{ id: 'vastAd' }],
			},
			{
				id: 'NowPlayingApi',
			},
			{
				id: 'Npe',
			},
		],
		playerReady: (e) => onPlayerReady(e),
		configurationError: (e) => onConfigError(e),
		moduleError: (e) => onModuleError(e),
		adBlockerDetected: (e) => adBlockerDetected(e),
	};

	const initSDK = () => {
		player = new window.TDSdk(tdPlayerConfig);
		window._CMLS.prplayer = player;
		log.debug('SDK Initialized', player);
	};

	const onPlayerReady = (e) => {
		if (!player) {
			throw new Error(
				'onPlayerReady called, but player is not available'
			);
			return;
		}

		const listeners = {
			'stream-status': onStreamStatus,
			'track-cue-point': onTrackCuePoint,
			'speech-cue-point': onTrackCuePoint,
			'ad-break-cue-point': onAdBreakStart,
			'ad-playback-start': showPrerollContainer,
			'ad-playback-complete': hidePrerollContainer,
			'ad-playback-error': hidePrerollContainer,
			'list-loaded': onNowPlayingListLoaded,
		};
		for (let k in listeners) {
			player.addEventListener(k, listeners[k]);
		}

		dispatch(playerStateActions['set/ready'](true));
		log.debug('Triton player is ready.');
	};

	const onConfigError = (e) => {
		log.warn('Configuration error', e);
	};

	const onModuleError = (e) => {
		log.warn('Module error', e);
	};

	const adBlockerDetected = (e) => {
		log.warn('Ad blocker detected', e);
		dispatch(playerStateActions['set/ad_blocker_detected'](true));
	};

	/**
	 * Update player's stream status.
	 * @param {Event} e
	 */
	const onStreamStatus = (e) => {
		if (typeof e?.data?.code === 'undefined') {
			return;
		}
		if (typeof stream_status?.[e.data.code] === 'undefined') {
			return;
		}

		dispatch(playerStateActions['set/status'](stream_status[e.data.code]));
	};

	const initNowPlaying = () => {
		const { playerState } = store.getState();
		Object.keys(playerState.station_data).forEach((mount) => {
			if (typeof nowPlayingEnabled[mount] !== 'undefined') {
				return;
			}
			nowPlayingTick(mount);
		});
	};

	const fetchNowPlaying = (mount) => {
		player.NowPlayingApi.load({
			mount,
			numberToFetch: 5,
		});
	};

	const onNowPlayingListLoaded = (e) => {
		if (!e?.data?.mount) {
			return;
		}
		const data = {
			station: e.data.mount,
			list: e.data.list.map((item) => {
				return {
					time: item.cueTimeStart,
					artist: item.artistName,
					title: item.cueTitle,
				};
			}),
		};
		log.debug('list-loaded', e, data);
		dispatch(playerStateActions['set/station/playlist'](data));
	};

	/**
	 * Receives a track cue point event and updates the relevant station's state
	 * @param {Event} e
	 * @returns
	 */
	const onTrackCuePoint = (e) => {
		if (typeof e?.data?.cuePoint === 'undefined') {
			return;
		}
		console.debug('Track cue point received', e);
		dispatch(
			playerStateActions['set/station/cuepoint']({
				artist: e.data.cuePoint?.artistName || null,
				title: e.data.cuePoint.cueTitle,
			})
		);
	};

	const onAdBreakStart = (e) => {
		if (typeof e?.data?.adBreakData === 'undefined') {
			return;
		}
		log.debug('Ad break start', e);
		dispatch(
			playerStateActions['set/station/cuepoint']({
				artist: 'Thanks for listening!',
				title: "We'll be back after these messages",
			})
		);
	};

	const showPrerollContainer = (e) => {
		const c = document.getElementById(
			`${sdkConfig.mediaplayer_id_prefix}-wrapper`
		);
		c && c.classList.add('playing');
	};

	const hidePrerollContainer = (e) => {
		const c = document.getElementById(
			`${sdkConfig.mediaplayer_id_prefix}-wrapper`
		);
		c && c.classList.remove('playing');
	};

	const startPreroll = (e) => {
		const { playerState } = store.getState();
		if (playerState.ad_blocker_detected) {
			startPlay();
			return;
		}

		['ad-playback-complete', 'ad-playback-error'].forEach((k) => {
			player.addEventListener(k, startPlay);
		});

		const current_station = playerState.current_station;
		if (current_station && playerState.station_data[current_station]) {
			const vast_url = playerState.station_data[current_station]?.vast;
			if (vast_url) {
				log.debug('Playing ad', vast_url);
				player.playAd('vastAd', { url: vast_url });
				return;
			}
			startPlay();
			return;
		}
		throw new Error('startPreroll called without a current station');
	};

	const startPlay = (e) => {
		['ad-playback-complete', 'ad-playback-error'].forEach((k) => {
			player.removeEventListener(k, startPlay);
		});
		const { playerState } = store.getState();

		if (!playerState.current_station) {
			throw new Error('startPlay called without a current station');
		}

		player.play({ mount: playerState.current_station });
	};
	const stopPlay = (e) => {
		['ad-playback-complete', 'ad-playback-error'].forEach((k) => {
			player.removeEventListener(k, startPlay);
		});

		player.stop();
	};

	/**
	 * Listen for changes to store's state and play/stop stream
	 */
	let startPlayDelay = null;
	const cancelStartPlayDelay = () => {
		if (startPlayDelay) {
			clearTimeout(startPlayDelay);
			startPlayDelay = null;
		}
	};
	useEffect(() => {
		if (!playerState.ready) {
			return;
		}

		cancelStartPlayDelay();
		stopPlay();
		if (playerState.playing) {
			startPlayDelay = setTimeout(() => {
				startPreroll();
				/*
				dispatch(
					playerStateActions['action/fetch/playlists'](
						playerState.current_station
					)
				);
				*/
			}, 250);
		}
	}, [playerState.playing, playerState.current_station]);

	/**
	 * Handle adding new stations to now playing api fetcher
	 */
	let fetchingNowPlaying = null;
	useEffect(() => {
		clearTimeout(fetchingNowPlaying);
		fetchingNowPlaying = null;

		if (playerState.playing) {
			log.debug(
				'Starting NowPlaying interval',
				playerState.current_station
			);
			fetchingNowPlaying = setInterval(() => {
				if (playerState.playing && playerState.current_station) {
					log.debug(
						'Refreshing NowPlaying',
						playerState.current_station
					);
					fetchNowPlaying(playerState.current_station);
				} else {
					dispatch(playerStateActions['set/station/playlist']());
				}
			}, 30000);
			fetchNowPlaying(playerState.current_station);
		}
		Object.values(playerState.station_data).forEach((station) => {
			if (station.mount !== playerState.currentStation) {
				log.debug('Clearing NowPlaying data', station.mount);
				dispatch(
					playerStateActions['set/station/playlist']({
						station: station.mount,
					})
				);
			}
		});
	}, [playerState.current_station, playerState.playing]);
	/*
	useEffect(() => {
		if (!playerState.ready) {
			return;
		}
		if (!playerState.fetch_nowplaying) {
			return;
		}

		fetchNowPlaying(playerState.fetch_nowplaying);
		dispatch(playerStateActions['action/fetch/playlists']());
	}, [playerState.fetch_nowplaying]);
	*/

	const SdkScript = useMemo(() => {
		return <script src={sdk_url} async onload={initSDK}></script>;
	}, []);

	const MediaPlayer = useMemo(() => {
		return (
			<div id={`${mediaplayer_id_prefix}-wrapper`}>
				<div class="container">
					<div id={`${mediaplayer_id_prefix}-player`}></div>
				</div>
			</div>
		);
	}, []);

	return (
		<>
			{MediaPlayer}
			{SdkScript}
		</>
	);
}

// export function TritonSdkConnector2(props) {
// 	const playerState = useSelector(selectPlayerState);
// 	const dispatch = useDispatch();

// 	const [hasAdBlocker, setHasAdBlocker] = useState(false);

// 	/**
// 	 * Initialize the Triton SDK
// 	 */
// 	const initSDK = () => {
// 		const tdPlayerConfig = {
// 			coreModules: [
// 				{
// 					id: 'MediaPlayer',
// 					playerId: `${mediaplayer_id_prefix}-player`,
// 					geoTargeting: {
// 						desktop: {
// 							isActive: false,
// 						},
// 					},
// 					plugins: [
// 						{
// 							id: 'vastAd',
// 						},
// 					],
// 				},
// 				{
// 					id: 'NowPlayingApi',
// 				},
// 				{
// 					id: 'Npe',
// 				},
// 			],
// 			playerReady: (e) => onPlayerReady(),
// 			configurationError: (e) => onConfigError(e),
// 			moduleError: (e) => onModuleError(e),
// 			adBlockerDetected: (e) => adBlockerDetected(e),
// 		};
// 		player = new window.TDSdk(tdPlayerConfig);
// 		log.debug('SDK Initialized', player);
// 	};

// 	/**
// 	 * Called when Triton SDK is ready to be used
// 	 * @param {Event} e
// 	 * @returns
// 	 */
// 	const onPlayerReady = (e) => {
// 		if (!player) {
// 			log.error('onPlayerReady called, but player is not available!');
// 			return;
// 		}

// 		const listeners = {
// 			'stream-status': onStreamStatus,
// 			'track-cue-point': onTrackCuePoint,
// 			'speech-cue-point': onTrackCuePoint,
// 			'ad-break-cue-point': onAdBreakStart,
// 			'ad-playback-start': showPrerollContainer,
// 			'ad-playback-complete': hidePrerollContainer,
// 			'ad-playback-error': hidePrerollContainer,
// 		};
// 		for (let k in listeners) {
// 			player.addEventListener(k, listeners[k]);
// 		}
// 		dispatch(playerStateActions.setReady(true));
// 		log.debug('Triton player is ready.');
// 	};
// 	const onConfigError = (e) => {
// 		log.warn('Configuration error', e);
// 	};
// 	const onModuleError = (e) => {
// 		log.warn('Module error', e);
// 	};
// 	const adBlockerDetected = (e) => {
// 		log.warn('Ad Blocker detected!');
// 		setHasAdBlocker(true);
// 	};

// 	/**
// 	 * Update player's stream status. Maps Triton code to stream_status.
// 	 * @param {Event} e
// 	 */
// 	const onStreamStatus = (e) => {
// 		if (
// 			typeof e?.data?.code === 'undefined' ||
// 			typeof stream_status?.[e.data.code] === 'undefined'
// 		) {
// 			return;
// 		}
// 		const { playerState } = store.getState();
// 		log.debug('Updating stream status', {
// 			current: playerState.status,
// 			new: stream_status[e.data.code],
// 		});
// 		//dispatch(playerStateActions.status(stream_status[e.data.code]));
// 		dispatch(playerStateActions['set/status'](stream_status[e.data.code]));
// 	};

// 	/**
// 	 * Receives a track cue point event and updates the relevant station's state
// 	 * @param {Event} e
// 	 */
// 	const onTrackCuePoint = (e) => {
// 		if (typeof e?.data?.cuePoint === 'undefined') {
// 			return;
// 		}
// 		log.debug('Received cue point', e);

// 		const { playerState } = store.getState();
// 		const { mount } = e.data;
// 		const station = mount.replace(/AAC$/, '');
// 		const { cueTitle: cuePointTitle, artistName: cuePointArtistName } =
// 			e.data.cuePoint;

// 		dispatch(
// 			playerStateActions.setStationData({
// 				[`${station}`]: {
// 					cuePointTitle,
// 					cuePointArtistName,
// 				},
// 			})
// 		);
// 	};

// 	const onAdBreakStart = (e) => {
// 		if (typeof e?.data?.adBreakData === 'undefined') {
// 			return;
// 		}
// 		const { playerState } = store.getState();
// 		log.debug('onAdBreakStart', e);
// 	};

// 	const showPrerollContainer = (e) => {
// 		const c = document.getElementById(`${mediaplayer_id_prefix}-wrapper`);
// 		c && c.classList.add('playing');
// 	};

// 	const hidePrerollContainer = (e) => {
// 		const c = document.getElementById(`${mediaplayer_id_prefix}-wrapper`);
// 		c && c.classList.remove('playing');
// 	};

// 	const startPreroll = (e) => {
// 		if (hasAdBlocker) {
// 			startPlay();
// 			return;
// 		}

// 		if (vast_url) {
// 			['ad-playback-complete', 'ad-playback-error'].forEach((k) => {
// 				player.addEventListener(k, startPlay);
// 			});
// 			player.playAd('vastAd', { url: vast_url });
// 		}
// 	};

// 	const startPlay = (e) => {
// 		['ad-playback-complete', 'ad-playback-error'].forEach((k) => {
// 			player.removeEventListener(k, startPlay);
// 		});

// 		player.play({ station: playerState.playing });
// 	};
// 	const stopPlay = (e) => {
// 		['ad-playback-complete', 'ad-playback-error'].forEach((k) => {
// 			player.removeEventListener(k, startPlay);
// 		});

// 		player.stop();
// 	};

// 	/**
// 	 * Handle call to start playing
// 	 */
// 	useEffect(() => {
// 		if (!playerState.ready) {
// 			return;
// 		}

// 		if (!playerState.playing) {
// 			stopPlay();
// 		} else {
// 			startPreroll();
// 		}
// 	}, [playerState.playing]);

// 	const SdkScript = useMemo(() => {
// 		return <script src={sdk_url} async onload={initSDK}></script>;
// 	}, []);

// 	const MediaPlayer = useMemo(() => {
// 		return (
// 			<div id={`${mediaplayer_id_prefix}-wrapper`}>
// 				<div class="container">
// 					<div id={`${mediaplayer_id_prefix}-player`}></div>
// 				</div>
// 			</div>
// 		);
// 	}, []);

// 	return (
// 		<>
// 			{MediaPlayer}
// 			{SdkScript}
// 		</>
// 	);
// }
