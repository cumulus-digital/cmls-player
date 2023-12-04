import { h, Fragment, createRef } from 'preact';
import { useState, useId } from 'preact/hooks';

import Handle from './Handle';
import Container from './Container';

import useLogRender from 'Utils/useLogRender';

export default function Dropdown(props) {
	useLogRender('Dropdown');

	const [focusFirstStation, setFocusFirstStation] = useState(false);

	const handleRef = createRef();
	const handleId = useId();
	const containerRef = createRef();
	const containerId = useId();

	const handleActivation = (focusFirst) => {
		if (focusFirst) {
			setFocusFirstStation(true);
		}
	};

	return (
		<>
			<Handle
				id={handleId}
				ref={handleRef}
				containerId={containerId}
				onInteraction={handleActivation}
			/>
			<Container
				id={containerId}
				ref={containerRef}
				handleId={handleId}
				handleRef={handleRef}
				focusFirstStation={focusFirstStation}
			/>
		</>
	);
}
