import type { WebSocketPort } from '@platform/ports';
import type { WsEvent } from '@common/electronApi';

let nextId = 1;
const sockets = new Map<number, WebSocket>();
let eventCallback: ((event: WsEvent) => void) | null = null;

export const webWsAdapter: WebSocketPort = {
  connect(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(url);
        const id = nextId++;
        sockets.set(id, ws);

        ws.onopen = () => {
          eventCallback?.({ type: 'open', id });
          resolve(id);
        };

        ws.onmessage = (e) => {
          eventCallback?.({ type: 'message', id, data: String(e.data) });
        };

        ws.onclose = (e) => {
          eventCallback?.({ type: 'close', id, code: e.code, reason: e.reason });
          sockets.delete(id);
        };

        ws.onerror = () => {
          eventCallback?.({ type: 'error', id, error: 'WebSocket error' });
          sockets.delete(id);
          reject(new Error('WebSocket connection failed'));
        };
      } catch (err) {
        reject(err);
      }
    });
  },

  send<T>(id: number, message: T): void {
    const ws = sockets.get(id);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(typeof message === 'string' ? message : JSON.stringify(message));
  },

  close(id: number): void {
    const ws = sockets.get(id);
    if (ws) {
      ws.close();
      sockets.delete(id);
    }
  },

  onEvent<T>(callback: (event: WsEvent<T>) => void): void {
    eventCallback = callback as (event: WsEvent) => void;
  },

  removeListener(): void {
    eventCallback = null;
  },
};
