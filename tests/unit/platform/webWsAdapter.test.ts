import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let wsInstances: MockWebSocket[] = [];

class MockWebSocket {
  url: string;
  readyState = 0; // CONNECTING
  onopen: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: ((ev: { code: number; reason: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  sent: unknown[] = [];

  static OPEN = 1;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    wsInstances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
  }

  simulateOpen() {
    this.readyState = 1;
    this.onopen?.({});
  }

  simulateMessage(data: string) {
    this.onmessage?.({ data });
  }

  simulateClose(code = 1000, reason = '') {
    this.readyState = 3;
    this.onclose?.({ code, reason });
  }

  simulateError() {
    this.onerror?.();
  }
}

describe('Web WebSocket Adapter', () => {
  beforeEach(() => {
    vi.resetModules();
    wsInstances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('connects and resolves with an id on open', async () => {
    const { webWsAdapter } = await import('@platform/web/wsAdapter');

    const connectPromise = webWsAdapter.connect('wss://echo.test');

    expect(wsInstances).toHaveLength(1);
    expect(wsInstances[0].url).toBe('wss://echo.test');

    wsInstances[0].simulateOpen();
    const id = await connectPromise;
    expect(typeof id).toBe('number');
  });

  it('emits events through onEvent callback', async () => {
    const { webWsAdapter } = await import('@platform/web/wsAdapter');
    const events: unknown[] = [];
    webWsAdapter.onEvent((ev) => events.push(ev));

    const connectPromise = webWsAdapter.connect('wss://echo.test');
    wsInstances[0].simulateOpen();
    const id = await connectPromise;

    wsInstances[0].simulateMessage('hello');

    expect(events).toHaveLength(2); // open + message
    expect(events[0]).toMatchObject({ type: 'open', id });
    expect(events[1]).toMatchObject({ type: 'message', id, data: 'hello' });
  });

  it('sends messages as JSON for objects', async () => {
    const { webWsAdapter } = await import('@platform/web/wsAdapter');

    const connectPromise = webWsAdapter.connect('wss://echo.test');
    wsInstances[0].simulateOpen();
    const id = await connectPromise;

    webWsAdapter.send(id, { type: 'subscribe', channel: 'orders' });
    expect(wsInstances[0].sent[0]).toBe('{"type":"subscribe","channel":"orders"}');
  });

  it('sends string messages as-is', async () => {
    const { webWsAdapter } = await import('@platform/web/wsAdapter');

    const connectPromise = webWsAdapter.connect('wss://echo.test');
    wsInstances[0].simulateOpen();
    const id = await connectPromise;

    webWsAdapter.send(id, 'plain text');
    expect(wsInstances[0].sent[0]).toBe('plain text');
  });

  it('closes the WebSocket connection', async () => {
    const { webWsAdapter } = await import('@platform/web/wsAdapter');

    const connectPromise = webWsAdapter.connect('wss://echo.test');
    wsInstances[0].simulateOpen();
    const id = await connectPromise;

    webWsAdapter.close(id);
    expect(wsInstances[0].readyState).toBe(3);
  });

  it('rejects on connection error', async () => {
    const { webWsAdapter } = await import('@platform/web/wsAdapter');

    const connectPromise = webWsAdapter.connect('wss://fail.test');
    wsInstances[0].simulateError();

    await expect(connectPromise).rejects.toThrow('WebSocket connection failed');
  });
});
