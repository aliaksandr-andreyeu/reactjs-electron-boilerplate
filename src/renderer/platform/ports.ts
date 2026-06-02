import type { HttpRequestConfig, HttpResponse, WsEvent, FileDialogResult } from '@common/electronApi';

export interface HttpPort {
  request(config: HttpRequestConfig): Promise<HttpResponse>;
}

export interface WebSocketPort {
  connect(url: string): Promise<number>;
  send<T = unknown>(id: number, message: T): void;
  close(id: number): void;
  onEvent<T = unknown>(callback: (event: WsEvent<T>) => void): void;
  removeListener(): void;
}

export interface StoragePort {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set<T = unknown>(key: string, value: T): Promise<void>;
}

export interface FileDialogPort {
  open(): Promise<FileDialogResult | null>;
}

export interface PlatformPorts {
  http: HttpPort;
  ws: WebSocketPort;
  storage: StoragePort;
  fileDialog: FileDialogPort;
}
