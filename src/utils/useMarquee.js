import { Signal, useComputed, useSignal } from '@preact/signals';
import { useState, useEffect } from 'preact/hooks';

/**
 * Allow an element to automatically marquee when its content
 * exceeds its boundaries. The element must contain one container
 * child to calculate boundary clipping.
 *
 * @param {object} ref ref object for the element
 * @returns {Signal} Read value to determine if the element should scroll
 */
const useMarquee = (ref) => {
	//const [shouldScroll, setShouldScroll] = useState(false);
	//const shouldScroll = useSignal(false);
	const childWidth = useSignal();
	const parentWidth = useSignal();
	const shouldScroll = useComputed(() => {
		if (childWidth.value > parentWidth.value) {
			return true;
		}
		return false;
	});

	const genObserver = (el, val) => {
		const observer = new ResizeObserver((entries) => {
			let width;
			for (const entry of entries) {
				if (entry.contentBoxSize) {
					const contentBoxSize = entry.contentBoxSize[0];
					width = contentBoxSize.inlineSize;
				} else {
					width = entry.contentRect.width;
				}
			}
			val.value = width;
		});
		observer.observe(el);
		return observer;
	};

	useEffect(() => {
		const parentObserver = genObserver(ref.current, parentWidth);
		const childObserver = genObserver(ref.current.firstChild, childWidth);

		return () => {
			parentObserver.disconnect();
			childObserver.disconnect();
		};
	}, [ref]);

	return shouldScroll;
};

export default useMarquee;
