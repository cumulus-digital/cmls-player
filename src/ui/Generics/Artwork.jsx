import { h } from 'preact';

export default function Artwork(props) {
	return (
		props?.url && (
			<img
				class={`artwork ${props.class || ''}`}
				src={props.url}
				loading="lazy"
				alt={props.alt || 'Album artwork'}
			/>
		)
	);
}
