import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

/*
import {
	IconPlayerPlayFilled as IconPlay,
	IconPlayerPauseFilled as IconPause,
} from '@tabler/icons-react';
*/
import { FaPlay as IconPlay, FaPause as IconPause } from 'react-icons/fa6';

import { playerStateActions, playerStateSelects } from 'Store/playerStateSlice';

import Artwork from 'Generics/Artwork';

import { SDK } from '@/stream-sdk';
import { fetchItunesArtwork } from 'Utils/iTunesHelper';
import ScrollLabel from 'Generics/ScrollLabel';
import useLogRender from 'Utils/useLogRender';

export default function DropdownStation(props) {
	useLogRender('DropdownStation');

	if (!props.mount) {
		return;
	}

	const interactive = useSelector(playerStateSelects.interactive);
	const playing = useSelector(playerStateSelects.playing);
	const cuepoint = useSelector(
		(state) => playerStateSelects['station/cuepoint'](state, props.mount),
		shallowEqual
	);
	const cuelabel = useSelector((state) =>
		playerStateSelects['station/cuelabel'](state, props.mount)
	);

	const dispatch = useDispatch();

	const me = useRef();

	useEffect(() => {
		if (props.focus) {
			me.current.focus({ focusVisible: true });
		}
	}, [props.focus]);

	const toggleStation = (e) => {
		e.preventDefault();

		if (playing === props.mount) {
			SDK.stop();
		} else {
			SDK.play(props.mount);
		}
	};

	/**
	 * Fetch artwork if station supports it
	 */
	useEffect(() => {
		if (
			cuepoint?.type?.includes('track') &&
			!cuepoint?.artwork &&
			cuepoint?.artwork !== false
		) {
			// Fetch artwork
			fetchItunesArtwork(cuepoint.artist, cuepoint.title)
				.then((artUrl) => {
					if (artUrl?.length) {
						dispatch(
							playerStateActions['set/station/cuepoint/artwork']({
								[props.mount]: artUrl,
							})
						);
					} else {
						dispatch(
							playerStateActions['set/station/cuepoint/artwork']({
								[props.mount]: false,
							})
						);
					}
				})
				.catch((e) => {
					dispatch(
						playerStateActions['set/station/cuepoint/artwork']({
							[props.mount]: false,
						})
					);
				});
		}
	}, [cuepoint]);

	return (
		<button
			ref={me}
			class={`dropdown-station ${
				playing === props.mount ? 'playing' : ''
			}`}
			role="menuitem"
			name={props.name}
			alt={`${
				playing === props.mount ? 'Stop streaming' : 'Listen live to'
			} ${props.name}`}
			title={`${
				playing === props.mount ? 'Stop streaming' : 'Listen live to'
			} ${props.name}`}
			onClick={toggleStation}
			tabIndex="0"
			disabled={!interactive}
		>
			<div class="logo">
				<img src={props.logo} alt={`${props.name} Logo`} />
				{(playing === props.mount && (
					<IconPause className="overlay" />
				)) || <IconPlay className="overlay" />}
			</div>
			<div class="info">
				{playing === props.mount && (
					<em class="status">Streaming Live</em>
				)}
				<h2 class="name">{props.name}</h2>
				<div class="tagline">{props.tagline}</div>
				{cuepoint?.type?.includes('track') && (
					<div class="nowplaying">
						<Artwork
							url={cuepoint?.artwork}
							alt={
								cuepoint?.artwork &&
								`Album cover for ${cuelabel}`
							}
						/>
						<div>
							<h3>Now Playing:</h3>
							<ScrollLabel class="cue" label={cuelabel} />
						</div>
					</div>
				)}
			</div>
		</button>
	);
}
