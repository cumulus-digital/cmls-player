import { createContext, h } from 'preact';
import { useLayoutEffect, useRef, useEffect } from 'preact/hooks';
import register from 'preact-custom-element';
import { batch, Provider } from 'react-redux';

import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';
import { Station } from 'Store/Station';

import Logger from 'Utils/Logger';
const log = new Logger('CMLS Player');

import baseConfig from 'Config';
import fixSassJson from 'Utils/fixSassJson';
const config = fixSassJson(baseConfig);

import { SDK } from './stream-sdk';
import ListenLive from './ListenLive';
import { appSignals, AppContext } from './signals';

import(
	/* webpackChunkName: 'cmls-player-outer' */
	/* webpackMode: 'lazy' */
	/* webpackPrefetch: true */
	/* webpackPreload: true */
	'./outer.scss'
).then((style) => {
	if (style?.default?.use) {
		style.default.use();
	}
});

function CmlsPlayerProvider(props) {
	const dispatch = store.dispatch;

	const me = useRef(null);

	/**
	 * Parse DOM configuration
	 */
	useLayoutEffect(() => {
		log.debug('Parsing markup config');
		appSignals.sdk.type.value = props?.sdk || 'triton';
		const minutes_between_preroll = parseInt(
			props?.['minutes-between-preroll']
		);
		dispatch(
			playerStateActions['set/minutes_between_preroll'](
				minutes_between_preroll !== NaN
					? minutes_between_preroll
					: config.minutes_between_preroll
			)
		);

		const children = props?.children?.props?.children;
		let hasPrimary = null;
		let firstStation = null;
		let newStations = {};
		if (children) {
			children.forEach((child, i) => {
				if (child?.type === 'station') {
					let {
						mount,
						name = '',
						tagline = '',
						logo,
						vast,
						primary = false,
						order = i,
					} = child.props;
					if (!mount) {
						return;
					}

					// a standalone attribute will be an empty string
					primary = primary === false ? false : true;

					const station = new Station({
						mount,
						name,
						tagline,
						logo,
						vast,
						primary,
						order,
					});

					if (primary && !hasPrimary) {
						hasPrimary = mount;
					}

					if (!firstStation) {
						firstStation = mount;
					}

					newStations[mount] = Object.assign({}, station);
				}
			});
		}
		batch(() => {
			if (Object.keys(newStations)) {
				log.debug('Initializing stations', newStations);
				dispatch(playerStateActions['set/station'](newStations));
			} else {
				throw new Error('At least one station must be defined.');
			}
			if (hasPrimary) {
				log.debug('Setting primary station', hasPrimary);
				dispatch(playerStateActions['set/station/primary'](hasPrimary));
			} else {
				// primary is first station
				log.debug('Setting primary station', firstStation);
				dispatch(
					playerStateActions['set/station/primary'](firstStation)
				);
			}
		});

		SDK.init();

		/**
		 * Clicking outside of our component closes dropdown
		 */
		window.addEventListener('click', (e) => {
			const path = e.composedPath();
			if (me?.current?.base && !path.includes(me.current.base)) {
				//store.dispatch(playerStateActions['set/dropdown_open'](false));
				appSignals.dropdown_open.value = false;
			}
		});
	}, []);

	return (
		<Provider store={store}>
			<AppContext.Provider value={appSignals}>
				<style>{`:host > * { display: none }`}</style>
				<ListenLive ref={me} />
			</AppContext.Provider>
		</Provider>
	);
}
register(CmlsPlayerProvider, 'cmls-player', [], { shadow: true });
