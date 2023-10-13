import { h, Component, Fragment } from 'preact';
import { memo } from 'preact/compat';
import {
	useState,
	useMemo,
	useEffect,
	useRef,
	useLayoutEffect,
} from 'preact/hooks';
import { useSelector, useDispatch } from 'react-redux';

import { FaPlay, FaPause } from 'react-icons/fa6';

import Artwork from './Artwork';

import store from 'Store';

import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

export default memo((props) => {
	const playerState = useSelector(playerStateSelect);

	return (
		<div class="play-icon-container">
			<div class="play-icon">
				{playerState.playing ? <FaPause /> : <FaPlay />}
			</div>
		</div>
	);
});
