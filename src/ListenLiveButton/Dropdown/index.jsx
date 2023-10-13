import { h, Component, Fragment, createRef } from 'preact';
import {
	useState,
	useMemo,
	useEffect,
	useRef,
	useId,
	useCallback,
} from 'preact/hooks';
import { forwardRef } from 'preact/compat';
import { useSelector, useDispatch } from 'react-redux';

import Handle from './Handle';
import Container from './Container';

import store from 'Store';

import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

export default (props) => {
	const playerState = useSelector(playerStateSelect);
	const dispatch = useDispatch();

	const [focusFirstStation, setFocusFirstStation] = useState(null);

	const handleRef = createRef();
	const handleId = useId();
	const containerRef = createRef();
	const containerId = useId();

	const handleKeyboardActivation = useCallback((expanded) => {
		if (expanded) {
			setFocusFirstStation(true);
		} else {
			setFocusFirstStation(null);
		}
	}, []);

	return (
		<>
			<Handle
				id={handleId}
				ref={handleRef}
				containerRef={containerRef}
				containerId={containerId}
				onKeyboardActivation={handleKeyboardActivation}
			/>
			<Container
				id={containerId}
				ref={containerRef}
				handleRef={handleRef}
				handleId={handleId}
				focusFirstStation={focusFirstStation}
			/>
		</>
	);
};
