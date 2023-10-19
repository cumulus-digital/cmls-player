import { h, Fragment, createRef } from 'preact';
import { useEffect, useState, useId, useContext } from 'preact/hooks';

import Handle from './Handle';
import Container from './Container';

import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';

export default function Dropdown(props) {
	useLogRender('Dropdown');

	const appState = useContext(AppContext);

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

	useEffect(() => {
		const watcher = setInterval(() => {
			const rect =
				handleRef?.current?.parentElement?.getBoundingClientRect();
			if (rect) {
				appState.dropdown_position.value = rect.bottom;
				appState.button_right.value = rect.right;
			}
		}, 100);

		return () => {
			clearInterval(watcher);
		};
	}, [handleRef]);

	return (
		<>
			<style>{`
			:host {
				--dropdownPosition: ${appState.dropdown_position}px;
				--buttonRight: ${appState.button_right}px;
			}
			`}</style>
			<Handle
				id={handleId}
				ref={handleRef}
				onInteraction={handleActivation}
			/>
			<Container
				id={containerId}
				ref={containerRef}
				handleRef={handleRef}
				focusFirstStation={focusFirstStation}
			/>
		</>
	);
}
