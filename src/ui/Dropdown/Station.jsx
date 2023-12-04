import { h } from 'preact';
import {
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from 'preact/hooks';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { playerStateSelects } from 'Store/playerStateSlice';

import { IconPlay, IconPause } from '@/ui/Icons';
import Artwork from '@/ui/Generics/Artwork';

import { SDK } from 'SDK';
import ScrollLabel from 'UI/Generics/ScrollLabel';
import useLogRender from 'Utils/useLogRender';
import { AppContext } from '@/signals';
import { useClassNameSignal } from 'UI/hooks/ClassNameSignal';
import { useSignal } from '@preact/signals';
import MarqueeText from 'UI/Generics/MarqueeText';

export default function DropdownStation(props) {
	const appState = useContext(AppContext);

	const { station, key, index, focus } = props;

	if (!station?.mount) {
		return;
	}

	useLogRender(`DropdownStation - ${station.mount}`);

	const interactive = useSelector(playerStateSelects.interactive);
	const playing = useSelector(playerStateSelects.playing);
	const cuepoint = useSelector(
		(state) => playerStateSelects['station/cuepoint'](state, station.mount),
		shallowEqual
	);
	const cuelabel = useSelector((state) =>
		playerStateSelects['station/cuelabel'](state, station.mount)
	);

	const dispatch = useDispatch();

	const me = useRef();

	useEffect(() => {
		if (focus) {
			me.current.focus({ focusVisible: true });
		}
	}, [focus]);

	const toggleStation = (e) => {
		e.preventDefault();

		if (playing === station.mount) {
			SDK.stop();
		} else {
			SDK.play(station.mount);
		}
	};

	const previousPlayed = useSignal();
	const previousPlayedArtwork = useSignal();
	useLayoutEffect(() => {
		if (
			appState.dropdown_open.value &&
			playing !== station.mount &&
			cuepoint?.type?.includes('track')
		) {
			if (cuepoint.artwork?.length) {
				previousPlayedArtwork.value = (
					<Artwork
						url={cuepoint.artwork}
						alt={`Album cover of ${cuelabel}`}
					/>
				);
			} else if (cuepoint?.artwork !== false && cuepoint?.artwork !== 1) {
				SDK.fetchArtwork({
					mount: station.mount,
					cue: cuepoint,
					skipWindowCheck: true,
				});
				previousPlayedArtwork.value;
			}

			previousPlayed.value = (
				<div class="nowplaying">
					{previousPlayedArtwork}
					<div>
						<h3>
							{cuepoint.type === 'track'
								? 'Now Playing'
								: 'Last Played'}
						</h3>
						<MarqueeText class="cue" label={cuelabel} />
					</div>
				</div>
			);
		} else {
			previousPlayed.value = null;
		}
	}, [
		playing,
		cuepoint?.artwork,
		cuepoint?.type,
		cuelabel,
		appState.dropdown_open.value,
	]);

	const actionIcon = useSignal();
	useLayoutEffect(() => {
		if (playing === station.mount) {
			actionIcon.value = <IconPause className="overlay" />;
		} else {
			actionIcon.value = <IconPlay className="overlay" />;
		}
	}, [playing, station?.mount]);

	const buttonAlt = useSignal();
	useLayoutEffect(() => {
		if (playing === station.mount) {
			buttonAlt.value = `Stop streaming`;
		} else {
			buttonAlt.value = `Listen live`;
		}
	}, [playing, station?.mount]);

	const nowPlayingLabel = useSignal();
	useLayoutEffect(() => {
		if (playing === station.mount) {
			nowPlayingLabel.value = <em class="status">Now Streaming LIVE</em>;
		} else {
			nowPlayingLabel.value = null;
		}
	});

	const stationLogo = useSignal();
	useLayoutEffect(() => {
		if (station.logo) {
			stationLogo.value = (
				<div class="logo">
					<img
						src={station.logo}
						alt={station?.name ? `${station.name} logo` : ''}
					/>
					{actionIcon}
				</div>
			);
		} else {
			stationLogo.value = <div class="logo">{actionIcon}</div>;
		}
	}, [station.logo, station.name, actionIcon.value]);

	const classNames = useClassNameSignal('dropdown-station with-hover-box');
	useLayoutEffect(() => {
		classNames.deleteMany(['playing', 'has-cue']);
		if (playing === station.mount) {
			classNames.add('playing');
		}
		if (previousPlayed.value) {
			classNames.add('has-cue');
		}
	}, [playing, station?.mount, previousPlayed.value]);

	return (
		<button
			key={key || station?.mount}
			ref={me}
			class={classNames}
			role="menuitem"
			name={station.name}
			alt={buttonAlt}
			title={buttonAlt}
			onClick={toggleStation}
			tabIndex="0"
			disabled={!interactive}
		>
			{stationLogo}
			<div class="info">
				{nowPlayingLabel}
				<h2 class="name">{station.name}</h2>
				<div class="tagline">{station.tagline}</div>
				{previousPlayed}
			</div>
		</button>
	);
}
