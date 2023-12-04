import { h, Fragment, Component } from 'preact';
import { Signal, useSignal, useSignalEffect } from '@preact/signals';
import { useLayoutEffect, useMemo } from 'preact/hooks';
import MarqueeText from './MarqueeText';
import { useClassNameSignal } from 'UI/hooks/ClassNameSignal';

/**
 * Creates a component with a text label animating in a marquee scroll
 *
 * @param {object} props
 * @param {array|string} props.labels Text to marquee
 * @param {number} [props.speed=10] Speed of the scroll in seconds
 * @param {number} [props.delay=5] Delay animation by seconds
 * @param {string} [props.outerTag=div]
 * @param {string} [props.marqueeOuterTag=div]
 * @param {string} [props.marqueeInnerTag=span]
 * @returns {Component}
 */
export default function SlidingText(props) {
	const options = useMemo(
		() => ({
			speed: 10,
			delay: 10,
			outerTag: 'div',
			innerTag: 'div',
			...props,
		}),
		[props]
	);

	const OuterTag = options.outerTag;
	const InnerTag = options.innerTag;

	const labels = useMemo(() => {
		const labelArray = (
			Array.isArray(options?.labels) ? options?.labels : [options.labels]
		).filter((n) => n);
		const labelSet = new Set();
		const testSet = new Set();
		labelArray.forEach((label) => {
			let test = label;
			if (label instanceof Signal) {
				test = label.value;
			}
			if (!testSet.has(test)) {
				labelSet.add(label);
			}
			testSet.add(test);
		});
		return Array.from(labelSet);
	}, [options?.labels]);

	const labelElements = useMemo(() => {
		return labels.map((label) => {
			return <MarqueeText label={label} speed="3" spacing="0.75em" />;
		});
	}, [labels]);

	const shouldShuffle = useMemo(() => labels.length > 1, [labels]);

	const classNames = useClassNameSignal(
		`slidetext${shouldShuffle ? ' scroll' : ''}${
			options?.class ? ' ' + options.class : ''
		}`
	);
	useSignalEffect(() => {
		// Delay re-setting scroll class
		const delayTimeout = setTimeout(() => {
			classNames.delete('scroll');
			if (shouldShuffle) {
				classNames.add('scroll');
			}
		}, 150);

		classNames.value;

		return () => {
			clearTimeout(delayTimeout);
		};
	});

	const restartAnimation = (e) => {
		e.stopPropagation();
		classNames.delete('scroll');
	};

	const style = useSignal('');
	useLayoutEffect(() => {
		const styles = {
			'--speed': `${options.speed}s`,
			'--delay': `${options.delay}s`,
		};
		style.value = Object.entries(styles)
			.map(([key, value]) => `${key}: ${value}`)
			.join('; ');
	}, [options]);

	return (
		<OuterTag class={classNames} style={style}>
			<InnerTag
				class="inner"
				data-content={labels.join}
				onAnimationEnd={restartAnimation}
			>
				{labelElements}
			</InnerTag>
		</OuterTag>
	);
}

/*
const useSliding = (labels, props, OuterTag = 'div') => {
	props = {
		speed: 4.5,
		...props,
	};
	labels = (Array.isArray(labels) ? labels : [labels]).filter((n) => n);

	return function usesSliding() {
		const shouldScroll = useMemo(() => labels.length > 1, [labels]);

		const labelElements = useMemo(() => {
			return labels.map((label) =>
				useMarquee(label, { speed: 3, spacing: '.75em' })
			);
		}, [labels]);

		console.log(labels, labelElements);

		const classNames = useSignal(
			`slidetext${shouldScroll ? ' scroll' : ''}${
				props?.class ? ' ' + props.class : ''
			}`
		);
		useSignalEffect(() => {
			const classSet = getClassNameSet(classNames.value);
			// Delay re-setting scroll class
			const delayTimeout = setTimeout(() => {
				classSet.delete('scroll');
				if (shouldScroll.value) {
					classSet.add('scroll');
				}
				const newClassNames = getClassNamesFromSet(classSet);
				if (newClassNames !== classNames.value) {
					classNames.value = newClassNames;
				}
			}, 100);

			return () => {
				clearTimeout(delayTimeout);
			};
		});

		const style = useSignal('');
		useLayoutEffect(() => {
			const styles = {
				'--speed': `${props.speed}s`,
			};
			style.value = Object.entries(styles)
				.map(([key, value]) => `${key}: ${value}`)
				.join('; ');
		}, [props]);

		const restartAnimation = () => {
		};

		return useMemo(
			() => (
				<OuterTag class={classNames} style={style}>
					{labelElements}
				</OuterTag>
			),
			[labelElements]
		);
	};
};
export default useSliding;
*/
