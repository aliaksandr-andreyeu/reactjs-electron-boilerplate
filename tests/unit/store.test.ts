import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useFileStore } from '../../src/renderer/entities/file/model/store';
import type { FileDialogResult } from '../../src/common/electronApi';

declare global {
  interface Window {
    electronAPI: {
      openFileDialog: ReturnType<typeof vi.fn>;
    };
  }
}

describe('FileStore', () => {
  beforeEach(() => {
    useFileStore.setState({
      fileContent: null,
      filePath: null,
      loading: false,
      error: null,
    });

    (globalThis as Record<string, unknown>).window = {
      electronAPI: {
        openFileDialog: vi.fn(),
      },
    };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window;
  });

  it('sets loading to true while openFile is in progress', async () => {
    const mockFn = window.electronAPI.openFileDialog as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue(null);

    const { openFile } = useFileStore.getState();
    const promise = openFile();
    expect(useFileStore.getState().loading).toBe(true);
    await promise;
    expect(useFileStore.getState().loading).toBe(false);
  });

  it('stores file path and content after a successful open', async () => {
    const mockResult: FileDialogResult = {
      filePath: '/test/file.txt',
      content: 'Hello from file',
    };
    const mockFn = window.electronAPI.openFileDialog as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue(mockResult);

    await useFileStore.getState().openFile();

    const state = useFileStore.getState();
    expect(state.filePath).toBe('/test/file.txt');
    expect(state.fileContent).toBe('Hello from file');
    expect(state.error).toBeNull();
  });

  it('sets error and clears content when IPC returns an error', async () => {
    const mockResult: FileDialogResult = { error: 'Read error' };
    const mockFn = window.electronAPI.openFileDialog as ReturnType<typeof vi.fn>;
    mockFn.mockResolvedValue(mockResult);

    await useFileStore.getState().openFile();

    expect(useFileStore.getState().error).toBe('Read error');
    expect(useFileStore.getState().fileContent).toBeNull();
  });
});
