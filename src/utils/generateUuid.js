/**
 * Unique UUID generation using crypto APIs
 * @returns {string}
 */
export default function generateUuid() {
	let crypto = self?.crypto || self?.msCrypto || null;
	if (crypto) {
		return crypto.randomUUID();
	}
	// https://stackoverflow.com/a/2117523
	return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
		(
			c ^
			(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
		).toString(16)
	);
}
