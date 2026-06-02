import { initPlatform } from '@platform/registry';
import { electronPorts } from '@platform/electron';

initPlatform(electronPorts);

import('./bootstrap').then((m) => m.default({ platform: 'electron' }));
