import { h, Fragment } from 'preact';
import { useRef } from 'preact/hooks';
import { Signal } from '@preact/signals';

import useMarquee from 'Utils/useMarquee';

/**
 * @param {{ label: string }} props
 */
export default function ScrollLabel(props) {
	const ref = useRef(null);

	const shouldScroll = useMarquee(ref);

	const Tag = `${props.tagName || 'div'}`;

	return (
		<>
			{props.label && (
				<Tag
					class={`${props.class || ''} scroll-label ${
						shouldScroll.value ? 'scroll' : ''
					}`}
					ref={ref}
					style={`
						--speed: ${
							(props.label instanceof Signal
								? props.label.value.length
								: props.label.length) /
							(props.speedModifier || 4.5)
						}s;
						${props.spacing ? '--spacing: ' + props.spacing + ';' : null}
					`}
				>
					<span data-label={props.label}>{props.label}</span>
				</Tag>
			)}
		</>
	);
}
