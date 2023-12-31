/**
 * Determine when readyState is "interactive" or better.
 *
 * @param {function} [cb]
 * @returns {Promise}
 */
export const domReady = (cb = null) => {
	const waiting = (resolve, reject) => {
		if (window.self.document.readyState !== 'loading') {
			if (cb) {
				cb.call(this);
			}
			resolve();
		} else {
			const doCb = (e) => {
				if (cb) {
					cb.call(this);
				}
				resolve();
				window.self.document.removeEventListener(
					'readystatechange',
					doCb
				);
			};
			window.self.document.addEventListener(
				'readystatechange',
				doCb.bind(this)
			);
		}
	};
	return new Promise(waiting);
};
export default domReady;
