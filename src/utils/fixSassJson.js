/**
 * To use json in SASS effectively, you need to wrap strings in double
 * and single quotes together. This removes them for use in JS.
 *
 * @param {object} json
 * @return {object}
 */
const fixSassJson = (json) => {
	for (let k in json) {
		if (typeof json[k] === 'string' || json[k] instanceof String) {
			json[k] = json[k].replace(/^'(.*)'$/, '$1');
		}
	}
	return json;
};

export default fixSassJson;
