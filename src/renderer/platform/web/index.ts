import type { PlatformPorts } from '@platform/ports';
import { webHttpAdapter } from './httpAdapter';
import { webWsAdapter } from './wsAdapter';
import { webStorageAdapter } from './storageAdapter';
import { webFileDialogAdapter } from './fileDialogAdapter';

export const webPorts: PlatformPorts = {
  http: webHttpAdapter,
  ws: webWsAdapter,
  storage: webStorageAdapter,
  fileDialog: webFileDialogAdapter,
};
