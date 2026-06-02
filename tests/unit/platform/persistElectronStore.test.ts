import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import { initPlatform } from '@platform/registry';
import type { PlatformPorts } from '@platform/ports';
import { electronPersist } from '@shared/lib/persistElectronStore';

function createMockPorts(store: Map<string, unknown> = new Map()): PlatformPorts {
  return {
    http: { request: vi.fn() },
    ws: { connect: vi.fn(), send: vi.fn(), close: vi.fn(), onEvent: vi.fn(), removeListener: vi.fn() },
    storage: {
      get: vi.fn(async (key: string) => store.get(key)),
      set: vi.fn(async (key: string, value: unknown) => { store.set(key, value); }),
    },
    fileDialog: { open: vi.fn() },
  };
}

interface TestState {
  count: number;
  name: string;
  increment: () => void;
  setName: (name: string) => void;
}

describe('electronPersist middleware', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('persists state changes through storage adapter', async () => {
    const store = new Map<string, unknown>();
    const ports = createMockPorts(store);
    initPlatform(ports);

    const useStore = create<TestState>()(
      electronPersist<TestState>({ key: 'test-store' })((set) => ({
        count: 0,
        name: '',
        increment: () => set((s) => ({ count: s.count + 1 })),
        setName: (name) => set({ name }),
      })),
    );

    useStore.getState().increment();

    await vi.waitFor(() => {
      expect(ports.storage.set).toHaveBeenCalledWith(
        'test-store',
        expect.objectContaining({ count: 1 }),
      );
    });
  });

  it('restores state from storage on creation', async () => {
    const store = new Map<string, unknown>();
    store.set('test-store', { count: 42, name: 'restored' });
    const ports = createMockPorts(store);
    initPlatform(ports);

    const useStore = create<TestState>()(
      electronPersist<TestState>({ key: 'test-store' })((set) => ({
        count: 0,
        name: '',
        increment: () => set((s) => ({ count: s.count + 1 })),
        setName: (name) => set({ name }),
      })),
    );

    await vi.waitFor(() => {
      expect(useStore.getState().count).toBe(42);
      expect(useStore.getState().name).toBe('restored');
    });
  });

  it('partializes state before persisting', async () => {
    const store = new Map<string, unknown>();
    const ports = createMockPorts(store);
    initPlatform(ports);

    const useStore = create<TestState>()(
      electronPersist<TestState>({
        key: 'partial-store',
        partialize: (state) => ({ count: state.count }),
      })((set) => ({
        count: 0,
        name: 'secret',
        increment: () => set((s) => ({ count: s.count + 1 })),
        setName: (name) => set({ name }),
      })),
    );

    useStore.getState().increment();

    await vi.waitFor(() => {
      expect(ports.storage.set).toHaveBeenCalledWith('partial-store', { count: 1 });
    });
  });
});
