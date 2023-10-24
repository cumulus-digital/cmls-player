import { useState, useEffect } from 'preact/hooks';

/**
 * Allow an element to automatically marquee when its content
 * exceeds its boundaries. The element must contain one container
 * child to calculate boundary clipping.
 *
 * @param {object} ref ref object for the element
 * @returns {boolean} State
 */
const useMarquee = (ref) => {
	const [shouldScroll, setShouldScroll] = useState(false);

	const testSize = () => {
		if (!ref?.current?.firstChild?.offsetWidth) {
			return;
		}

		const overflowX =
			ref.current.firstChild.offsetWidth > ref.current.offsetWidth;
		if (overflowX) {
			setShouldScroll(true);
		} else {
			setShouldScroll(false);
		}
	};

	let testInterval;
	useEffect(() => {
		testInterval = setInterval(() => testSize(), 250);

		return () => {
			clearInterval(testInterval);
			testInterval = null;
		};
	}, []);

	return shouldScroll;
};

export default useMarquee;
