import { h, Component, Fragment } from 'preact';
import {
	useState,
	useMemo,
	useEffect,
	useCallback,
	useLayoutEffect,
	useRef,
} from 'preact/hooks';
import { memo } from 'preact/compat';
import { useSelector, useDispatch } from 'react-redux';

import throttle from 'lodash/throttle';

import store from 'Store';
import { playerStateActions, playerStateSelect } from 'Store/playerStateSlice';

import MediaPlayer from './MediaPlayer';
import SdkScript from './SdkScript';

import config from 'Config';
import fixSassJson from 'Utils/fixSassJson';
config = fixSassJson(config);

import sdkConfig from './sdk-config.json';

import { stream_status } from 'Consts';

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK');

import { initSDK, player } from './InitSDK';

window._CMLS = window._CMLS || {};

export default memo((props) => {
	const playerState = useSelector(playerStateSelect);
	const dispatch = useDispatch();

	const [previousMount, setPreviousMount] = useState(null);
	const previousMountRef = useRef();
	previousMountRef.current = previousMount;

	const [showMediaPlayer, setShowMediaPlayer] = useState(false);

	const isReady = useMemo(() => !!playerState.ready, [playerState.ready]);
	const isInteractive = useMemo(
		() => isReady && !!playerState.interactive,
		[playerState.ready, playerState.interactive]
	);
	const isPlaying = useMemo(
		() => !!playerState.playing,
		[playerState.playing]
	);

	const playStation = useCallback(() => {
		const { playerState } = store.getState();
		setShowMediaPlayer(false);
		if (!playerState.playing) {
			return;
		}
		log.debug('Play station!', playerState);
		player.play({
			mount: playerState.playing,
			trackingParameters: { player: 'cmls-webplayer' },
		});
		dispatch(playerStateActions['set/interactive'](true));
	}, []);

	const stopStation = useCallback(() => {
		player.skipAd();
		player.stop();
		dispatch(playerStateActions['set/interactive'](true));
	}, []);

	const togglePlay = throttle(
		() => {
			if (!isInteractive) {
				return;
			}
			if (!isPlaying) {
				log.debug('togglePlay stop');
				stopStation();
				return;
			}
			log.debug('togglePlay play');
			player.stop();
			dispatch(playerStateActions['set/interactive'](false));
			setTimeout(() => setShowMediaPlayer(true), 200);
		},
		2000,
		{ leading: true, trailing: false }
	);

	useEffect(() => {
		log.debug('playerState.playing changed', playerState.playing);
		if (!isInteractive) {
			log.debug('Player is not interactive, cancelling');
			return;
		}

		if (
			!playerState.playing &&
			playerState.status !== stream_status.LIVE_STOP
		) {
			log.debug('Stopping play');
			stopStation();
			return;
		}

		if (playerState.playing) {
			dispatch(playerStateActions['set/interactive'](false));
			if (playerState.status !== stream_status.LIVE_STOP) {
				player.stop();
				setTimeout(() => setShowMediaPlayer(true), 200);
			} else {
				setShowMediaPlayer(true);
			}
		}
	}, [playerState.playing]);

	return (
		<>
			{showMediaPlayer && (
				<MediaPlayer
					idPrefix={sdkConfig.mediaplayer_id_prefix}
					player={player}
					show={showMediaPlayer}
					onPlaybackComplete={playStation}
				/>
			)}
			<SdkScript onLoad={initSDK} />
		</>
	);
});
