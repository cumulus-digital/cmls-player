import { h, Component, Fragment, CSSProperties } from 'preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { useSelector, useDispatch } from 'react-redux';

import {
	playerStateSelects,
	playerStateActions,
} from '../store/playerStateSlice';

import { stream_status } from '../consts';

import { FaPlay, FaPause } from 'react-icons/fa';

export const DropdownStation = (props) => {
	const playerState = useSelector(playerStateSelects.state);
	const dispatch = useDispatch();
	const [nowPlayingList, setNowPlayingList] = useState(null);

	const handleClick = () => {
		if (playerState.current_station === props.mount) {
			dispatch(playerStateActions['action/stop']());
			return;
		}
		dispatch(playerStateActions['action/play'](props.mount));
	};

	useEffect(() => {
		if (!playerState.playing) {
			return;
		}
		if (playerState.current_station !== props.mount) {
			setNowPlayingList(null);
			return;
		}
		if (playerState?.station_data?.[props.mount]?.playlist?.length) {
			setNowPlayingList(
				<div class="playlist">
					<h3>Recently Played</h3>
					<div class="playlist-list">
						<ul>
							{playerState.station_data[props.mount].playlist.map(
								(item) => {
									const t = new Date(parseInt(item.time));
									const hours =
										(t.getHours() + 24) % 12 || 12;
									const minutes = String(
										t.getMinutes()
									).padStart(2, '0');
									const amPm =
										t.getHours() < 12 ? 'am' : 'pm';
									const tString = `${hours}:${minutes}${amPm}`;

									let aString = [];
									if (item?.artist?.length) {
										aString.push(item.artist);
									}
									if (item?.title?.length) {
										aString.push(item.title);
									}

									// some stations do events with the same string as artist and title
									if (item.artist === item.title) {
										aString = [item.artist];
									}
									return (
										<li>
											<time datetime={t.toISOString()}>
												{tString}
											</time>
											<span>{aString.join(' – ')}</span>
										</li>
									);
								}
							)}
						</ul>
					</div>
				</div>
			);
		} else {
			setNowPlayingList(<></>);
		}
	}, [playerState.station_data[props.mount]]);

	return (
		<div
			class={`station ${
				playerState.playing &&
				playerState.current_station == props.mount
					? 'playing'
					: ''
			}`}
			onClick={handleClick}
		>
			<div class="logo">
				<img src={props.logo} alt={`${props.name} Logo`} />
				{(playerState.playing &&
					playerState.current_station === props.mount && (
						<FaPause className="overlay" />
					)) || <FaPlay className="overlay" />}
			</div>
			<div>
				<h2 class="name">
					{playerState.playing &&
						playerState.current_station == props.mount && (
							<em>Now Playing:</em>
						)}
					{props.name}
				</h2>
				{nowPlayingList}
			</div>
		</div>
	);
};
