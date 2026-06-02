import type { StoragePort } from '@platform/ports';

const PREFIX = 'app:';

export const webStorageAdapter: StoragePort = {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const raw = localStorage.getItem(`${PREFIX}${key}`);
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
      return undefined;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    } catch {
      // Storage quota exceeded — silently ignore
    }
  },
};
