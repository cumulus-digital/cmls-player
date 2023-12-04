import { useSignal } from '@preact/signals';
import { h } from 'preact';
import { useLayoutEffect } from 'preact/hooks';

export default function Artwork(props) {
	const content = useSignal();
	useLayoutEffect(() => {
		if (props?.url) {
			content.value = (
				<div class={`artwork-container ${props.class || ''}`}>
					<img
						class="artwork"
						src={props.url}
						loading="lazy"
						alt={props.alt || 'Album artwork'}
					/>
				</div>
			);
		} else {
			content.value = null;
		}
	}, [props?.url, props?.alt, props?.class]);
	return content;
}
