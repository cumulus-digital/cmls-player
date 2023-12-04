import { h } from 'preact';
import { useMemo, useContext } from 'preact/hooks';
import { forwardRef } from 'preact/compat';
import { useSelector } from 'react-redux';

import { playerStateSelects } from 'Store/playerStateSlice';

import { IconAngleDown, IconAngleUp } from '@/ui/Icons';
import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';
import { useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { useClassNameSignal } from 'UI/hooks/ClassNameSignal';

export default forwardRef(function DropdownHandle(props, me) {
	useLogRender('DropdownHandle');

	const appState = useContext(AppContext);

	const interactive = useSelector(playerStateSelects.interactive);

	const handleClick = (e) => {
		e.preventDefault();

		appState.dropdown_open.value = !appState.dropdown_open.value;
		//me.current.focus();
	};

	const handleKeyUp = (e) => {
		const key = e.key;
		console.log('KEY', { key, type: typeof key });

		switch (key) {
			case ' ':
			case 'Enter':
				// Toggle dropdown state
				e.preventDefault();
				e.stopPropagation();
				appState.dropdown_open.value = !appState.dropdown_open.value;
				if (appState.dropdown_open.value) {
					appState.dropdown_focus_station.value = 0;
				}
				break;
			case 'ArrowDown':
			case 'Down':
				e.preventDefault();
				e.stopImmediatePropagation();
				appState.dropdown_open.value = true;
				if (appState.dropdown_open.value) {
					appState.dropdown_focus_station.value = 0;
				}
				break;

			case 'Up':
			case 'ArrowUp':
				e.preventDefault();
				e.stopImmediatePropagation();
				appState.dropdown_open.value = false;
				break;
		}
	};

	const classNames = useClassNameSignal('dropdown-handle with-hover-box');
	const expanded = useSignal(null);
	useSignalEffect(() => {
		if (appState.dropdown_open.value) {
			classNames.add('open');
			expanded.value = true;
		} else {
			classNames.delete('open');
			expanded.value = null;
		}
	});

	// Should the button be disabled?
	const isDisabled = useMemo(() => {
		return !(interactive && appState.sdk.ready.value);
	}, [interactive, appState.sdk.ready.value]);

	const actionIcon = useSignal();
	useSignalEffect(() => {
		if (appState.sdk.ready.value) {
			if (appState.dropdown_open.value) {
				actionIcon.value = <IconAngleUp />;
			} else {
				actionIcon.value = <IconAngleDown />;
			}
		} else {
			actionIcon.value = null;
		}
	});

	return (
		<button
			ref={me}
			id={props.id}
			class={classNames}
			onClick={handleClick}
			onKeyUp={handleKeyUp}
			tabindex="0"
			title="View available stations"
			role="button"
			aria-label="View available stations for streaming"
			aria-haspopup="true"
			aria-expanded={expanded}
			aria-controls={props.containerId}
			disabled={isDisabled}
		>
			{actionIcon}
		</button>
	);
});
