import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function mockElectronApi() {
  const persistent = new Map<string, unknown>();
  return {
    sendHttpRequest: vi.fn().mockResolvedValue({ status: 200, data: 'ok' }),
    connectWebSocket: vi.fn().mockResolvedValue(1),
    sendWsMessage: vi.fn(),
    closeWebSocket: vi.fn(),
    onWsEvent: vi.fn(),
    removeWsListener: vi.fn(),
    persistentGet: vi.fn(async (key: string) => persistent.get(key)),
    persistentSet: vi.fn(async (key: string, value: unknown) => {
      persistent.set(key, value);
      return true;
    }),
  };
}

describe('ApiStore', () => {
  beforeEach(async () => {
    vi.resetModules();
    (globalThis as Record<string, unknown>).window = {
      electronAPI: mockElectronApi(),
    };
    const { useApiStore } = await import('../../src/renderer/entities/apiRequest/model/store');
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
    });
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window;
    vi.restoreAllMocks();
  });

  it('does not send HTTP when the URL is invalid', async () => {
    const { useApiStore } = await import('../../src/renderer/entities/apiRequest/model/store');
    await useApiStore.getState().sendHttp();
    expect(useApiStore.getState().restUrlError).toBeTruthy();
    expect(window.electronAPI.sendHttpRequest).not.toHaveBeenCalled();
  });

  it('sets restLoading during HTTP request and clears it after completion', async () => {
    const { useApiStore } = await import('../../src/renderer/entities/apiRequest/model/store');
    useApiStore.setState({ restUrl: 'https://example.com/api' });
    const promise = useApiStore.getState().sendHttp();
    expect(useApiStore.getState().restLoading).toBe(true);
    await promise;
    expect(useApiStore.getState().restLoading).toBe(false);
    expect(useApiStore.getState().restResponse?.status).toBe(200);
  });

  it('appends the request to restHistory after a successful HTTP call', async () => {
    const { useApiStore } = await import('../../src/renderer/entities/apiRequest/model/store');
    useApiStore.setState({ restUrl: 'https://example.com/users' });
    await useApiStore.getState().sendHttp();
    expect(useApiStore.getState().restHistory).toHaveLength(1);
    expect(useApiStore.getState().restHistory[0]?.url).toBe('https://example.com/users');
  });

  it('does not connect WebSocket when the URL is invalid', async () => {
    const { useApiStore } = await import('../../src/renderer/entities/apiRequest/model/store');
    useApiStore.setState({ wsUrl: 'http://wrong' });
    await useApiStore.getState().connectWs();
    expect(useApiStore.getState().wsUrlError).toBeTruthy();
    expect(window.electronAPI.connectWebSocket).not.toHaveBeenCalled();
  });

  it('calls connectWebSocket and sets wsConnecting for a valid URL', async () => {
    const { useApiStore } = await import('../../src/renderer/entities/apiRequest/model/store');
    useApiStore.setState({ wsUrl: 'wss://echo.example.com' });
    await useApiStore.getState().connectWs();
    expect(window.electronAPI.connectWebSocket).toHaveBeenCalledWith('wss://echo.example.com');
    expect(useApiStore.getState().wsConnecting).toBe(true);
  });
});
