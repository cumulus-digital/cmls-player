import { h, Fragment } from 'preact';
import {
	useState,
	useCallback,
	useRef,
	useEffect,
	useContext,
} from 'preact/hooks';
import { shallowEqual, useSelector } from 'react-redux';

import { playerStateSelects } from 'Store/playerStateSlice';

import Logger from 'Utils/Logger';
const log = new Logger('ListenLive / Button');

import { SDK } from '@/stream-sdk';

import ActionIcon from './ActionIcon';
import LabelArea from './LabelArea';

import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';

export default function ListenLiveButton(props) {
	useLogRender('ListenLiveButton');

	const appState = useContext(AppContext);

	const buttonRef = useRef();

	//const ready = useSelector(playerStateSelects.ready);
	const interactive = useSelector(playerStateSelects.interactive);
	const playing = useSelector(playerStateSelects.playing);
	const current_station = useSelector(
		playerStateSelects['station/current'],
		shallowEqual
	);
	let { buttonLabel = 'Listen Live!', cueLabel } = useSelector(
		(state) =>
			playerStateSelects['station/status_labels'](state, current_station),
		shallowEqual
	);

	/**
	 * Handle alt tag
	 */
	const [buttonAlt, setButtonAlt] = useState('Listen live now!');
	useEffect(() => {
		if (!current_station) {
			return;
		}

		if (playing) {
			setButtonAlt(`Stop streaming ${current_station.name}`);
		} else {
			setButtonAlt(`Listen live to ${current_station.name}`);
		}
	}, [playing, current_station]);

	/**
	 * Track height of button
	 */
	useEffect(() => {
		const watcher = setInterval(() => {
			const height = buttonRef.current?.offsetHeight;
			if (height && height !== appState.button_height.value) {
				appState.button_height.value = height;
			}
		}, 200);

		return () => {
			clearInterval(watcher);
		};
	}, [buttonRef]);

	const handleKeyUp = useCallback(
		(e) => {
			if (!interactive) {
				return;
			}

			const key = e.key;
			if (key === 'Esc' || key === 'Escape') {
				e.stopPropagation();
				e.preventDefault();
				dispatch(playerStateActions['set/dropdown_open'](false));
			}
		},
		[interactive]
	);

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
			class="listen-live-button"
			onClick={togglePlay}
			onKeyUp={handleKeyUp}
			title={buttonAlt}
			alt={buttonAlt}
			role="button"
			tabindex="0"
			aria-pressed={playing}
			disabled={!(interactive && appState.sdk.ready.value)}
		>
			<ActionIcon playing={playing} />
			{appState.sdk.ready.value && (
				<LabelArea buttonLabel={buttonLabel} cueLabel={cueLabel} />
			)}
		</button>
	);
}
