/**
 * Generates a small, NON-CRYPTOGRAPHIC hash from a string.
 * @param {string} value
 */
export default function generateIdFromString(value) {
	const str = new String(value);
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash &= hash; // Convert to 32bit integer
	}
	return (hash >>> 0).toString(36);
}
