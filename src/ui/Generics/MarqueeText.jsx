import { h, Fragment, Component } from 'preact';
import { Signal, useSignal, useSignalEffect } from '@preact/signals';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'preact/hooks';
import { useClassNameSignal } from 'UI/hooks/ClassNameSignal';

/**
 * Creates a component with a text label animating in a marquee scroll
 *
 * @param {object} props
 * @param {string} props.label Text to marquee
 * @param {number} [props.speed=4] Speed of the scroll
 * @param {string} [props.spacing=1.3em] Spacing between initial label and its trailing copy
 * @param {string} [props.outerTag=div]
 * @param {string} [props.innerTag=span]
 * @returns {Component}
 */
export default function MarqueeText(props) {
	const options = useMemo(
		() => ({
			speed: 4,
			delay: 2,
			spacing: '1.3em',
			outerTag: 'div',
			innerTag: 'span',
			...props,
		}),
		[props]
	);

	const OuterTag = options.outerTag;
	const InnerTag = options.innerTag;

	const outerRef = useRef(null);
	const innerRef = useRef(null);

	const outerWidth = useSignal(0);
	const innerWidth = useSignal(0);
	const shouldScroll = useSignal(false);

	useEffect(() => {
		const outer = outerRef.current;
		const inner = innerRef.current;

		const outerObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				outerWidth.value = entry.contentRect.width;
			}
		});

		const innerObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				innerWidth.value = entry.contentRect.width;
			}
		});

		outerObserver.observe(outer);
		innerObserver.observe(inner);

		return () => {
			outerObserver.disconnect();
			innerObserver.disconnect();
		};
	}, [outerRef.current, innerRef.current]);

	/*
	const classNames = useSignal(
		`marqueetext${props?.class && ` ${props.class}`}`
	);
	*/
	const classNames = useClassNameSignal(
		['marqueetext', props?.class, shouldScroll.value ? 'will-scroll' : '']
			.join(' ')
			.trim()
	);
	useSignalEffect(() => {
		// Delay re-setting scroll class
		const delayTimeout = setTimeout(() => {
			if (shouldScroll.value) {
				classNames.add('scroll');
			} else {
				classNames.delete('scroll');
			}
		}, 250);

		if (innerWidth.value && outerWidth.value) {
			shouldScroll.value = innerWidth.value - 1 > outerWidth.value;
		}

		if (shouldScroll.value) {
			classNames.add('will-scroll');
		} else {
			classNames.delete('will-scroll');
		}

		classNames.value;

		return () => {
			clearTimeout(delayTimeout);
		};
	});

	const style = useSignal('');
	useLayoutEffect(() => {
		const label =
			options.label instanceof Signal
				? options.label.value
				: options.label;
		const styles = {
			'--speed': `${label.length / options.speed}s`,
			'--delay': `${options.delay}s`,
			'--spacing': options.spacing,
		};
		style.value = Object.entries(styles)
			.map(([key, value]) => `${key}: ${value}`)
			.join('; ');
	}, [options.label, options.delay, options.spacing]);

	const restartAnimation = (e) => {
		e.stopPropagation();
		classNames.delete('scroll');
	};

	return (
		<>
			<OuterTag class={classNames} ref={outerRef} style={style}>
				<InnerTag
					class="inner"
					ref={innerRef}
					data-content={options.label}
					onAnimationEnd={restartAnimation}
				>
					{options.label}
				</InnerTag>
			</OuterTag>
		</>
	);
}
