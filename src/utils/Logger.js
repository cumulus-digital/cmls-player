export default class Logger {
	#header = null;

	constructor(defaultHeader) {
		this.header = defaultHeader;
	}

	timestamp() {
		return new Date()?.toISOString() || new Date().toUTCString();
	}

	resolveMessage(request) {
		let message = request;
		let headerLength = 160;
		if (
			Array.isArray(request) &&
			request.length > 0 &&
			request[0]?.message &&
			request[0]?.headerLength
		) {
			message = request[0].message;
			headerLength = request[0].headerLength;
		}
		return { message, headerLength };
	}

	smallString(str, length = 160) {
		return !str
			? str
			: (str instanceof Element
					? str.innerHTML
					: str.toString()
			  ).substring(0, length);
	}

	displayHeader(type, message, headerLength = 160) {
		// Add icon to message type
		const colors = {
			debug: {
				bg: '065',
				fg: 'fff',
			},
			info: {
				bg: '137',
				fg: 'fff',
			},
			warn: {
				bg: 'c90',
				fg: '000',
			},
			error: {
				bg: '500',
				fg: 'e77',
			},
		};

		let header = [
			`%c ${this.header} `,
			`background: #${colors[type].bg}; color: #${colors[type].fg}`,
		];

		if (message) {
			if (Array.isArray(message)) {
				const parseArr = (a) => {
					return a.map((i) => {
						if (Array.isArray(i)) {
							return parseArr(i);
						}
						if (typeof i !== 'string') {
							return JSON.stringify(i);
						}
						return i;
					});
				};
				header.push(
					this.smallString(
						parseArr(message).join(' || '),
						headerLength
					)
				);
			} else {
				header.push(this.smallString(message, headerLength));
			}
		}

		window.top.console.groupCollapsed.apply(
			window.top.console.groupCollapsed,
			header
		);
	}

	displayFooter() {
		window.top.console.debug('TIMESTAMP:', this.timestamp());
		window.top.console.trace();
		window.top.console.groupEnd();
	}

	logMessage(type, message, headerLength = 160) {
		if (!(typeof console === 'object' && console.groupCollapsed)) {
			return false;
		}

		if (Array.isArray(message) && message.length === 1) {
			message = message[0];
		}

		this.displayHeader(type, message, headerLength);

		if (headerLength !== Infinity) {
			window.top.console.debug(message);
		}

		this.displayFooter();
	}

	handleMessage(type, ...request) {
		// Require debug in url query for debug or info levels
		if (
			['debug', 'info'].includes(type) &&
			!window.location.search.includes('debug')
		) {
			//return;
		}
		let { message, headerLength } = this.resolveMessage(request);
		this.logMessage(type, message, headerLength);
	}

	info(...request) {
		this.handleMessage('info', request);
	}

	debug(...request) {
		this.handleMessage('debug', request);
	}

	warn(...request) {
		this.handleMessage('warn', request);
	}

	error(...request) {
		this.handleMessage('error', request);
	}
}
