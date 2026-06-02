import { create } from 'zustand';
import type { HttpRequestConfig, HttpResponse, WsEvent } from '@common/electronApi';
import { getPlatform } from '@platform/registry';
import { electronPersist } from '@shared/lib/persistElectronStore';
import { createId } from '@shared/lib/id';
import { validateHttpUrl, validateWebSocketUrl } from '@shared/lib/validateUrl';
import { captureEvent } from '@shared/lib/monitoring';
import type { HeaderField, RestHistoryEntry, WsHistoryEntry, WsMessage } from './types';
import {
  applySubscriptionControl,
  normalizeWsChannel,
  parseIncomingSubscriptionChannels,
  parseOutgoingSubscriptionControl,
} from '../lib/wsSubscriptions';

const MAX_HISTORY = 20;

function createHeader(): HeaderField {
  return { id: createId('hdr'), key: '', value: '' };
}

function cloneHeaders(headers: HeaderField[]): HeaderField[] {
  return headers.map((h) => ({ ...h, id: createId('hdr') }));
}

function pushRestHistory(
  history: RestHistoryEntry[],
  entry: Omit<RestHistoryEntry, 'id' | 'usedAt'>,
): RestHistoryEntry[] {
  const next: RestHistoryEntry = {
    ...entry,
    id: createId('rest'),
    usedAt: Date.now(),
    headers: cloneHeaders(entry.headers),
  };
  const filtered = history.filter((h) => h.url !== entry.url || h.method !== entry.method);
  return [next, ...filtered].slice(0, MAX_HISTORY);
}

function pushWsHistory(history: WsHistoryEntry[], url: string): WsHistoryEntry[] {
  const next: WsHistoryEntry = { id: createId('ws'), url, usedAt: Date.now() };
  const filtered = history.filter((h) => h.url !== url);
  return [next, ...filtered].slice(0, MAX_HISTORY);
}

export interface RestResponseMeta {
  durationMs: number;
  bodySize: number;
}

function bodyByteSize(text: string | undefined): number {
  if (!text) return 0;
  return new TextEncoder().encode(text).length;
}

function findAuthorizationIndex(headers: HeaderField[]): number {
  return headers.findIndex((h) => h.key.toLowerCase() === 'authorization');
}

function createWsMessage(text: string, incoming: boolean): WsMessage {
  return {
    id: createId('msg'),
    text,
    incoming,
    timestamp: Date.now(),
  };
}

interface ApiRequestState {
  restUrl: string;
  restMethod: string;
  restHeaders: HeaderField[];
  restBody: string;
  restResponse: HttpResponse | null;
  restResponseMeta: RestResponseMeta | null;
  restLoading: boolean;
  restUrlError: string | null;
  restHistory: RestHistoryEntry[];

  wsUrl: string;
  wsConnected: boolean;
  wsConnecting: boolean;
  wsId: number | null;
  wsMessages: WsMessage[];
  wsError: string | null;
  wsUrlError: string | null;
  wsHistory: WsHistoryEntry[];
  wsSubscriptions: string[];

  setRestUrl: (url: string) => void;
  setRestMethod: (method: string) => void;
  setRestBody: (body: string) => void;
  setWsUrl: (url: string) => void;
  addHeader: () => void;
  removeHeader: (id: string) => void;
  updateHeader: (id: string, key: string, value: string) => void;
  setBearerToken: (token: string) => void;
  sendHttp: () => Promise<void>;
  connectWs: () => Promise<void>;
  sendWs: (message: string) => void;
  subscribeWs: (channel: string) => void;
  unsubscribeWs: (channel: string) => void;
  disconnectWs: () => void;
  clearWsMessages: () => void;
  loadRestHistoryEntry: (id: string) => void;
  loadWsHistoryEntry: (id: string) => void;
}

export const useApiStore = create<ApiRequestState>()(
  electronPersist<ApiRequestState>({
    key: 'api-request',
    partialize: (state) => ({
      restHistory: state.restHistory,
      wsHistory: state.wsHistory,
    }),
  })((set, get) => ({
    restUrl: '',
    restMethod: 'GET',
    restHeaders: [createHeader()],
    restBody: '',
    restResponse: null,
    restResponseMeta: null,
    restLoading: false,
    restUrlError: null,
    restHistory: [],

    wsUrl: '',
    wsConnected: false,
    wsConnecting: false,
    wsId: null,
    wsMessages: [],
    wsError: null,
    wsUrlError: null,
    wsHistory: [],
    wsSubscriptions: [],

    setRestUrl: (url) => set({ restUrl: url, restUrlError: null }),
    setRestMethod: (method) => set({ restMethod: method }),
    setRestBody: (body) => set({ restBody: body }),
    setWsUrl: (url) => set({ wsUrl: url, wsUrlError: null, wsError: null }),

    addHeader: () =>
      set((state) => ({
        restHeaders: [...state.restHeaders, createHeader()],
      })),

    removeHeader: (id) =>
      set((state) => ({
        restHeaders: state.restHeaders.filter((h) => h.id !== id),
      })),

    updateHeader: (id, key, value) =>
      set((state) => ({
        restHeaders: state.restHeaders.map((h) =>
          h.id === id ? { ...h, key, value } : h,
        ),
      })),

    setBearerToken: (token) =>
      set((state) => {
        const trimmed = token.trim();
        const authIndex = findAuthorizationIndex(state.restHeaders);
        const authHeader = authIndex >= 0 ? state.restHeaders[authIndex] : undefined;

        if (!trimmed) {
          if (!authHeader) return state;
          return {
            restHeaders: state.restHeaders.filter((h) => h.id !== authHeader.id),
          };
        }

        const value = `Bearer ${trimmed}`;
        if (authHeader) {
          return {
            restHeaders: state.restHeaders.map((h) =>
              h.id === authHeader.id ? { ...h, key: 'Authorization', value } : h,
            ),
          };
        }

        return {
          restHeaders: [
            ...state.restHeaders,
            { id: createId('hdr'), key: 'Authorization', value },
          ],
        };
      }),

    sendHttp: async () => {
      const { restUrl, restMethod, restHeaders, restBody } = get();
      const validation = validateHttpUrl(restUrl);
      if (!validation.valid) {
        set({ restUrlError: validation.message ?? 'Invalid URL' });
        return;
      }

      set({ restLoading: true, restUrlError: null, restResponseMeta: null });
      const headersObj: Record<string, string> = Object.fromEntries(
        restHeaders.filter((h) => h.key).map((h) => [h.key, h.value]),
      );
      const config: HttpRequestConfig = {
        url: restUrl.trim(),
        method: restMethod,
        headers: headersObj,
        body: restBody || undefined,
      };

      const start = performance.now();
      try {
        const { http } = getPlatform();
        const result = await http.request(config);
        const durationMs = Math.round(performance.now() - start);
        const bodyText = result.error ?? result.data ?? '';
        set((state) => ({
          restResponse: result,
          restResponseMeta: { durationMs, bodySize: bodyByteSize(bodyText) },
          restLoading: false,
          restHistory: pushRestHistory(state.restHistory, {
            url: restUrl.trim(),
            method: restMethod,
            headers: state.restHeaders,
            body: restBody,
          }),
        }));
      } catch {
        const durationMs = Math.round(performance.now() - start);
        set({
          restLoading: false,
          restResponse: { error: 'Failed to send request' },
          restResponseMeta: { durationMs, bodySize: bodyByteSize('Failed to send request') },
        });
      }
    },

    connectWs: async () => {
      const { wsUrl } = get();
      const validation = validateWebSocketUrl(wsUrl);
      if (!validation.valid) {
        set({ wsUrlError: validation.message ?? 'Invalid URL' });
        return;
      }

      set({
        wsConnecting: true,
        wsUrlError: null,
        wsError: null,
        wsConnected: false,
        wsMessages: [],
      });

      try {
        const { ws } = getPlatform();
        const id = await ws.connect(wsUrl.trim());
        set({ wsId: id });

        ws.onEvent<string>((event: WsEvent) => {
          if (event.id !== id) return;

          if (event.type === 'open') {
            captureEvent('ws_connected');
            set((state) => ({
              wsConnected: true,
              wsConnecting: false,
              wsHistory: pushWsHistory(state.wsHistory, wsUrl.trim()),
            }));
            const { wsId, wsSubscriptions } = get();
            if (wsId !== null && wsSubscriptions.length > 0) {
              wsSubscriptions.forEach((channel) => {
                ws.send(wsId, { type: 'subscribe', channel });
              });
            }
          } else if (event.type === 'message' && event.data !== undefined) {
            const text = String(event.data);
            const syncedChannels = parseIncomingSubscriptionChannels(text);
            set((state) => ({
              wsMessages: [...state.wsMessages, createWsMessage(text, true)],
              ...(syncedChannels !== null ? { wsSubscriptions: syncedChannels } : {}),
            }));
          } else if (event.type === 'error') {
            set({
              wsConnected: false,
              wsConnecting: false,
              wsId: null,
              wsError: event.error ?? 'WebSocket error',
            });
            ws.removeListener();
          } else if (event.type === 'close') {
            captureEvent('ws_disconnected', { reason: event.reason ?? '' });
            set({
              wsConnected: false,
              wsConnecting: false,
              wsId: null,
              wsError: event.reason
                ? `Connection closed: ${event.reason}`
                : null,
            });
            ws.removeListener();
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to connect';
        set({
          wsConnecting: false,
          wsConnected: false,
          wsId: null,
          wsError: message,
        });
      }
    },

    sendWs: (message) => {
      const { wsId } = get();
      if (wsId === null) return;
      const { ws } = getPlatform();
      ws.send(wsId, message);
      const control = parseOutgoingSubscriptionControl(message);
      set((state) => ({
        wsSubscriptions: control
          ? applySubscriptionControl(state.wsSubscriptions, control)
          : state.wsSubscriptions,
        wsMessages: [...state.wsMessages, createWsMessage(message, false)],
      }));
    },

    subscribeWs: (channel) => {
      const normalized = normalizeWsChannel(channel);
      if (!normalized) return;
      const { wsId } = get();
      if (wsId === null) return;

      const { ws } = getPlatform();
      ws.send(wsId, { type: 'subscribe', channel: normalized });
      set((state) => ({
        wsSubscriptions: applySubscriptionControl(state.wsSubscriptions, {
          type: 'subscribe',
          channel: normalized,
        }),
        wsMessages: [
          ...state.wsMessages,
          createWsMessage(JSON.stringify({ type: 'subscribe', channel: normalized }), false),
        ],
      }));
    },

    unsubscribeWs: (channel) => {
      const normalized = normalizeWsChannel(channel);
      if (!normalized) return;
      const { wsId } = get();
      if (wsId === null) return;

      const { ws } = getPlatform();
      ws.send(wsId, { type: 'unsubscribe', channel: normalized });
      set((state) => ({
        wsSubscriptions: applySubscriptionControl(state.wsSubscriptions, {
          type: 'unsubscribe',
          channel: normalized,
        }),
        wsMessages: [
          ...state.wsMessages,
          createWsMessage(JSON.stringify({ type: 'unsubscribe', channel: normalized }), false),
        ],
      }));
    },

    disconnectWs: () => {
      const { wsId } = get();
      if (wsId !== null) {
        const { ws } = getPlatform();
        ws.close(wsId);
        ws.removeListener();
      }
      set({ wsConnected: false, wsConnecting: false, wsId: null });
    },

    clearWsMessages: () => set({ wsMessages: [] }),

    loadRestHistoryEntry: (entryId) => {
      const entry = get().restHistory.find((h) => h.id === entryId);
      if (!entry) return;
      set({
        restUrl: entry.url,
        restMethod: entry.method,
        restHeaders: cloneHeaders(entry.headers),
        restBody: entry.body,
        restUrlError: null,
        restResponse: null,
      });
    },

    loadWsHistoryEntry: (entryId) => {
      const entry = get().wsHistory.find((h) => h.id === entryId);
      if (!entry) return;
      set({ wsUrl: entry.url, wsUrlError: null, wsError: null });
    },
  })),
);
