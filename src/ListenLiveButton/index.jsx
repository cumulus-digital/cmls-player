import { h, Component, Fragment, createRef } from 'preact';
import {
	useState,
	useMemo,
	useEffect,
	useRef,
	useId,
	useLayoutEffect,
} from 'preact/hooks';
import { useSelector, useDispatch } from 'react-redux';

import Logger from 'Utils/Logger';
import fixSassJson from 'Utils/fixSassJson';

import store from 'Store';
import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

import { stream_status } from 'Consts';

import config from 'Config';
config = fixSassJson(config);

const log = new Logger('Listen Live Button');

import PlayIcon from './PlayIcon';
import ScrollLabel from './ScrollLabel';
import Dropdown from './Dropdown';
import Artwork from './Artwork';
import { memo } from 'preact/compat';

import { SDK } from '../stream-sdk';

export default memo((props) => {
	const playerState = useSelector(playerStateSelect);
	const dispatch = useDispatch();
	const [isPlaying, setIsPlaying] = useState(false);
	const [statusClass, setStatusClass] = useState(new Set(['stopped']));
	const [multiStation, setMultiStation] = useState(false);
	const [buttonStateLabel, setButtonStateLabel] = useState('Listen Live!');
	const [showCueLabel, setShowCueLabel] = useState(false);
	const [cueLabel, setCueLabel] = useState('');

	const [buttonBottom, setButtonBottom] = useState('55px');

	const ref = useRef(null);

	useLayoutEffect(() => {
		import(
			/* webpackChunkName: 'listen-live-button' */
			/* webpackMode: 'eager' */
			/* webpackPrefetch: true */
			/* webpackPreload: true */
			'./style.scss?inline'
		).then((style) => {
			if (style?.default?.use) {
				style.default.use({ target: ref.current.parentNode });
			}
		});
	}, [ref]);

	/**
	 * Close the dropdown from anywhere
	 * @param {Event} e
	 */
	const handleKeyDown = (e) => {
		if (!playerState.interactive) {
			return;
		}

		const key = e.key;
		if (key === 'Esc' || key === 'Escape') {
			e.stopPropagation();
			e.preventDefault();
			dispatch(playerStateActions['action/dropdown-close']());
		}
	};

	const togglePlay = (e) => {
		e.preventDefault();

		if (playerState.playing) {
			dispatch(playerStateActions['action/stop']());
			//SDK.stop();
			setIsPlaying(false);
		} else {
			/*
			dispatch(
				playerStateActions['action/play'](playerState.station_primary)
			);
			*/
			SDK.play(playerState.station_primary);
			setIsPlaying(true);
		}
	};

	useLayoutEffect(() => {
		let newButtonLabel = `${buttonStateLabel}`;
		let newCueLabel = `${cueLabel}`;

		statusClass.delete('activity');
		statusClass.delete('playing');
		statusClass.delete('stopped');

		switch (playerState.status) {
			case stream_status.LIVE_PREROLL:
			case stream_status.LIVE_CONNECTING:
			case stream_status.LIVE_RECONNECTING:
				statusClass.add('activity');
				newButtonLabel = 'Connecting…';
				newCueLabel = 'The stream will begin momentarily…';
				break;
			case stream_status.LIVE_BUFFERING:
				statusClass.add('activity');
				newButtonLabel = 'Buffering…';
				newCueLabel = 'The stream will begin momentarily…';
				break;
			case stream_status.LIVE_PLAYING:
				statusClass.add('playing');
				newButtonLabel =
					playerState.station_data?.[playerState.playing]?.name ||
					'Now Playing';
				newCueLabel = '';
				break;
			case stream_status.LIVE_STOP:
				statusClass.add('stopped');
				newButtonLabel = 'Listen Live!';
				newCueLabel = '';
				break;
			case stream_status.LIVE_FAILED:
				statusClass.add('stopped');
				newButtonLabel = 'Error!';
				newCueLabel = 'Please try again later…';
				break;
			case stream_status.STATION_NOT_FOUND:
				statusClass.add('stopped');
				newButtonLabel = 'Error!';
				newCueLabel = 'Station not found';
				break;
			case stream_status.PLAY_NOT_ALLOWED:
				statusClass.add('stopped');
				newButtonLabel = 'Not Allowed';
				newCueLabel =
					'Playback is not allowed. Please try again later.';
				break;
			case stream_status.STREAM_GEO_BLOCKED:
			case stream_status.STREAM_GEO_BLOCKED_ALTERNATE:
			case stream_status.STREAM_GEO_BLOCKED_NO_ALTERNATE:
				statusClass.add('stopped');
				newButtonLabel = 'Unavailable';
				newCueLabel =
					'Sorry, this content is not available in your area';
		}

		setStatusClass(statusClass);

		const cuePointSource =
			playerState.playing || playerState.station_primary;
		const cuePointStation = playerState.station_data?.[cuePointSource];
		if (cuePointStation?.cuepoint) {
			const labelArray = [
				cuePointStation.cuepoint?.artist,
				cuePointStation.cuepoint?.title,
			].filter((k) => k);

			if (cuePointStation.cuepoint.type === 'offline-track') {
				newCueLabel = '' + labelArray.join(' – ');
			} else {
				newCueLabel = labelArray.join(' – ');
			}
		} else {
			newCueLabel = cuePointStation?.tagname;
		}

		setButtonStateLabel(newButtonLabel);
		setCueLabel(newCueLabel);
	}, [playerState.status, playerState.station_data]);

	useLayoutEffect(() => {
		if (isPlaying || playerState.offline_cuelabel) {
			setShowCueLabel(true);
		} else {
			setShowCueLabel(false);
		}
	}, [playerState.playing, playerState.offline_cuelabel]);

	useLayoutEffect(() => {
		if (Object.keys(playerState.station_data).length > 1) {
			setMultiStation(true);
		} else {
			setMultiStation(false);
		}
	}, [playerState.station_data]);

	useEffect(() => {
		setInterval(() => {
			const rect = ref.current;
			if (rect) {
				setButtonBottom(rect.offsetTop + rect.offsetHeight + 'px');
			}
		}, 150);
	}, []);

	useEffect(() => {
		if (playerState.interactive) {
			statusClass.add('interactive');
		} else {
			statusClass.delete('interactive');
		}
		setStatusClass(statusClass);
	}, [playerState.interactive]);

	return (
		<div
			ref={ref}
			class={`
				listen-live-container
				${multiStation && 'multi-station'}
				${showCueLabel && cueLabel?.length && 'has-cue-label'}
				${Array.from(statusClass).join(' ')}
			`}
			onKeyDown={handleKeyDown}
			style={`--buttonBottom: ${buttonBottom}`}
		>
			{playerState.ready && (
				<>
					<button
						class="listen-live-button"
						onClick={togglePlay}
						title="Listen live now!"
						alt="Listen live now!"
						role="button"
						tabindex="0"
						aria-pressed={playerState.playing}
						disabled={!playerState.interactive}
					>
						<PlayIcon />

						<div
							class={`label-area ${
								showCueLabel &&
								cueLabel?.length &&
								'has-cue-label'
							}`}
						>
							<ScrollLabel
								tagName="h1"
								speedModifier="3"
								class="button-state-label"
								label={buttonStateLabel}
							/>
							{showCueLabel && (
								<ScrollLabel
									class="cue-label"
									label={cueLabel}
								/>
							)}
						</div>
					</button>
					{multiStation && <Dropdown />}
				</>
			)}
		</div>
	);
});
