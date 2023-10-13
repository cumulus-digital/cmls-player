import { h, Component, Fragment } from 'preact';
import {
	useState,
	useMemo,
	useEffect,
	useLayoutEffect,
	useRef,
} from 'preact/hooks';
import { memo } from 'preact/compat';
import { useSelector, useDispatch } from 'react-redux';

import store from 'Store';
import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

import fixSassJson from 'Utils/fixSassJson';
import config from 'Config';
config = fixSassJson(config);

import { stream_status } from 'Consts';

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / MediaPlayer');

import(
	/* webpackChunkName: 'stream-sdk/triton/MediaPlayer' */
	/* webpackMode: 'lazy' */
	'./MediaPlayer.scss'
);

const isTimeForAnotherPreroll = () => {
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
};

const MediaPlayer = memo((props) => {
	const playerState = useSelector(playerStateSelect);
	const dispatch = useDispatch();

	const [visible, setVisible] = useState(false);
	const visibleRef = useRef();
	visibleRef.current = visible;

	// Stored to ensure that an ad actually played,
	// prevents rapid play/stop from triggering last_preroll
	const [hasPlayed, setHasPlayed] = useState(false);
	const playedRef = useRef();
	playedRef.current = hasPlayed;

	const playbackComplete = (e) => {
		if (playedRef.current) {
			log.debug('Playback complete.');
			dispatch(playerStateActions['set/last_preroll'](Date.now()));
		}
		dispatch(playerStateActions['set/interactive'](true));
		setHasPlayed(false);
		setVisible(false);
		props.onPlaybackComplete();
	};

	const playbackError = (e) => {
		log.debug('Playback error.', e);
		dispatch(playerStateActions['set/interactive'](true));
		setVisible(false);
		props.onPlaybackError
			? props.onPlaybackError()
			: props.onPlaybackComplete();
	};

	const playbackStarts = (e) => {
		log.debug('Playback begin.', e);
		//dispatch(playerStateActions['set/last_preroll'](Date.now()));
		dispatch(playerStateActions['set/interactive'](false));
		setHasPlayed(true);
		setVisible(true);
	};

	useEffect(() => {
		if (!props.player) {
			return;
		}

		if (playerState.ad_blocker_detected) {
			log.debug('Ad blocker detected, skipping preroll');
			return playbackComplete();
		}

		props.player.addEventListener('ad-playback-complete', playbackComplete);
		props.player.addEventListener('ad-playback-error', playbackError);
		props.player.addEventListener('ad-playback-start', playbackStarts);

		const vast_url = props.vastURL
			? props.vastURL
			: playerState.station_data?.[playerState?.playing]?.vast;
		if (vast_url) {
			log.debug('Playing ad', vast_url);
			dispatch(
				playerStateActions['set/status'](stream_status.LIVE_PREROLL)
			);
			props.player.playAd('vastAd', { url: vast_url });
		} else {
			playbackComplete();
		}

		return () => {
			log.debug('Removing listeners');
			props.player.removeEventListener(
				'ad-playback-complete',
				playbackComplete
			);
			props.player.removeEventListener(
				'ad-playback-error',
				playbackError
			);
			props.player.removeEventListener(
				'ad-playback-start',
				playbackStarts
			);
		};
	}, [props.player]);

	useEffect(() => {
		return;
		/*
		if (!props.show) {
			setVisible(false);
			return;
		}
		*/

		if (playerState.ad_blocker_detected) {
			log.debug('Ad blocker detected, skipping preroll');
			return playbackComplete();
		}

		/*
		if (!isTimeForAnotherPreroll()) {
			log.debug('Last preroll was less than minutesBetweenPreroll', {
				minutes_between_preroll: playerState.minutes_between_preroll,
				now: Date.now(),
				last_preroll: playerState.last_preroll,
				last_preroll_in_minutes:
					(Date.now() - playerState.last_preroll) / 60000,
			});
			return playbackComplete();
		}
		*/

		const vast_url = props.vastURL
			? props.vastURL
			: playerState.station_data?.[playerState?.playing]?.vast;
		if (vast_url) {
			log.debug('Playing ad', vast_url);
			dispatch(
				playerStateActions['set/status'](stream_status.LIVE_PREROLL)
			);
			props.player.playAd('vastAd', { url: vast_url });
		} else {
			playbackComplete();
		}
	}, []);

	return (
		<div
			id={`${props.idPrefix}-wrapper`}
			class={visibleRef.current ? 'playing' : ''}
		>
			<div class="container">
				<div id={`${props.idPrefix}-player`}></div>
			</div>
		</div>
	);
});
export default MediaPlayer;
