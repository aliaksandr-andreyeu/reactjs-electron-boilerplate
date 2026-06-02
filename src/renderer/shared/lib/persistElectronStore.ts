import type { StateCreator } from 'zustand';
import { getPlatform } from '@platform/registry';

export interface ElectronPersistConfig<T extends object> {
  key: string;
  partialize?: (state: T) => unknown;
}

export function electronPersist<T extends object>(
  config: ElectronPersistConfig<T>,
): (creator: StateCreator<T, [], []>) => StateCreator<T, [], []> {
  return (create) => (set, get, api) => {
    const originalSet = set;

    const wrappedSet: typeof originalSet = (partial, replace) => {
      (originalSet as (p: unknown, r?: boolean) => void)(partial, replace);
      const { storage } = getPlatform();
      const state = get();
      const toPersist = config.partialize ? config.partialize(state) : state;
      void storage.set(config.key, toPersist);
    };

    const { storage } = getPlatform();
    void storage.get<Partial<T>>(config.key).then(
      (saved: Partial<T> | undefined) => {
        if (saved) {
          api.setState(saved);
          const state = get();
          const toPersist = config.partialize ? config.partialize(state) : state;
          void storage.set(config.key, toPersist);
        }
      },
    );

    return create(wrappedSet, get, api);
  };
}
