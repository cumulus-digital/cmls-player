import config from '../config.json';

export default function isParentWindow() {
	return window.name !== config.siteframe_id;
}
