export default (value) => {
	let res = 0;
	for (let i = 0; i < value.length; i++) {
		res += value.charCodeAt(i);
	}
	return res % 16;
};
