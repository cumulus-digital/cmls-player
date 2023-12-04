import { h, Fragment } from 'preact';
import {
	useCallback,
	useRef,
	useContext,
	useMemo,
	useLayoutEffect,
} from 'preact/hooks';
import { shallowEqual, useSelector } from 'react-redux';

import { playerStateSelects } from 'Store/playerStateSlice';

import Logger from 'Utils/Logger';
const log = new Logger('ListenLive / Button');

import { SDK } from 'SDK';

import ActionIcon from './ActionIcon';
import LabelArea from './LabelArea';

import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';
import Artwork from 'UI/Generics/Artwork';
import { stream_status } from 'Consts';
import { useSignal, useSignalEffect } from '@preact/signals';

export default function ListenLiveButton(props) {
	useLogRender('ListenLiveButton');

	const appState = useContext(AppContext);

	const buttonRef = useRef();

	//const ready = useSelector(playerStateSelects.ready);
	const status = useSelector(playerStateSelects.status);
	const interactive = useSelector(playerStateSelects.interactive);
	const playing = useSelector(playerStateSelects.playing);
	const current_station = useSelector(
		playerStateSelects['station/current'],
		shallowEqual
	);
	const cuepoint = useSelector(
		(state) =>
			playerStateSelects['station/cuepoint'](state, current_station),
		shallowEqual
	);

	// Handle alt tag
	const buttonAlt = useSignal('Loading...');
	useLayoutEffect(() => {
		if (!current_station) {
			buttonAlt.value = 'Loading...';
			return;
		}
		if (playing) {
			buttonAlt.value = `Stop streaming ${current_station.name}`;
		} else {
			buttonAlt.value = `Listen live to ${current_station.name}`;
		}
	}, [playing, current_station]);

	// Should the button be disabled?
	const isDisabled = useSignal(false);
	useLayoutEffect(() => {
		isDisabled.value = !(interactive && appState.sdk.ready.value);
	}, [interactive, appState.sdk.ready.value]);

	const artwork = useSignal();
	useLayoutEffect(() => {
		if (playing && status === stream_status.LIVE_PLAYING) {
			if (cuepoint?.artwork) {
				artwork.value = (
					<Artwork
						url={cuepoint.artwork}
						alt={
							cuepoint.artwork &&
							`Album cover for ${appState.cue_label}`
						}
						class="live-artwork"
					/>
				);
				return;
			} else if (
				appState.show_logo_without_artwork.value &&
				current_station?.logo
			) {
				artwork.value = (
					<Artwork
						url={current_station.logo}
						alt={`Logo for ${
							current_station.name || current_station.mount
						}`}
						class="live-artwork station-logo"
					/>
				);
				return;
			}
		}
		artwork.value = null;
	}, [
		status,
		playing,
		cuepoint?.artwork,
		current_station?.logo,
		appState.show_logo_without_artwork.value,
	]);

	const content = useSignal();
	useSignalEffect(() => {
		if (appState.sdk.ready.value) {
			content.value = (
				<>
					<ActionIcon />
					<LabelArea />
				</>
			);
		} else {
			content.value = null;
		}
	});

	const mobileLogo = useSignal();
	useLayoutEffect(() => {
		if (current_station?.logo) {
			mobileLogo.value = (
				<Artwork
					url={current_station.logo}
					alt={`Logo for ${
						current_station.name || current_station.mount
					}}`}
					class="station-logo"
				/>
			);
		} else {
			mobileLogo.value = null;
		}
	}, [current_station?.logo]);

	const togglePlay = useCallback(
		(e) => {
			e.preventDefault();
			if (!interactive) {
				return;
			}

			if (playing) {
				SDK.stop();
			} else {
				log.debug('Sending play request', current_station);
				SDK.play(current_station?.mount);
			}
		},
		[interactive, playing, current_station]
	);

	return (
		<button
			ref={buttonRef}
			class="listen-live-button with-hover-box"
			onClick={togglePlay}
			title={buttonAlt}
			alt={buttonAlt}
			role="button"
			tabindex="0"
			aria-pressed={playing}
			disabled={isDisabled}
		>
			{mobileLogo}
			{artwork}
			{content}
		</button>
	);
}
