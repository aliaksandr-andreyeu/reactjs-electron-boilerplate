import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PlatformPorts } from '@platform/ports';

function createMockPorts() {
  const persistent = new Map<string, unknown>();
  const ports: PlatformPorts = {
    http: {
      request: vi.fn().mockResolvedValue({ status: 200, data: 'ok' }),
    },
    ws: {
      connect: vi.fn().mockResolvedValue(1),
      send: vi.fn(),
      close: vi.fn(),
      onEvent: vi.fn(),
      removeListener: vi.fn(),
    },
    storage: {
      get: vi.fn(async (key: string) => persistent.get(key)),
      set: vi.fn(async (key: string, value: unknown) => {
        persistent.set(key, value);
      }),
    },
    fileDialog: {
      open: vi.fn().mockResolvedValue(null),
    },
  };
  return ports;
}

describe('ApiStore', () => {
  let ports: PlatformPorts;

  beforeEach(async () => {
    vi.resetModules();
    ports = createMockPorts();
    const { initPlatform: init } = await import('@platform/registry');
    init(ports);
    const { useApiStore } = await import('@entities/apiRequest/model/store');
    useApiStore.setState({
      restUrl: '',
      restMethod: 'GET',
      restHeaders: [{ id: 'h1', key: '', value: '' }],
      restBody: '',
      restResponse: null,
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
    });
  });

  it('does not send HTTP when the URL is invalid', async () => {
    const { useApiStore } = await import('@entities/apiRequest/model/store');
    await useApiStore.getState().sendHttp();
    expect(useApiStore.getState().restUrlError).toBeTruthy();
    expect(ports.http.request).not.toHaveBeenCalled();
  });

  it('sets restLoading during HTTP request and clears it after completion', async () => {
    const { useApiStore } = await import('@entities/apiRequest/model/store');
    useApiStore.setState({ restUrl: 'https://example.com/api' });
    const promise = useApiStore.getState().sendHttp();
    expect(useApiStore.getState().restLoading).toBe(true);
    await promise;
    expect(useApiStore.getState().restLoading).toBe(false);
    expect(useApiStore.getState().restResponse?.status).toBe(200);
  });

  it('appends the request to restHistory after a successful HTTP call', async () => {
    const { useApiStore } = await import('@entities/apiRequest/model/store');
    useApiStore.setState({ restUrl: 'https://example.com/users' });
    await useApiStore.getState().sendHttp();
    expect(useApiStore.getState().restHistory).toHaveLength(1);
    expect(useApiStore.getState().restHistory[0]?.url).toBe('https://example.com/users');
  });

  it('does not connect WebSocket when the URL is invalid', async () => {
    const { useApiStore } = await import('@entities/apiRequest/model/store');
    useApiStore.setState({ wsUrl: 'http://wrong' });
    await useApiStore.getState().connectWs();
    expect(useApiStore.getState().wsUrlError).toBeTruthy();
    expect(ports.ws.connect).not.toHaveBeenCalled();
  });

  it('calls connectWebSocket and sets wsConnecting for a valid URL', async () => {
    const { useApiStore } = await import('@entities/apiRequest/model/store');
    useApiStore.setState({ wsUrl: 'wss://echo.example.com' });
    await useApiStore.getState().connectWs();
    expect(ports.ws.connect).toHaveBeenCalledWith('wss://echo.example.com');
    expect(useApiStore.getState().wsConnecting).toBe(true);
  });
});
