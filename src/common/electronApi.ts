// src/common/electronApi.ts

export interface FileDialogResult {
  filePath?: string;
  content?: string;
  error?: string;
}

export interface HttpRequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export interface HttpResponse {
  status?: number;
  headers?: Record<string, string>;
  data?: string;
  error?: string;
}

// Generic WebSocket event
export interface WsEvent<T = unknown> {
  type: 'open' | 'message' | 'close' | 'error';
  id: number;
  data?: T;         // present for message events
  code?: number;
  reason?: string;
  error?: string;
}

export interface ElectronAPI {
  ping: () => Promise<string>;
  openFileDialog: () => Promise<FileDialogResult | null>;
  sendHttpRequest: (config: HttpRequestConfig) => Promise<HttpResponse>;
  // WebSocket (generic event payloads)
  connectWebSocket: (url: string) => Promise<number>;
  sendWsMessage: <T = unknown>(id: number, message: T) => void;
  closeWebSocket: (id: number) => void;
  onWsEvent: <T = unknown>(callback: (event: WsEvent<T>) => void) => void;
  removeWsListener: () => void;
  // Persistent
  persistentGet: <T = unknown>(key: string) => Promise<T>;
  persistentSet: <T = unknown>(key: string, value: T) => Promise<boolean>;
}