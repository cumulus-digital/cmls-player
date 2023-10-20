import { h } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';
import { forwardRef } from 'preact/compat';
import { shallowEqual, useSelector } from 'react-redux';

import Station from './Station';

import { playerStateSelects } from 'Store/playerStateSlice';

import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';
import { useMemo } from 'react';

export default forwardRef(function DropdownContainer(props, ref) {
	useLogRender('DropdownContainer');

	const appState = useContext(AppContext);

	const interactive = useSelector(playerStateSelects.interactive);
	const stations = useSelector(playerStateSelects.stations, shallowEqual);
	const stations_count = useSelector(playerStateSelects['stations/count']);

	const [focusStation, setFocusStation] = useState(null);
	const [positionClass, setPositionClass] = useState('align-left');

	const canFocusNextStation = () => {
		if (focusStation + 1 < stations_count) {
			return true;
		}
	};

	const focusNextStation = () => {
		if (focusStation + 1 < stations_count) {
			setFocusStation(focusStation + 1);
		} else {
			setFocusStation(0);
		}
	};

	const focusPreviousStation = () => {
		if (focusStation > 0) {
			setFocusStation(focusStation - 1);
		} else {
			setFocusStation(stations_count - 1);
		}
	};

	const handleKeyUp = (e) => {
		if (!interactive) {
			return;
		}

		const key = e.key;
		const stopBubble = () => {
			e.stopPropagation();
			e.preventDefault();
		};

		switch (key) {
			case 'Tab':
				if (!canFocusNextStation()) {
					break;
				}
			case 'Down':
			case 'ArrowDown':
				stopBubble();
				focusNextStation();
				break;
			case 'Up':
			case 'ArrowUp':
				stopBubble();
				focusPreviousStation();
				break;
			case 'Esc':
			case 'Escape':
				//dispatch(playerStateActions['set/dropdown_open'](false));
				appState.dropdown_open.value = false;
				props.handleRef?.current?.focus();
				break;
		}
	};

	/**
	 * Checks if dropdown would go off-screen and sets an
	 * appropriate class to position it.
	 */
	useEffect(() => {
		if (!appState.dropdown_open.value) {
			return;
		}

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
	}, [appState.dropdown_open.value]);

	/**
	 * Set station focus when dropdown opens
	 */
	useEffect(() => {
		if (props.focusFirstStation) {
			setFocusStation(0);
		}
	}, [props.focusFirstStation]);

	/**
	 * Output array of Station components ordered by
	 * the station's order property
	 *
	 * @returns {array}
	 */
	const stationsOutput = useMemo(() => {
		return Object.values(stations)
			?.sort((a, b) => {
				// Primary is first
				if (a.primary && !b.primary) return -1;
				if (b.primary && !a.primary) return 1;
				if (a.order < b.order) return -1;
				if (a.order > b.order) return 1;
				return 0;
			})
			.map((station, index) => (
				<Station {...station} focus={index === focusStation} />
			));
	}, [stations]);

	return (
		<div
			ref={ref}
			id={props.id}
			class={`
				dropdown-container
				${positionClass}
				${appState.dropdown_open.value ? 'open' : 'closed'}
			`}
			role="menu"
			aria-labelledby={props.handleId}
			onKeyUp={handleKeyUp}
		>
			<div>
				<div class="dropdown-inner">
					{appState.dropdown_open.value && stationsOutput}
				</div>
			</div>
		</div>
	);
});
