import { useCallback } from 'preact/hooks';

import store from 'Store';
import { playerStateActions } from 'Store/playerStateSlice';

import config from 'Config';
import fixSassJson from 'Utils/fixSassJson';
config = fixSassJson(config);

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / SetCuePoint');

export default () => {};
