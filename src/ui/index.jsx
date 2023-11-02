import { h, Fragment } from 'preact';
import {
	useRef,
	useLayoutEffect,
	useContext,
	useEffect,
	useMemo,
} from 'preact/hooks';
import { useSelector } from 'react-redux';

import { playerStateSelects } from 'Store/playerStateSlice';

import Logger from 'Utils/Logger';
const log = new Logger('ListenLive');

import ListenLiveButton from './ListenLiveButton';
import Dropdown from './Dropdown';
import { stream_status } from 'Consts';
import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';

export default function ListenLive(props) {
	useLogRender(log);

	const appState = useContext(AppContext);

	const interactive = useSelector(playerStateSelects.interactive);
	const status = useSelector(playerStateSelects.status);
	const stations_count = useSelector(playerStateSelects['stations/count']);

	const containerRef = useRef(null);

	useLayoutEffect(() => {
		import(
			/* webpackChunkName: 'listen-live' */
			/* webpackMode: 'lazy' */
			/* webpackPrefetch: true */
			/* wepackPreload: true */
			'./style.scss?inline'
		).then((style) => {
			/*
			containerRef.current.parentNode.adoptedStyleSheets = [
				style.default,
			];
			*/
			style.default.use({ target: containerRef.current.parentNode });
		});
	}, []);

	/**
	 * Track various physical characteristics
	 */
	useEffect(() => {
		const watcher = setInterval(() => {
			const me = containerRef.current;
			if (me) {
				appState.button_top.value = me.offsetTop;
				appState.button_left.value = me.offsetLeft;
				appState.button_width.value = me.offsetWidth;
				appState.button_height.value = me.offsetHeight;
			}
		}, 200);

		return () => {
			clearInterval(watcher);
		};
	}, [containerRef]);

	const classnames = useMemo(() => {
		const classes = [
			'listen-live-container',
			stations_count > 1 ? 'multi-station' : 'single-station',
		];
		if (appState.sdk.ready.value) {
			classes.push('ready');
		}
		if (status === stream_status.LIVE_PLAYING) {
			classes.push('playing');
		} else if (status > 0) {
			classes.push('activity');
		} else {
			classes.push('stopped');
		}
		if (interactive) {
			classes.push('interactive');
		}
		return classes.join(' ');
	}, [status, stations_count, interactive, appState.sdk.ready.value]);

	const useDropdown = useMemo(() => {
		if (appState.sdk.ready.value && stations_count > 1) {
			return <Dropdown />;
		}
	}, [stations_count, appState.sdk.ready.value]);

	return (
		<div ref={containerRef} class={classnames}>
			<ListenLiveButton />
			{useDropdown}
		</div>
	);
}
