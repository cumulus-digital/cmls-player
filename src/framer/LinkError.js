export class LinkError extends Error {
	constructor(message) {
		super(message);
		this.name = 'LinkError';
	}
}
export class EmptyLinkError extends LinkError {
	constructor(message) {
		super(message);
		this.name = 'EmptyLinkError';
	}
}
export class MalformedLinkError extends LinkError {
	constructor(message) {
		super(message);
		this.name = 'MalformedLinkError';
	}
}
export class CrossOriginLinkError extends LinkError {
	constructor(message) {
		super(message);
		this.name = 'CrossOriginLinkError';
	}
}
export class SamePageHashLinkError extends LinkError {
	constructor(message) {
		super(message);
		this.name = 'SamePageHashLinkError';
	}
}
