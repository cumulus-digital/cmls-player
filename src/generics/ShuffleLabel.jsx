import { h, Fragment } from 'preact';
import { useMemo, useRef } from 'preact/hooks';
import { Signal, useComputed } from '@preact/signals';

import useMarquee from 'Utils/useMarquee';
import ScrollLabel from './ScrollLabel';

/**
 * @param {{labels: (array<string>|Signal)}} props
 */
export default function ShuffleLabel(props) {
	const ref = useRef(null);

	const Tag = `${props.tagName || 'div'}`;

	const labels = useMemo(() => {
		const labels =
			props.labels instanceof Signal ? props.labels.value : props.labels;
		let resolved_labels = [];
		labels.map((l) => {
			const val = l instanceof Signal ? l.value : l;
			if (resolved_labels.indexOf(val) < 0) {
				resolved_labels.push(val);
			}
		});
		console.log(resolved_labels);
		return resolved_labels.map((l) => (
			<ScrollLabel
				label={l}
				speedModifier="3"
				spacing="0.75em"
			></ScrollLabel>
		));
	}, [props.labels instanceof Signal ? props.labels.value : props.labels]);

	const shouldShuffle = useMemo(() => {
		return labels.length > 1;
	}, [labels]);

	return (
		<>
			{(props.labels instanceof Signal
				? props.labels.value
				: props.labels
			).length && (
				<Tag
					class={`${props.class || ''} shuffle-label ${
						shouldShuffle ? 'shuffle' : ''
					}`}
					ref={ref}
					style={`
						--speed: ${
							(props.labels?.value?.length ||
								props.labels.length) /
							(props.speedModifier || 4.5)
						}s;
					`}
				>
					<div
						data-label={
							props.labels instanceof Signal
								? props.labels.value[0]
								: props.labels[0]
						}
					>
						{labels}
					</div>
				</Tag>
			)}
		</>
	);
}
