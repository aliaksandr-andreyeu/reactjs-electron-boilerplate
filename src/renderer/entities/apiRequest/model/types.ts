export interface HeaderField {
  id: string;
  key: string;
  value: string;
}

export interface RestHistoryEntry {
  id: string;
  url: string;
  method: string;
  headers: HeaderField[];
  body: string;
  usedAt: number;
}

export interface WsHistoryEntry {
  id: string;
  url: string;
  usedAt: number;
}

export interface WsMessage {
  id: string;
  text: string;
  incoming: boolean;
  timestamp: number;
}
