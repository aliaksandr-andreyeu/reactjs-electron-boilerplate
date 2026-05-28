import { contextBridge, ipcRenderer } from 'electron';
import type {
  ElectronAPI,
  FileDialogResult,
  HttpRequestConfig,
  HttpResponse,
  WsEvent,
} from './common/electronApi';

const api: ElectronAPI = {
  ping: () => ipcRenderer.invoke('ping') as Promise<string>,
  openFileDialog: () =>
    ipcRenderer.invoke('open-file-dialog') as Promise<FileDialogResult | null>,
  sendHttpRequest: (config: HttpRequestConfig) =>
    ipcRenderer.invoke('http-request', config) as Promise<HttpResponse>,
  connectWebSocket: (url: string) =>
    ipcRenderer.invoke('ws-connect', url) as Promise<number>,
  sendWsMessage: <T>(id: number, message: T) =>
    ipcRenderer.send('ws-send', { id, message }),
  closeWebSocket: (id: number) => ipcRenderer.send('ws-close', id),
  onWsEvent: <T>(callback: (event: WsEvent<T>) => void) => {
    ipcRenderer.on('ws-event', (_, event) => callback(event as WsEvent<T>));
  },
  removeWsListener: () => {
    ipcRenderer.removeAllListeners('ws-event');
  },
  persistentGet: <T>(key: string) =>
    ipcRenderer.invoke('persistent-get', key) as Promise<T>,
  persistentSet: <T>(key: string, value: T) =>
    ipcRenderer.invoke('persistent-set', key, value) as Promise<boolean>,
};

contextBridge.exposeInMainWorld('electronAPI', api);