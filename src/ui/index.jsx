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
import { useClassNameSignal } from './hooks/ClassNameSignal';
import isEqual from 'Utils/isEqual';

export default function ListenLive(props) {
	useLogRender(log);

	const appState = useContext(AppContext);

	const interactive = useSelector(playerStateSelects.interactive);
	const status = useSelector(playerStateSelects.status);
	const stations_count = useSelector(playerStateSelects['stations/count']);

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
			style.default.use({ target: containerRef.current });
		});
	}, []);

	const classNames = useClassNameSignal('listen-live-container');
	useLayoutEffect(() => {
		classNames.deleteExcept([
			'listen-live-container',
			'mobile-bar',
			'mobile-bar-start',
		]);

		if (appState.sdk.ready.value) {
			classNames.add('ready');
		}

		if (interactive) {
			classNames.add('interactive');
		}

		if (stations_count > 1) {
			classNames.add('multi-station');
		} else {
			classNames.add('single-station');
		}

		if (status === stream_status.LIVE_PLAYING) {
			classNames.add('playing');
		} else if (status > 0) {
			classNames.add('activity');
		} else {
			classNames.add('stopped');
		}
	}, [status, interactive, stations_count, appState.sdk.ready.value]);

	/**
	 * Track various physical characteristics
	 */
	let lastBox = {};
	const resetPhysicals = (lastBox) => {
		const me = containerRef.current;
		if (!me) return;
		const rect = me.getBoundingClientRect();
		const box = {
			top: rect.top,
			left: rect.left,
			width: rect.width,
			height: rect.height,
			offsetTop: me.offsetTop,
			offsetLeft: me.offsetLeft,
		};
		if (!isEqual(box, lastBox)) {
			appState.button_top.value = box.top;
			appState.button_offset_top.value = box.offsetTop;
			appState.button_left.value = box.left;
			appState.button_offset_left.value = box.offsetLeft;
			appState.button_width.value = box.width;
			appState.button_height.value = box.height;
			return box;
		}
		return lastBox;
	};
	useEffect(() => {
		if (!containerRef.current) return;

		resetPhysicals();
		const watcher = setInterval(resetPhysicals, 300);

		return () => {
			clearInterval(watcher);
		};
	}, [containerRef.current]);

	/**
	 * Watch for scroll
	 */
	if (appState.with_mobile_bar.value) {
		useLayoutEffect(() => {
			const scrollListener = throttle(() => {
				if (!containerRef.current) return;

				const root = containerRef.current.getRootNode().host;
				const box = root.getBoundingClientRect();

				if (box.y > 0 - appState.button_height.value - 15) {
					classNames.add('mobile-bar');
					if (box.y > 0 - appState.button_height.value - 15) {
						classNames.add('mobile-bar-start');
					} else {
						classNames.delete('mobile-bar-start');
					}
				} else {
					classNames.deleteMany(['mobile-bar', 'mobile-bar-start']);
				}
			});

			scrollListener();
			window.addEventListener('scroll', scrollListener);

			return () => {
				window.removeEventListener('scroll', scrollListener);
			};
		}, [containerRef.current, appState.button_height.value]);
	}

	const useDropdown = useSignal();
	useLayoutEffect(() => {
		if (appState.sdk.ready.value && stations_count > 1) {
			useDropdown.value = <Dropdown />;
		} else {
			useDropdown.value = null;
		}
	}, [stations_count, appState.sdk.ready.value]);

	return (
		<>
			<div class="scroll-pixel" ref={scrollPixelRef} />
			<div ref={containerRef} class={classNames}>
				<ListenLiveButton />
				{useDropdown}
			</div>
		</>
	);
}
