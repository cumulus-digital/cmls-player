import { h, Component, Fragment, CSSProperties } from 'preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { useSelector, useDispatch } from 'react-redux';

import {
	playerStateSelects,
	playerStateActions,
} from '../store/playerStateSlice';

import { stream_status } from '../consts';

import { FaPlay, FaPause, FaAngleDown, FaAngleUp } from 'react-icons/fa';

/*
const icons = {
	play: (
		<svg
			fill="currentColor"
			x="0px"
			y="0px"
			viewBox="0 0 330 330"
			style="enable-background:new 0 0 330 330;"
		>
			<path
				id="XMLID_308_"
				d="M37.728,328.12c2.266,1.256,4.77,1.88,7.272,1.88c2.763,0,5.522-0.763,7.95-2.28l240-149.999
c4.386-2.741,7.05-7.548,7.05-12.72c0-5.172-2.664-9.979-7.05-12.72L52.95,2.28c-4.625-2.891-10.453-3.043-15.222-0.4
C32.959,4.524,30,9.547,30,15v300C30,320.453,32.959,325.476,37.728,328.12z"
			/>
		</svg>
	),
	pause: (
		<svg
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 52 52"
		>
			<path d="M30,43c0,1,0.9,2,2,2h4c1.1,0,2-1.1,2-2V9c0-1-0.9-2-2-2h-4c-1.1,0-2,1.1-2,2V43z" />
			<path d="M14,43c0,1,0.9,2,2,2h4c1.1,0,2-1.1,2-2V9c0-1-0.9-2-2-2h-4c-1.1,0-2,1.1-2,2V43z" />
		</svg>
	),
};
const playIcon = icons.play;
const pauseIcon = icons.pause;
*/

export const ListenLiveButton = (props) => {
	const playerState = useSelector(playerStateSelects.state);
	const dispatch = useDispatch();

	const [iconState, setIconState] = useState('open');
	const [buttonLabel, setButtonLabel] = useState('Listen Live!');
	const [cueLabel, setCueLabel] = useState('');

	useEffect(() => {
		switch (playerState.status) {
			case stream_status.LIVE_BUFFERING:
				setIconState('pause');
				setButtonLabel('Buffering…');
				break;
			case stream_status.LIVE_CONNECTING:
				setIconState('pause');
				setButtonLabel('Connecting…');
				break;
			case stream_status.LIVE_RECONNECTING:
				setIconState('pause');
				setButtonLabel('Reconnecting…');
				break;
			case stream_status.LIVE_FAILED:
				setIconState('play');
				setButtonLabel('Connection failed!');
				break;
			case stream_status.LIVE_PLAYING:
				setIconState('pause');
				if (
					playerState.station_data[playerState.current_station]?.name
				) {
					setButtonLabel(
						`Now: ${
							playerState.station_data[
								playerState.current_station
							].name
						}`
					);
				} else {
					setButtonLabel('Now Playing');
				}
				break;
			default:
				if (playerState.dropdown_open) {
					setIconState('close');
				} else {
					setIconState('open');
				}
				setButtonLabel('Listen Live!');
		}
	}, [
		playerState.status,
		playerState.dropdown_open,
		playerState.current_station,
	]);

	useEffect(() => {
		if (!playerState.current_station) {
			return;
		}
		const station = playerState.current_station;
		const artist = playerState.station_data[station]?.cuepoint?.artist;
		const title = playerState.station_data[station]?.cuepoint?.title;
		let label = [];
		if (artist?.length) {
			label.push(artist);
		}
		if (title?.length) {
			label.push(title);
		}
		if (artist === title) {
			label = [artist];
		}
		setCueLabel(label.join(' – '));
	}, [playerState.station_data]);

	const handleClick = () => {
		dispatch(
			playerStateActions['set/dropdown_open'](!playerState.dropdown_open)
		);
	};

	const togglePlay = (e) => {
		if (playerState.playing) {
			e.stopPropagation();
			dispatch(playerStateActions['action/stop']());
		}
	};

	return (
		<div
			id="listen-live"
			class={`
				${playerState.playing ? 'playing' : ''}
				${
					[
						stream_status.LIVE_CONNECTING,
						stream_status.LIVE_BUFFERING,
					].includes(playerState.status)
						? 'buffering'
						: ''
				}
			`}
			aria-label={
				(playerState.playing && 'Stop streaming') || 'Play stream'
			}
			onClick={handleClick}
		>
			<div class="icon" onClick={togglePlay}>
				{iconState === 'open' && <FaAngleDown />}
				{iconState === 'close' && <FaAngleUp />}
				{iconState === 'play' && <FaPlay />}
				{iconState === 'pause' && <FaPause />}
			</div>
			<div class="status">
				<h1>{buttonLabel}</h1>
				{playerState.playing && (
					<h2>
						<div
							class={`
								onair
								${cueLabel.length > 25 ? 'scroll' : ''}
							`}
							data-onair={cueLabel}
							style={`--speed: ${cueLabel.length / 3}s`}
						>
							{cueLabel}
						</div>
					</h2>
				)}
			</div>
		</div>
	);
};
