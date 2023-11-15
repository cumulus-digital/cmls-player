/**
 * Returns a promise to wait for a variable to pass check function
 *
 * @param {*} ref
 * @param {function} check
 * @param {integer} timeout
 */
export default function waitForVariable(
	ref,
	check = (r) => typeof r !== 'undefined',
	timeout = 10000
) {
	const start = Date.now();

	function waitingForVariable(resolve, reject) {
		if (check(ref)) {
			resolve(ref);
		} else if (Date.now() - start >= timeout) {
			reject(new Error('Timed out waiting for ref'));
		} else {
			setTimeout(waitingForVariable.bind(this, resolve, reject), 50);
		}
	}
	return new Promise(waitingForVariable);
}
