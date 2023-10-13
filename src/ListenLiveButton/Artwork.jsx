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

import store from 'Store';

import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

/**
 * @param {{ alt: string }} props
 */
export default memo(
	(props) => {
		const [artUrl, setArtUrl] = useState(false);
		const playerState = useSelector(playerStateSelect);

		useMemo(() => {
			let cuepoint;
			if (playerState.playing) {
				cuepoint =
					playerState.station_data?.[playerState.playing]?.cuepoint;
			} else {
				cuepoint =
					playerState.station_data?.[playerState.station_primary]
						?.cuepoint;
			}
			if (
				cuepoint &&
				['track', 'offline-track'].includes(cuepoint.type) &&
				cuepoint.artwork
			) {
				setArtUrl(cuepoint.artwork);
			} else {
				setArtUrl(false);
			}
		}, [playerState.station_data]);

		return (
			<>
				{artUrl && (
					<img
						class={`${props.class || 'artwork'}`}
						src={artUrl}
						loading="lazy"
						alt={props.alt || 'Album artwork'}
					/>
				)}
			</>
		);
	},
	(prevProps, nextProps) => {
		const shouldRerender = ['artUrl', 'class', 'alt'].some(
			(k) => prevProps?.[k] !== nextProps?.[k]
		);
		return !shouldRerender;
	}
);
