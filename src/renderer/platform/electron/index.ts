import type { PlatformPorts } from '@platform/ports';
import type { HttpRequestConfig, WsEvent, FileDialogResult } from '@common/electronApi';
import { withHttpMetrics } from '@shared/lib/monitoring';

export const electronPorts: PlatformPorts = {
  http: {
    request: (config: HttpRequestConfig) =>
      withHttpMetrics(
        config,
        () => window.electronAPI.sendHttpRequest(config),
        { platform: 'electron' },
      ),
  },
  ws: {
    connect: (url: string) => window.electronAPI.connectWebSocket(url),
    send: <T>(id: number, message: T) => window.electronAPI.sendWsMessage(id, message),
    close: (id: number) => window.electronAPI.closeWebSocket(id),
    onEvent: <T>(callback: (event: WsEvent<T>) => void) => window.electronAPI.onWsEvent(callback),
    removeListener: () => window.electronAPI.removeWsListener(),
  },
  storage: {
    get: <T>(key: string) => window.electronAPI.persistentGet<T>(key) as Promise<T | undefined>,
    set: <T>(key: string, value: T) =>
      window.electronAPI.persistentSet(key, value).then(() => undefined),
  },
  fileDialog: {
    open: (): Promise<FileDialogResult | null> => window.electronAPI.openFileDialog(),
  },
};
