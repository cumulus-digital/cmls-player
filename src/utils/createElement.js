/**
 * Generic element generator
 */
const doc = window.self.document;

const creator = {
	// Any element
	el: (type, attr = {}) => {
		const el = doc.createElement(type);
		if (
			attr !== null &&
			(typeof attr === 'function' || typeof attr === 'object')
		) {
			for (const a in attr) {
				el.setAttribute(a, attr[a]);
			}
		}
		return el;
	},
	// Script tags
	script: (src, attr = {}) => {
		attr = Object.assign(attr, {
			type: 'text/javascript',
			async: true,
			src: src,
		});
		var scr = creator.el('script', attr);
		return scr;
	},
	// Anonymous iframe
	iframe: (attr = {}, html = '') => {
		var iframe = creator.el('iframe', attr);
		iframe.onload = () => {
			iframe.onload = false;
			const cw = iframe.contentWindow.document;
			cw.open();
			cw.write(html);
			cw.close();
		};
		return iframe;
	},
};

export default creator;

const appendChild = (parent, child) => {
	if (Array.isArray(child)) {
		child.forEach((nestedChild) => appendChild(parent, nestedChild));
	} else {
		parent.appendChild(
			child?.nodeType ? child : document.createTextNode(child)
		);
	}
};

export const h = (tag, props, ...children) => {
	const element = document.createElement(tag);

	Object.entries(props || {}).forEach(([name, value]) => {
		if (name.startsWith('on') && name.toLowerCase() in window) {
			element.addEventListener(name.toLowerCase().substring(2), value);
		} else {
			element.setAttribute(
				name,
				typeof value === 'boolean' ? value : value.toString()
			);
		}
	});

	children.forEach((child) => {
		appendChild(element, child);
	});

	return element;
};

export const Fragment = (props, ...children) => {
	return children;
};
