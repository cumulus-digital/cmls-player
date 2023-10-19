import Logger from 'Utils/Logger';
import { useEffect } from 'preact/hooks';

export default function useLogRender(log) {
	if (!window.location.search.includes('logrender')) {
		return;
	}

	if (typeof log === 'string') {
		log = new Logger(log);
	}
	useEffect(() => {
		log.debug('Render');
	});
}
