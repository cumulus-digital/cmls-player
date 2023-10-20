import { h, Fragment } from 'preact';
import {
	useRef,
	useEffect,
	useLayoutEffect,
	useState,
	useContext,
} from 'preact/hooks';
import { useDispatch, useSelector } from 'react-redux';

import { playerStateSelects } from 'Store/playerStateSlice';

import Logger from 'Utils/Logger';
const log = new Logger('ListenLive');

import ListenLiveButton from './ListenLiveButton';
import Dropdown from './Dropdown';
import { stream_status } from 'Consts';
import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';

export default function ListenLive(props) {
	//const ready = useSelector(playerStateSelects.ready);
	const appState = useContext(AppContext);

	if (!appState.sdk.ready.value) {
		return;
	}

	useLogRender('ListenLive');

	const interactive = useSelector(playerStateSelects.interactive);
	const playing = useSelector(playerStateSelects.playing);
	const status = useSelector(playerStateSelects.status);
	const stations_count = useSelector(playerStateSelects['stations/count']);

	const dispatch = useDispatch();

	const containerRef = useRef(null);

	useLayoutEffect(() => {
		import(
			/* webpackChunkName: 'listen-live' */
			/* webpackMode: 'lazy' */
			/* webpackPrefetch: true */
			/* wepackPreload: true */
			'./style.scss?object'
		).then((style) => {
			containerRef.current.parentNode.adoptedStyleSheets = [
				style.default,
			];
			//style.default.use({ target: containerRef.current.parentNode });
		});
	}, []);

	return (
		<>
			<div
				ref={containerRef}
				class={`
			listen-live-container
			${appState.sdk.ready.value ? 'ready' : null}
			${stations_count > 1 ? 'multi-station' : 'single-station'}
			${
				status == stream_status.LIVE_PLAYING
					? 'playing'
					: status > 0
					? 'activity'
					: 'stopped'
			}
			${interactive ? 'interactive' : ''}
		`}
			>
				<ListenLiveButton />
				{stations_count > 1 && <Dropdown />}
			</div>
		</>
	);
}
