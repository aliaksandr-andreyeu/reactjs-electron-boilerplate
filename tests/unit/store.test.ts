import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initPlatform } from '@platform/registry';
import type { PlatformPorts } from '@platform/ports';
import { useFileStore } from '@entities/file/model/store';
import type { FileDialogResult } from '@common/electronApi';

function createMockPorts(openFileDialog: () => Promise<FileDialogResult | null>): PlatformPorts {
  return {
    http: { request: vi.fn() },
    ws: {
      connect: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
      onEvent: vi.fn(),
      removeListener: vi.fn(),
    },
    storage: {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
    },
    fileDialog: { open: openFileDialog },
  };
}

describe('FileStore', () => {
  beforeEach(() => {
    useFileStore.setState({
      fileContent: null,
      filePath: null,
      loading: false,
      error: null,
    });
  });

  it('sets loading to true while openFile is in progress', async () => {
    const openMock = vi.fn().mockResolvedValue(null);
    initPlatform(createMockPorts(openMock));

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
    const openMock = vi.fn().mockResolvedValue(mockResult);
    initPlatform(createMockPorts(openMock));

    await useFileStore.getState().openFile();

    const state = useFileStore.getState();
    expect(state.filePath).toBe('/test/file.txt');
    expect(state.fileContent).toBe('Hello from file');
    expect(state.error).toBeNull();
  });

  it('sets error and clears content when IPC returns an error', async () => {
    const mockResult: FileDialogResult = { error: 'Read error' };
    const openMock = vi.fn().mockResolvedValue(mockResult);
    initPlatform(createMockPorts(openMock));

    await useFileStore.getState().openFile();

    expect(useFileStore.getState().error).toBe('Read error');
    expect(useFileStore.getState().fileContent).toBeNull();
  });
});
