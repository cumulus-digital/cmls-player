'use strict';

import { h, render, Component, Fragment } from 'preact';
import { useState, useMemo, useRef } from 'preact/hooks';
import register from 'preact-custom-element';
import { Provider } from 'react-redux';

import domReady from 'Utils/domReady';
import isParentWindow from 'Utils/isParentWindow';

import store from './store';
import { playerStateActions } from './store/playerStateSlice';

import { TritonSdkConnector } from './TritonSdkConnector';
import { Player } from './Player';

import config from './config.json';

import(
	/* webpackChunkName: 'outer' */
	/* webpackMode: 'lazy' */
	/* webpackFetchPriority: 'high' */
	'./outer.scss'
);

const PlayerProvider = (props) => {
	const me = useRef(null);

	window.addEventListener('click', (e) => {
		if (me?.current?.base && !e.composedPath().includes(me.current.base)) {
			store.dispatch(playerStateActions['set/dropdown_open'](false));
		}
	});

	return (
		<Provider store={store}>
			<Player ref={me} {...props} />
		</Provider>
	);
};
register(PlayerProvider, 'cmls-player', [], { shadow: true });

/**
 * If we're the top window, we'll create our SDK controller here.
 */
if (isParentWindow()) {
	domReady().then(() => {
		if (!document.getElementById(config.sdk_div_id)) {
			const sdkDiv = document.createElement('div');
			sdkDiv.id = config.sdk_div_id;
			sdkDiv.classList.add('do-not-remove');
			document.body.append(sdkDiv);

			const SdkProvider = (
				<Provider store={store}>
					<TritonSdkConnector />
				</Provider>
			);
			render(SdkProvider, sdkDiv);
		}
	});
}
