import { h, Component, Fragment } from 'preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';
import { useSelector, useDispatch } from 'react-redux';

import fixSassJson from 'Utils/fixSassJson';
import sdkConfig from './sdk-config.json';

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / Script Tag');

const { sdk_url } = fixSassJson(sdkConfig);

/**
 * @param {{ url: string, onLoad: function }} props
 */
const SdkScript = (props) => {
	useEffect(() => {
		if (props.url || sdk_url) {
			const script = window.self.document.createElement('script');
			script.setAttribute('src', props.url || sdk_url);
			script.setAttribute('async', true);
			if (props.onLoad) {
				script.onload = props.onLoad;
			}
			window.self.document.head.appendChild(script);
		} else {
			log.error('props.url or sdk_url not provided!');
		}
	}, []);

	return true;
};

export default memo(SdkScript);
