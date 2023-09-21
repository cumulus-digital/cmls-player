import { h, Component, Fragment, CSSProperties } from 'preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { useSelector, useDispatch } from 'react-redux';

import {
	playerStateSelects,
	playerStateActions,
} from '../store/playerStateSlice';

import { stream_status } from '../consts';

import { DropdownStation } from './DropdownStation';

export const Dropdown = (props) => {
	const playerState = useSelector(playerStateSelects.state);

	const renderStations = useMemo(() => {
		const numStations = Object.keys(playerState.station_data).length;
		if (numStations) {
			return Object.values(playerState.station_data)?.map((station) => {
				return <DropdownStation {...station} />;
			});
		}
		return null;
	}, [playerState.station_data]);

	return (
		<div id="dropdown">
			{renderStations}
			<div style="margin: .5em auto;background:#eee;color:#ccc;width:320px;height:50px;display:flex;align-items:center;justify-content:center">
				ADVERTISEMENT
			</div>
		</div>
	);
};
