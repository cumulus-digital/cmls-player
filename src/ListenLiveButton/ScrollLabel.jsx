import { h, Component, Fragment } from 'preact';
import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { memo } from 'preact/compat';
import { useSelector, useDispatch } from 'react-redux';

import store from 'Store';

import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

import useMarquee from 'Utils/useMarquee';

/**
 * @param {{ label: string }} props
 */
export default memo(
	(props) => {
		const ref = useRef(null);

		const shouldScroll = useMarquee(ref);

		const Tag = `${props.tagName || 'div'}`;

		return (
			<>
				{props.label && (
					<Tag
						class={`${props.class || ''} scroll-label ${
							shouldScroll ? 'scroll' : ''
						}`}
						ref={ref}
						style={`--speed: ${
							props.label.length / (props.speedModifier || 4.5)
						}s`}
					>
						<span data-label={props.label}>{props.label}</span>
					</Tag>
				)}
			</>
		);
	},
	(prevProps, nextProps) => {
		const shouldRerender = ['class', 'label', 'speedModifier'].some(
			(k) => prevProps?.[k] !== nextProps?.[k]
		);
		return !shouldRerender;
	}
);
