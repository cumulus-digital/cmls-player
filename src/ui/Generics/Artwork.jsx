import { h } from 'preact';

export default function Artwork(props) {
	return (
		props?.url && (
			<div class={`artwork-container ${props.class || ''}`}>
				<img
					class="artwork"
					src={props.url}
					loading="lazy"
					alt={props.alt || 'Album artwork'}
				/>
			</div>
		)
	);
}
