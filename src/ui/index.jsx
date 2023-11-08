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
import { batch, useComputed, useSignal } from '@preact/signals';
import { throttle } from 'lodash';

export default function ListenLive(props) {
	useLogRender(log);

	const appState = useContext(AppContext);

	const interactive = useSelector(playerStateSelects.interactive);
	const status = useSelector(playerStateSelects.status);
	const stations_count = useSelector(playerStateSelects['stations/count']);

	const classNames = useSignal(['listen-live-container']);

	const containerRef = useRef(null);
	const scrollPixelRef = useRef(null);

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
				const box = me.getBoundingClientRect();
				appState.button_top.value = box.top;
				appState.button_offset_top.value = me.offsetTop;
				appState.button_left.value = box.left;
				appState.button_offset_left.value = me.offsetLeft;
				appState.button_width.value = box.width;
				appState.button_height.value = box.height;
				/*
				appState.button_top.value = me.offsetTop;
				appState.button_left.value = me.offsetLeft;
				appState.button_width.value = me.offsetWidth;
				appState.button_height.value = me.offsetHeight;
				*/
			}
		}, 300);

		return () => {
			clearInterval(watcher);
		};
	}, [containerRef]);

	/**
	 * Intersection observer handler on scrollPixelRef
	 */
	if (appState.with_mobile_bar.value) {
		useEffect(() => {
			const scrollListener = throttle(() => {
				const root = containerRef.current.getRootNode().host;
				const box = root.getBoundingClientRect();
				const classSet = new Set(classNames.value);

				classSet.delete('mobile-bar');
				classSet.delete('mobile-bar-start');
				if (box.y < 0 - appState.button_height.value - 5) {
					console.log('HIDDEN');
					classSet.add('mobile-bar');
					if (box.y > 0 - appState.button_height.value - 15) {
						classSet.add('mobile-bar-start');
					}
					classNames.value = Array.from(classSet.values());
				} else {
					classNames.value = Array.from(classSet.values());
				}
			});

			scrollListener();
			window.addEventListener('scroll', scrollListener, 100);

			return () => {
				console.log('Removing scroll listener');
				window.removeEventListener('scroll', scrollListener);
			};
		}, [containerRef?.current]);
	}

	useEffect(() => {
		batch(() => {
			const classSet = new Set(classNames.value);

			[
				'single-station',
				'multi-station',
				'ready',
				'playing',
				'activity',
				'stopped',
			].forEach((s) => classSet.delete(s));

			if (stations_count > 1) {
				classSet.add('multi-station');
			} else {
				classSet.add('single-station');
			}

			if (appState.sdk.ready.value) {
				classSet.add('ready');
			}

			if (status === stream_status.LIVE_PLAYING) {
				classSet.add('playing');
			} else if (status > 0) {
				classSet.add('activity');
			} else {
				classSet.add('stopped');
			}

			if (interactive) {
				classSet.add('interactive');
			}

			classNames.value = Array.from(classSet.values());
		});
		/*
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
		*/
	}, [status, stations_count, interactive, appState.sdk.ready.value]);

	const classNamesString = useComputed(
		() => classNames?.value?.join(' '),
		[classNames]
	);

	const useDropdown = useMemo(() => {
		if (appState.sdk.ready.value && stations_count > 1) {
			return <Dropdown />;
		}
	}, [stations_count, appState.sdk.ready.value]);

	return (
		<>
			<div class="scroll-pixel" ref={scrollPixelRef} />
			<div ref={containerRef} class={classNamesString}>
				<ListenLiveButton />
				{useDropdown}
			</div>
		</>
	);
}
