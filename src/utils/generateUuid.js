/**
 * Unique UUID generation using crypto APIs
 * @returns {string}
 */
export default function generateUuid() {
	let crypto = window?.crypto || window?.msCrypto || null;
	if (crypto?.randomUUID) {
		return crypto.randomUUID();
	}
	// https://stackoverflow.com/a/2117523
	if (crypto?.getRandomValues) {
		return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
			(
				c ^
				(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
			).toString(16)
		);
	}
	// Last resort!
	return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => {
		var r = (Math.random() * 16) | 0,
			v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
