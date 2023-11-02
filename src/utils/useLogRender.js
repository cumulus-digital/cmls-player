import Logger from 'Utils/Logger';
import { useEffect } from 'preact/hooks';

export default function useLogRender(log, extra = null) {
	if (!window.location.search.includes('logrender')) {
		return;
	}

	if (typeof log === 'string') {
		log = new Logger(log);
	}
	useEffect(() => {
		if (extra) {
			log.debug('Render', extra);
		} else {
			log.debug('Render');
		}
	});
}
