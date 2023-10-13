'use strict';

import { h, render, Component, createContext } from 'preact';
import {
	useRef,
	useEffect,
	useLayoutEffect,
	useState,
	useContext,
} from 'preact/hooks';
import register from 'preact-custom-element';
import { Provider } from 'react-redux';

import domReady from 'Utils/domReady';
import isParentWindow from 'Utils/isParentWindow';
import fixSassJson from 'Utils/fixSassJson';

import store from 'Store';

import Logger from 'Utils/Logger';
const log = new Logger('CMLS Player');

import config from 'Config';
config = fixSassJson(config);

//import TritonConnector from './stream-sdk/triton/--index';
import ListenLiveButton from './ListenLiveButton';
import { playerStateActions } from './store/playerStateSlice';

import './stream-sdk/triton';

import(
	/* webpackChunkName: 'cmls-player' */
	/* webpackMode: 'lazy' */
	/* webpackPrefetch: true */
	/* webpackPreload: true */
	'./outer.scss'
).then((style) => {
	if (style?.default?.use) {
		style.default.use({ target: document.body });
	}
});

const playerContext = createContext({
	button_height: null,
	interactive: false,
	dropdown_open: false,
});

const CmlsPlayerProvider = (props) => {
	const me = useRef(null);

	const [buttonHeight, setButtonHeight] = useState(0);

	/**
	 * Load select runtime config into store
	 */
	useLayoutEffect(() => {
		store.dispatch(playerStateActions['set/sdk'](props?.sdk || 'triton'));
		store.dispatch(
			playerStateActions['set/minutes_between_preroll'](
				parseInt(
					props?.['minutes-between-preroll'] ||
						config.minutesbetweenpreroll
				)
			)
		);
	}, [props]);

	/**
	 * Parse child element configuration into store
	 */
	useLayoutEffect(() => {
		const children = props?.children?.props?.children;
		let hasPrimary = null;
		if (children) {
			children.forEach((child) => {
				if (child?.type === 'station' && child?.props?.mount) {
					const {
						mount,
						name,
						tagline,
						logo,
						vast,
						primary = false,
					} = child.props;
					const station = {
						mount,
						name,
						tagline,
						logo,
						vast,
						primary,
					};
					log.debug('Initializing station', mount, station);
					store.dispatch(
						playerStateActions['set/station']({
							[mount]: station,
						})
					);
					if (primary) {
						hasPrimary = mount;
					} else if (!hasPrimary) {
						hasPrimary = mount;
					}
				}
			});
		}
		if (hasPrimary) {
			store.dispatch(
				playerStateActions['set/station/primary'](hasPrimary)
			);
		}
	}, [props.children]);

	useEffect(() => {
		let p = me.current.base;
		setButtonHeight(p.getBoundingClientRect()?.height);
	});

	/**
	 * Handle click events outside our component
	 */
	window.addEventListener('click', (e) => {
		const path = e.composedPath();
		if (me?.current?.base && !path.includes(me.current.base)) {
			store.dispatch(playerStateActions['action/dropdown-close']());
		}
	});

	return (
		<Provider store={store}>
			<style>{`:root, :host { --buttonHeight: ${buttonHeight}px }`}</style>
			<ListenLiveButton ref={me} {...props} />
		</Provider>
	);
};
register(CmlsPlayerProvider, 'cmls-player', [], { shadow: true });
