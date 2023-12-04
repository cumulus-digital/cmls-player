import { h, Fragment } from 'preact';
import { useEffect, useContext, useLayoutEffect } from 'preact/hooks';
import { forwardRef } from 'preact/compat';
import { shallowEqual, useSelector } from 'react-redux';

import Station from './Station';

import { playerStateSelects } from 'Store/playerStateSlice';

import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';
import { useMemo } from 'react';
import { useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { useClassNameSignal } from 'UI/hooks/ClassNameSignal';

export default forwardRef(function DropdownContainer(props, ref) {
	useLogRender('DropdownContainer');

	const appState = useContext(AppContext);

	const interactive = useSelector(playerStateSelects.interactive);
	const stations = useSelector(playerStateSelects.stations, shallowEqual);
	const stations_count = useSelector(playerStateSelects['stations/count']);

	const classNames = useClassNameSignal('dropdown-container');

	useSignalEffect(() => {
		if (appState.dropdown_open.value) {
			classNames.add('open');
		} else {
			classNames.delete('open');
		}

		classNames.deleteMany(['align-left', 'align-right', 'align-center']);

		let position = 'align-left';
		const me = ref.current;
		if (me) {
			const clientWidth =
				window.innerWidth || document.documentElement.clientWidth;

			const myWidth = me.offsetWidth;

			const buttonCenter =
				appState.button_width.value / 2 + appState.button_left.value;

			const buttonCenterOffset = clientWidth / 2 - buttonCenter;

			if (buttonCenterOffset <= 5 && buttonCenterOffset >= -5) {
				position = 'align-center';
			} else if (myWidth + appState.button_left.value > clientWidth) {
				position = 'align-right';
			}
		}

		classNames.add(position);
	});

	useEffect(() => {
		if (props.focusFirstStation) {
			appState.dropdown_focus_station.value = 0;
		}
	}, [props.focusFirstStation]);

	const focusNextStation = () => {
		const current = appState.dropdown_focus_station.value;
		const new_focus = current + 1;
		if (new_focus === stations_count) {
			appState.dropdown_focus_station.value = 0;
		} else {
			appState.dropdown_focus_station.value = new_focus;
		}
	};
	const focusPreviousStation = () => {
		const current = appState.dropdown_focus_station.value;
		const new_focus = current - 1;
		if (current === 0) {
			appState.dropdown_focus_station.value = stations_count - 1;
		} else {
			appState.dropdown_focus_station.value = new_focus;
		}
	};

	const handleKeyUp = (e) => {
		if (!interactive) {
			return;
		}

		const key = e.key;
		switch (key) {
			case 'Down':
			case 'ArrowDown':
				e.preventDefault();
				e.stopImmediatePropagation();
				focusNextStation();
				break;

			case 'Up':
			case 'ArrowUp':
				e.preventDefault();
				e.stopImmediatePropagation();
				focusPreviousStation();
				break;

			case 'Esc':
			case 'Escape':
				props.handleRef?.current?.focus();
				break;
		}
	};

	const stationRows = useSignal();
	useLayoutEffect(() => {
		stationRows.value = (
			<>
				{Object.values(stations)
					?.sort((a, b) => {
						// Primary first
						if (a.primary && !b.primary) return -1;
						if (b.primary && !a.primary) return 1;
						// Then order
						if (a.order < b.order) return -1;
						if (a.order > b.order) return 1;
						return 0;
					})
					.map((station, index) => {
						return (
							<Station
								station={station}
								key={station.mount}
								index={index}
								focus={
									appState.dropdown_focus_station.value ===
									index
								}
							/>
						);
					})}
			</>
		);
	}, [stations, appState.dropdown_open.value, appState.dropdown_focus_station.value]);

	return (
		<div
			ref={ref}
			id={props.id}
			class={classNames}
			role="menu"
			aria-labelledby={props.handleId}
			onKeyUp={handleKeyUp}
		>
			<div>
				<div class="dropdown-inner">{stationRows}</div>
			</div>
		</div>
	);
});
