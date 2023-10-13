import { h, Component, Fragment } from 'preact';
import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { forwardRef } from 'preact/compat';
import { useSelector, useDispatch } from 'react-redux';

import { FaAngleDown, FaAngleUp } from 'react-icons/fa';

import store from 'Store';

import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

export default forwardRef((props, me) => {
	const playerState = useSelector(playerStateSelect);
	const dispatch = useDispatch();

	const handleClick = (e) => {
		e.preventDefault();

		//if (playerState.interactive) {
		dispatch(playerStateActions['action/dropdown-toggle']());
		me.current.focus();
		//}
	};

	const openDropdown = () => {
		//if (playerState.interactive) {
		dispatch(playerStateActions['action/dropdown-open']());
		props?.onInteraction(true);
		//}
	};
	const closeDropdown = () => {
		//if (playerState.interactive) {
		dispatch(playerStateActions['action/dropdown-close']());
		props?.onInteraction(false);
		//}
	};

	const handleKeyDown = (e) => {
		//if (!playerState.interactive) {
		//	return;
		//}

		const key = e.key;
		let stopBubble = false;
		let toFocus = null;

		switch (key) {
			case ' ':
			case 'Enter':
				stopBubble = true;
				if (playerState.dropdown_open) {
					closeDropdown();
				} else {
					openDropdown();
				}
				break;
			case 'ArrowDown':
			case 'Down':
				stopBubble = true;
				openDropdown();
				break;
			case 'Up':
			case 'ArrowUp':
				stopBubble = true;
				closeDropdown();
				break;
		}

		if (stopBubble) {
			e.stopPropagation();
			e.preventDefault();
		}
	};

	return (
		<button
			ref={me}
			id={props.id}
			class={`dropdown-handle ${
				playerState.dropdown_open ? 'open' : 'closed'
			}`}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			tabindex="0"
			title="View available stations"
			role="button"
			aria-label="View available stations for streaming"
			aria-haspopup="true"
			aria-expanded={playerState.dropdown_open ? true : null}
			aria-controls={props.containerId}
			disabled={!playerState.interactive}
		>
			{playerState.dropdown_open ? <FaAngleUp /> : <FaAngleDown />}
		</button>
	);
});
