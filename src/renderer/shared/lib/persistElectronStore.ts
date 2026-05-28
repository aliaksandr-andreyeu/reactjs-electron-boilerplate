import type { StateCreator } from 'zustand';

export interface ElectronPersistConfig<T extends object> {
  key: string;
  partialize?: (state: T) => unknown;
}

function hasElectronApi(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

export function electronPersist<T extends object>(
  config: ElectronPersistConfig<T>,
): (creator: StateCreator<T, [], []>) => StateCreator<T, [], []> {
  return (create) => (set, get, api) => {
    const originalSet = set;

    const wrappedSet: typeof originalSet = (partial, replace) => {
      (originalSet as (p: unknown, r?: boolean) => void)(partial, replace);
      if (!hasElectronApi()) return;
      const state = get();
      const toPersist = config.partialize ? config.partialize(state) : state;
      void window.electronAPI.persistentSet(config.key, toPersist);
    };

    if (hasElectronApi()) {
      void window.electronAPI.persistentGet<Partial<T>>(config.key).then(
        (saved: Partial<T> | undefined) => {
          if (saved) {
            // Merge partial persisted slice; replace:true would wipe actions and defaults
            api.setState(saved);
            const state = get();
            const toPersist = config.partialize ? config.partialize(state) : state;
            void window.electronAPI.persistentSet(config.key, toPersist);
          }
        },
      );
    }

    return create(wrappedSet, get, api);
  };
}
