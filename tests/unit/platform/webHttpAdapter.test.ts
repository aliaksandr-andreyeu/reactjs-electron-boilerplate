import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const fetchMock = vi.fn();

describe('Web HTTP Adapter', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('makes a direct fetch request and returns response', async () => {
    const headers = new Map([['content-type', 'application/json']]);
    fetchMock.mockResolvedValue({
      status: 200,
      headers: { forEach: (cb: (v: string, k: string) => void) => headers.forEach((v, k) => cb(v, k)) },
      text: () => Promise.resolve('{"ok":true}'),
    });

    const { webHttpAdapter } = await import('@platform/web/httpAdapter');
    const result = await webHttpAdapter.request({
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: {},
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/data', {
      method: 'GET',
      headers: {},
      body: undefined,
    });
    expect(result.status).toBe(200);
    expect(result.data).toBe('{"ok":true}');
  });

  it('falls back to proxy on CORS error (TypeError)', async () => {
    vi.stubGlobal('import', { meta: { env: { VITE_CORS_PROXY_URL: undefined } } });

    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const { webHttpAdapter } = await import('@platform/web/httpAdapter');
    const result = await webHttpAdapter.request({
      url: 'https://cors-blocked.api/data',
      method: 'GET',
      headers: {},
    });

    expect(result.error).toContain('CORS');
  });

  it('returns error message for non-TypeError failures', async () => {
    fetchMock.mockRejectedValue(new Error('Network timeout'));

    const { webHttpAdapter } = await import('@platform/web/httpAdapter');
    const result = await webHttpAdapter.request({
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: {},
    });

    expect(result.error).toBe('Network timeout');
  });
});
