import { h, Component, Fragment } from 'preact';
import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { memo } from 'preact/compat';
import { useSelector, useDispatch } from 'react-redux';

import { FaPlay, FaPause } from 'react-icons/fa6';

import store from 'Store';

import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

import ScrollLabel from '../ScrollLabel';

export default memo((props) => {
	const playerState = useSelector(playerStateSelect);
	const dispatch = useDispatch();
	const me = useRef();

	useEffect(() => {
		if (props.focus) {
			me.current.focus();
		}
	});

	const toggleStation = (e) => {
		e.preventDefault();

		if (!playerState.interactive) {
			return;
		}

		if (playerState.playing === props.mount) {
			dispatch(playerStateActions['action/stop']());
		} else {
			dispatch(playerStateActions['action/play'](props.mount));
		}
	};

	const handleKeyDown = (e) => {
		if (!playerState.interactive) {
			return;
		}

		const key = e.key;
		switch (key) {
			case ' ':
			case 'Enter':
				e.stopPropagation();
				e.preventDefault();
				toggleStation();
		}
	};

	return (
		<button
			ref={me}
			class={`station ${
				playerState.playing === props.mount ? 'playing' : ''
			}`}
			role="menuitem"
			name={props.name}
			alt={`${
				playerState.playing === props.mount ? 'Stop playing' : 'Play'
			} ${props.name}`}
			title={`${
				playerState.playing === props.mount ? 'Stop playing' : 'Play'
			} ${props.name}`}
			onClick={toggleStation}
			tabIndex="0"
		>
			<div class="logo">
				<img src={props.logo} alt={`${props.name} Logo`} />
				{(playerState.playing === props.mount && (
					<FaPause className="overlay" />
				)) || <FaPlay className="overlay" />}
			</div>
			<div>
				{playerState.playing === props.mount && (
					<em class="is_playing">Streaming</em>
				)}
				<h2 class="name">{props.name}</h2>
				<div class="tagline">{props.tagline}</div>
				{props?.cuepoint?.type?.includes('track') && (
					<div class="nowplaying">
						<h3>Now Playing:</h3>
						{[props.cuepoint.artist, props.cuepoint.title].join(
							' – '
						)}
					</div>
				)}
			</div>
		</button>
	);
});