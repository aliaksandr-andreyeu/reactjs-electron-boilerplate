import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Web Storage Adapter', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    vi.resetModules();
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns undefined for non-existent key', async () => {
    const { webStorageAdapter } = await import('@platform/web/storageAdapter');
    const result = await webStorageAdapter.get('missing');
    expect(result).toBeUndefined();
  });

  it('stores and retrieves a value', async () => {
    const { webStorageAdapter } = await import('@platform/web/storageAdapter');
    await webStorageAdapter.set('user', { name: 'Alice', age: 30 });
    const result = await webStorageAdapter.get<{ name: string; age: number }>('user');
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('prefixes keys with app:', async () => {
    const { webStorageAdapter } = await import('@platform/web/storageAdapter');
    await webStorageAdapter.set('theme', 'dark');
    expect(store['app:theme']).toBe('"dark"');
  });

  it('handles corrupted JSON gracefully', async () => {
    store['app:broken'] = '{not json';
    const { webStorageAdapter } = await import('@platform/web/storageAdapter');
    const result = await webStorageAdapter.get('broken');
    expect(result).toBeUndefined();
  });
});
