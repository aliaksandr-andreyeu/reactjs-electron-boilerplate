import { initPlatform } from '@platform/registry';
import { webPorts } from '@platform/web';

initPlatform(webPorts);

import('./bootstrap').then((m) => m.default({ platform: 'web' }));
