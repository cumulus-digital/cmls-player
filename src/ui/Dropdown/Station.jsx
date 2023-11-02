import { h } from 'preact';
import { useContext, useEffect, useMemo, useRef } from 'preact/hooks';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { playerStateSelects } from 'Store/playerStateSlice';

import { IconPlay, IconPause } from '@/ui/Icons';
import Artwork from '@/ui/Generics/Artwork';

import { SDK } from 'SDK';
import ScrollLabel from 'UI/Generics/ScrollLabel';
import useLogRender from 'Utils/useLogRender';
import { AppContext } from '@/signals';

export default function DropdownStation(props) {
	const appState = useContext(AppContext);

	if (!props.mount) {
		return;
	}

	useLogRender(`DropdownStation - ${props.mount}`);

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

	const icon = useMemo(() => {
		return playing === props.mount ? (
			<IconPause className="overlay" />
		) : (
			<IconPlay className="overlay" />
		);
	}, [playing, props.mount]);

	const nowplaying = useMemo(() => {
		if (
			appState.dropdown_open.value &&
			playing !== props.mount &&
			cuepoint?.type?.includes('track')
		) {
			if (cuepoint?.artwork !== false && cuepoint?.artwork !== 1) {
				// Fetch artwork
				SDK.fetchArtwork({ mount: props.mount, cue: cuepoint });
			}

			return (
				<div class="nowplaying">
					<Artwork
						url={cuepoint?.artwork}
						alt={cuepoint?.artwork && `Album cover for ${cuelabel}`}
					/>
					<div>
						<h3>
							{cuepoint.type === 'track'
								? 'Now Playing'
								: 'Last Played'}
							:
						</h3>
						<ScrollLabel class="cue" label={cuelabel} />
					</div>
				</div>
			);
		}
	}, [appState.dropdown_open.value, cuepoint, playing]);

	const classname = useMemo(() => {
		const list = ['dropdown-station'];
		if (playing === props.mount) {
			list.push('playing');
		}
		if (nowplaying) {
			list.push('has-cue');
		}
		return list.join(' ');
	}, [playing, props.mount, nowplaying]);

	return (
		<button
			ref={me}
			class={classname}
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
				{icon}
			</div>
			<div class="info">
				{playing === props.mount && (
					<em class="status">Streaming Live</em>
				)}
				<h2 class="name">{props.name}</h2>
				<div class="tagline">{props.tagline}</div>
				{nowplaying}
			</div>
		</button>
	);
}
