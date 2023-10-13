import { h, Component, Fragment } from 'preact';
import {
	useState,
	useMemo,
	useEffect,
	useRef,
	useCallback,
} from 'preact/hooks';
import { forwardRef } from 'preact/compat';
import { useSelector, useDispatch } from 'react-redux';

import Station from './Station';

import store from 'Store';

import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

export default forwardRef((props, ref) => {
	const playerState = useSelector(playerStateSelect);
	const dispatch = useDispatch();

	const [focusStation, setFocusStation] = useState(null);
	const [positionClass, setPositionClass] = useState('align-left');

	const focusNextStation = () => {
		const count = Object.keys(playerState.station_data).length;
		if (focusStation + 1 < count) {
			setFocusStation(focusStation + 1);
		} else {
			setFocusStation(0);
		}
	};

	const focusPreviousStation = () => {
		const count = Object.keys(playerState.station_data).length;
		if (focusStation > 0) {
			setFocusStation(focusStation - 1);
		} else {
			setFocusStation(count - 1);
		}
	};

	const handleKeyDown = (e) => {
		if (!playerState.interactive) {
			return;
		}

		const key = e.key;
		let stopBubble = false;

		switch (key) {
			case 'Down':
			case 'ArrowDown':
				stopBubble = true;
				focusNextStation();
				break;
			case 'Up':
			case 'ArrowUp':
				stopBubble = true;
				focusPreviousStation();
				break;
			case 'Esc':
			case 'Escape':
				props.handleRef?.current?.focus();
				break;
		}

		if (stopBubble) {
			e.stopPropagation();
			e.preventDefault();
		}
	};

	/**
	 * Position dropdown relative to button and viewport
	 */
	useEffect(() => {
		if (!ref?.current?.getBoundingClientRect) {
			return;
		}
		const ourPosition = ref.current?.getBoundingClientRect();
		const buttonPosition =
			ref.current?.parentElement?.getBoundingClientRect();

		if (!ourPosition || !buttonPosition) {
			return;
		}

		const clientWidth =
			window.innerWidth || document.documentElement.clientWidth;

		const buttonCenterOffset =
			buttonPosition.left - (clientWidth - buttonPosition.right);

		// If the button is near enough to center, center dropdown
		if (buttonCenterOffset <= 3 && buttonCenterOffset >= -3) {
			setPositionClass('align-center');
			return;
		}

		// Otherwise, try to prevent dropdown from going off-screen
		if (ourPosition.right > clientWidth) {
			setPositionClass('align-right');
		} else if (ourPosition.left < 0) {
			setPositionClass('align-left');
		}
	}, [playerState.dropdown_open]);

	/**
	 * Set station focus when dropdown opens
	 */
	useEffect(() => {
		if (playerState.dropdown_open && props.focusFirstStation) {
			setFocusStation(0);
		} else {
			setFocusStation(null);
		}
	}, [playerState.dropdown_open]);

	return (
		<div
			ref={ref}
			id={props.id}
			class={`
				dropdown-container
				${positionClass}
				${playerState.dropdown_open ? 'open' : 'closed'}
			`}
			role="menu"
			aria-labelledby={props.handleId}
			onKeyDown={handleKeyDown}
		>
			<div>
				<div class="dropdown-inner">
					{playerState.dropdown_open &&
						Object.keys(playerState.station_data).map(
							(mount, index) => (
								<Station
									focus={index === focusStation}
									{...playerState.station_data[mount]}
								/>
							)
						)}
				</div>
			</div>
		</div>
	);
});
