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
			'ad-break-cue-point-complete': onAdBreakEnd,
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

	const setUnknownCuepoint = () => {
		const { playerState } = store.getState();
		log.debug(
			playerState.current_station,
			playerState.station_data[playerState.current_station]
		);
		let cuedata = {
			artist: '',
			title: '',
		};
		if (
			playerState.current_station &&
			playerState.station_data[playerState.current_station].tagline
		) {
			cuedata.artist =
				playerState.station_data[playerState.current_station].tagline;
		}
		dispatch(playerStateActions['set/station/cuepoint'](cuedata));
	};

	const onAdBreakStart = (e) => {
		if (typeof e?.data?.adBreakData === 'undefined') {
			return;
		}
		log.debug('Ad break start', e);
		setUnknownCuepoint();
		/*
		dispatch(
			playerStateActions['set/station/cuepoint']({
				artist: 'Ad',
				title: "Thanks for listening! We'll be back after these messages.",
			})
		);
		*/
	};

	const onAdBreakEnd = (e) => {
		log.debug('Ad break end', e);
		setUnknownCuepoint();
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
		clearInterval(fetchingNowPlaying);
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
