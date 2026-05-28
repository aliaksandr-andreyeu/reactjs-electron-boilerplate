import { create } from 'zustand';
import type { FileDialogResult } from '../../../../common/electronApi';

interface FileState {
  fileContent: string | null;
  filePath: string | null;
  loading: boolean;
  error: string | null;
  openFile: () => Promise<void>;
}

export const useFileStore = create<FileState>((set) => ({
  fileContent: null,
  filePath: null,
  loading: false,
  error: null,
  openFile: async () => {
    set({ loading: true, error: null });
    try {
      const result: FileDialogResult | null = await window.electronAPI.openFileDialog();
      if (!result) {
        set({ loading: false });
        return;
      }
      if (result.error) {
        set({ error: result.error, loading: false });
      } else {
        set({
          filePath: result.filePath ?? null,
          fileContent: result.content ?? null,
          loading: false,
        });
      }
    } catch {
      set({ error: 'Failed to communicate with the main process', loading: false });
    }
  },
}));