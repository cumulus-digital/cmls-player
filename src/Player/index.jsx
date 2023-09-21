import { h, Component, Fragment } from 'preact';
import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { Provider, useSelector, useDispatch } from 'react-redux';

//import store from '../store';

import {
	selectPlayerState,
	playerStateActions,
} from '../store/playerStateSlice';

import Logger from 'Utils/Logger';

import config from '../config.json';
import { stream_status } from '../consts';

import { ListenLiveButton } from './ListenLiveButton';
import { Dropdown } from './Dropdown';

const log = new Logger('Player');

export const Player = (props) => {
	const playerState = useSelector(selectPlayerState);
	const dispatch = useDispatch();
	const [playerCss, setPlayerCss] = useState('');
	const [dropdownVisible, setDropdownVisible] = useState(false);

	const me = useRef(null);

	useEffect(() => {
		const children = props?.children?.props?.children;
		if (children) {
			children.forEach((child) => {
				if (child?.type === 'station' && child?.props?.mount) {
					const { mount, name, logo, vast } = child.props;
					const station = { mount, name, logo, vast };
					dispatch(
						playerStateActions['set/station/data']({
							[child.props.mount]: station,
						})
					);
				}
			});
		}
	}, [props]);

	const renderButton = useEffect(() => {
		return (
			<>
				<ListenLiveButton
					playerState={playerState}
					action="dropdown"
					onClick={(e) => {
						dropdownVisible
							? setDropdownVisible(false)
							: setDropdownVisible(true);
					}}
				/>
				{dropdownVisible && <Dropdown playerState={playerState} />}
			</>
		);
	}, [playerState.stationData, dropdownVisible]);

	const styleAttr = {
		'--backgroundColor': props.backgroundcolor || null,
		'--textColor': props.textcolor || null,
	};

	const toggleDropdown = () => {
		dispatch(
			playerStateActions['set/dropdown_open'](!playerState.dropdown_open)
		);
	};

	import(
		/* webpackChunkName: 'player-style' */
		/* webpackMode: 'eager' */
		/* webpackPrefetch: true */
		/* webpackPreload: true */
		'./player.scss?inline'
	).then((style) => {
		if (style?.default?.use) {
			console.log(me.current);
			style.default.use({ target: me.current.firstChild });
		}
	});
	//useEffect(() => {}, [me]);

	return (
		<div id="listenlive-container" ref={me} style={styleAttr}>
			<ListenLiveButton />
			{playerState.dropdown_open ? <Dropdown /> : null}
		</div>
	);
};
