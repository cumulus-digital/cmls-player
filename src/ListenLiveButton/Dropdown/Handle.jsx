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

		if (playerState.interactive) {
			dispatch(playerStateActions['action/dropdown-toggle']());
		}
	};

	const openDropdown = () => {
		if (playerState.interactive) {
			dispatch(playerStateActions['action/dropdown-open']());
		}
	};
	const closeDropdown = () => {
		if (playerState.interactive) {
			dispatch(playerStateActions['action/dropdown-close']());
		}
	};

	const handleKeyDown = (e) => {
		if (!playerState.interactive) {
			return;
		}

		const key = e.key;
		let stopBubble = false;
		let toFocus = null;

		switch (key) {
			case ' ':
			case 'Enter':
				stopBubble = true;
				if (playerState.dropdown_open) {
					closeDropdown();
					props?.onKeyboardActivation(false);
				} else {
					openDropdown();
					props?.onKeyboardActivation(true);
				}
				break;
			case 'ArrowDown':
			case 'Down':
				stopBubble = true;
				openDropdown();
				props?.onKeyboardActivation(true);
				break;
			case 'Up':
			case 'ArrowUp':
				stopBubble = true;
				closeDropdown();
				props?.onKeyboardActivation(false);
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
		>
			{playerState.dropdown_open ? <FaAngleUp /> : <FaAngleDown />}
		</button>
	);
});
