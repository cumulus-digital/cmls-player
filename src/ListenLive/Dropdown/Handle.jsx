import { h } from 'preact';
import { forwardRef, useCallback, useContext } from 'preact/compat';
import { useSelector, useDispatch } from 'react-redux';

import {
	FaAngleDown as IconAngleDown,
	FaAngleUp as IconAngleUp,
} from 'react-icons/fa6';

import { playerStateSelects } from 'Store/playerStateSlice';

import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';

export default forwardRef(function DropdownHandle(props, me) {
	useLogRender('DropdownHandle');

	const appState = useContext(AppContext);

	//const playerState = useSelector(playerStateSelect);
	const interactive = useSelector(playerStateSelects.interactive);
	//const dropdown_open = useSelector(playerStateSelects.dropdown_open);
	const dispatch = useDispatch();

	const handleClick = useCallback(
		(e) => {
			e.preventDefault();

			//dispatch(playerStateActions['set/dropdown_open'](!dropdown_open));
			appState.dropdown_open.value = !appState.dropdown_open.value;
			me.current.focus();
		},
		[me, appState.dropdown_open]
	);

	const openDropdown = useCallback(() => {
		//dispatch(playerStateActions['set/dropdown_open'](true));
		appState.dropdown_open.value = true;
	});
	const closeDropdown = useCallback(() => {
		//dispatch(playerStateActions['set/dropdown_open'](false));
		appState.dropdown_open.value = false;
	});

	const handleKeyDown = useCallback(
		(e) => {
			const key = e.key;
			const stopBubble = () => {
				e.stopPropagation();
				e.preventDefault();
			};

			let sendInteraction = false;

			switch (key) {
				case ' ':
				case 'Enter':
					stopBubble();
					if (appState.dropdown_open.value) {
						closeDropdown();
					} else {
						sendInteraction = true;
						openDropdown();
					}
					break;
				case 'ArrowDown':
				case 'Down':
					if (!appState.dropdown_open.value) {
						stopBubble();
						sendInteraction = true;
						openDropdown();
					}
					break;
				case 'Esc':
				case 'Escape':
					if (!appState.dropdown_open.value) {
						break;
					}
				case 'Up':
				case 'ArrowUp':
					if (appState.dropdown_open.value) {
						stopBubble();
						closeDropdown();
					}
					break;
			}

			if (sendInteraction) {
				props?.onInteraction(true);
			}
		},
		[appState.dropdown_open.value]
	);

	return (
		<button
			ref={me}
			id={props.id}
			class={`dropdown-handle ${
				appState.dropdown_open.value ? 'open' : 'closed'
			}`}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			tabindex="0"
			title="View available stations"
			role="button"
			aria-label="View available stations for streaming"
			aria-haspopup="true"
			aria-expanded={appState.dropdown_open.value ? true : null}
			aria-controls={props.containerId}
			disabled={!(interactive && appState.sdk.ready.value)}
		>
			{appState.sdk.ready.value &&
				(appState.dropdown_open.value ? (
					<IconAngleUp />
				) : (
					<IconAngleDown />
				))}
		</button>
	);
});
