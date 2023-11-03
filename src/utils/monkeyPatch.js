import Logger from 'Utils/Logger';
const log = new Logger('monkeyPatch');

/**
 * Monkey patch a function
 * @param {object} obj Where to apply the function
 * @param {string} key Function name to override
 * @param {function|string} override Patched function
 * @returns {function} Returns obj for chaining.
 */
export default function (obj, key, override) {
	let original = obj?.[key] || undefined;
	const applyPatch = (...args) => {
		if (typeof override === 'function') {
			return override.apply(obj, [original, ...args]);
		}
		return override;
	};

	if (obj[key] !== applyPatch) {
		try {
			Object.defineProperty(obj, key, {
				get: function () {
					if (original) {
						return applyPatch;
					}
					return original;
				},
				set: function (newOriginal) {
					original = newOriginal;
				},
			});
			log.debug('Patched', obj, key, override);
		} catch (e) {
			log.warn('Unable to patch', obj, key, override, e);
		}
	}
	return obj;
}
