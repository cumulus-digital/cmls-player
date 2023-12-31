if (process?.env?.NODE_ENV === 'development') {
	// Support preact dev tools
	require('preact/debug');
}

import './utils/leaderElection.js';

import { createContext, h } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import register from 'preact-custom-element';
import { useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { batch, Provider } from 'react-redux';

import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';
import { Station } from 'Store/Station';

import { appSignals, AppContext } from './signals';
import './subscriptions';

import Logger from 'Utils/Logger';
const log = new Logger('CMLS Player');

import baseConfig from 'Config';
import fixSassJson from 'Utils/fixSassJson';
const config = fixSassJson(baseConfig);

import { SDK } from 'SDK';
import ListenLive from 'UI';

import './framer';

import initPatches from './patches/index.js';

import(
	/* webpackChunkName: 'outer' */
	/* webpackMode: 'lazy' */
	/* webpackPrefetch: true */
	/* webpackPreload: true */
	'./outer.scss'
).then((style) => {
	if (style?.default?.use) {
		style.default.use();
	}
});

window.customElements.define(
	'cmls-station',
	class extends HTMLElement {
		constructor() {
			super();
		}
	}
);

window.customElements.define(
	'cmls-player',
	class extends HTMLElement {
		stations;
		configured = false;

		parseAttributes(attributes) {
			return Object.assign(
				{},
				...Array.from(attributes, ({ name, value }) => ({
					[name]: value,
				}))
			);
		}

		constructor() {
			super();

			const children = Array.from(this.childNodes);

			if (!this.getElementsByTagName('cmls-station')?.length) {
				throw new Error(
					'One or more cmls-station tags must be defined.'
				);
			}

			this.onMutation = this.registerComponent.bind(this);
		}

		connectedCallback() {
			this.observer = new MutationObserver(this.onMutation);
			this.observer.observe(this, { childList: true });

			this.appendChild(document.createElement('cmls-player-component'));
		}

		async registerComponent() {
			if (this.configured) return;

			this.configured = true;
			this.observer.disconnect();

			const dispatch = store.dispatch;

			const props = this.parseAttributes(this.attributes);
			const children = Array.from(
				this.getElementsByTagName('cmls-station')
			);

			log.debug('Parsing markup config', { props, children });

			// Signals are per-instance, but redux state is owned by the leader
			appSignals.sdk.type.value = props?.sdk || 'triton';

			if (props?.['offline-label'] !== undefined) {
				appSignals.offline_label.value = props['offline-label'];
			}

			if (
				props?.['show-logo-without-artwork'] !== undefined &&
				String(props?.['show-logo-without-artwork']).toLowerCase() ===
					'true'
			) {
				appSignals.show_logo_without_artwork.value = true;
			}

			if (props?.['no-cue-label'] !== undefined) {
				appSignals.show_cue_label.value = false;
			}

			if (props?.['background-color'] !== undefined) {
				appSignals.background_color.value = props['background-color'];
			}
			if (props?.['highlight-color'] !== undefined) {
				appSignals.highlight_color.value = props['highlight-color'];
			}
			if (props?.['text-color'] !== undefined) {
				appSignals.text_color.value = props['text-color'];
			}
			if (props?.['button-height'] !== undefined) {
				appSignals.default_button_height.value = props['button-height'];
			}

			if (
				props?.['with-mobile-bar-on-scroll'] !== undefined &&
				String(props?.['with-mobile-bar-on-scroll']).toLowerCase() ===
					'true'
			) {
				appSignals.with_mobile_bar.value = true;
			}
			if (props?.['mobile-bar-top'] !== undefined) {
				appSignals.mobile_bar_top.value = props['mobile-bar-top'];
			}

			batch(() => {
				let minutes_between_preroll = config.minutes_between_preroll;
				if (props?.['minutes-between-preroll'] !== undefined) {
					minutes_between_preroll =
						parseInt(props?.['minutes-between-preroll']) ||
						minutes_between_preroll;
				}
				dispatch(
					playerStateActions['set/minutes_between_preroll'](
						minutes_between_preroll !== NaN
							? minutes_between_preroll
							: config.minutes_between_preroll
					)
				);

				let newStations = {};
				let hasPrimary = null;
				let firstStation = null;
				if (children) {
					children.forEach((child, i) => {
						if (child?.nodeName?.toLowerCase() !== 'cmls-station')
							return;

						const childProps = this.parseAttributes(
							child.attributes
						);
						let {
							//station,
							mount,
							name = '',
							tagline = '',
							logo,
							vast,
							primary = false,
							order = i,
						} = childProps;
						if (!mount) {
							return;
						}

						// a standalone attribute will be an empty string
						primary = primary === false ? false : true;

						const new_station = new Station({
							//station,
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

						newStations[mount] = Object.assign({}, new_station);
					});
				}

				if (Object.keys(newStations)) {
					log.debug('Initializing stations', newStations);
					dispatch(playerStateActions['set/station'](newStations));
				} else {
					throw new Error('At least one station must be defined.');
				}

				if (hasPrimary) {
					log.debug('Setting primary station', hasPrimary);
					dispatch(
						playerStateActions['set/station/primary'](hasPrimary)
					);
				} else {
					// primary is first station
					log.debug('Setting primary station', firstStation);
					dispatch(
						playerStateActions['set/station/primary'](firstStation)
					);
				}
			});

			/**
			 * Clicking outside of our component closes dropdown
			 */
			const handleOutsideClick = (e) => {
				const path = e.composedPath();
				if (
					this &&
					!path.includes(this) &&
					!(
						SDK?.interface?.modules?.MediaPlayer?.el &&
						path.includes(SDK.interface.modules.MediaPlayer.el)
					)
				) {
					appSignals.dropdown_open.value = false;
				}
			};
			window.addEventListener('click', handleOutsideClick.bind(this));
			window.addEventListener('touchend', handleOutsideClick.bind(this));

			/**
			 * Escape key closes dropdown
			 */
			window.addEventListener('keyup', (e) => {
				const key = e.key;
				if (key === 'Esc' || key === 'Escape') {
					e.preventDefault();
					e.stopImmediatePropagation();
					appSignals.dropdown_open.value = false;
				}
			});

			SDK.init(appSignals.sdk.type.peek());
			window.cmls_player = window.cmls_player || {};
			window.cmls_player.play = SDK.play;

			initPatches();

			register(CmlsPlayerProvider, 'cmls-player-component', [], {
				shadow: true,
			});
		}
	}
);

function CmlsPlayerProvider(props) {
	const me = useRef(null);

	const cssVars = useSignal();
	useSignalEffect(() => {
		const vars = [
			`--background_color: ${appSignals.background_color}`,
			`--highlight_color: ${appSignals.highlight_color}`,
			`--text_color: ${appSignals.text_color}`,
			`--default_button_height: ${appSignals.default_button_height}`,
			`--mobile_bar_top: ${parseInt(appSignals.mobile_bar_top)}`,

			`--button_top: ${parseInt(appSignals.button_top)}px`,
			`--button_offset_top: ${parseInt(appSignals.button_offset_top)}px`,
			`--button_left: ${parseInt(appSignals.button_left)}px`,
			`--button_offset_left: ${parseInt(
				appSignals.button_offset_left
			)}px`,
			`--button_height: ${parseInt(appSignals.button_height)}px`,
			`--button_width: ${parseInt(appSignals.button_width)}px`,
		];
		cssVars.value = `:host { ${vars.join('; ')} }`;
	});

	return (
		<Provider store={store}>
			<AppContext.Provider value={appSignals}>
				<style>
					{`:host > * { display: none }`}
					{cssVars}
				</style>
				<ListenLive ref={me} />
			</AppContext.Provider>
		</Provider>
	);
}
