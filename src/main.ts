import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import Store from 'electron-store';
import * as Sentry from '@sentry/electron/main';
import type { FileDialogResult, HttpRequestConfig, HttpResponse } from './common/electronApi';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const isE2E = process.env.E2E_TEST === 'true';
const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn && !isE2E) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV ?? 'production',
    tracesSampleRate: 0.1,
  });
}

let mainWindow: BrowserWindow | null = null;
let memoryInterval: ReturnType<typeof setInterval> | null = null;

function reportMemoryUsage(): void {
  if (!sentryDsn || isE2E) return;
  const mem = process.memoryUsage();
  Sentry.setContext('memory', {
    rss_mb: Math.round(mem.rss / 1024 / 1024),
    heapUsed_mb: Math.round(mem.heapUsed / 1024 / 1024),
  });
}

function startMemoryReporting(): void {
  if (memoryInterval) return;
  memoryInterval = setInterval(reportMemoryUsage, 60_000);
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.webContents.once('did-finish-load', () => {
    if (sentryDsn && !isE2E) {
      Sentry.startSpan({ name: 'window.load', op: 'ui.load' }, () => undefined);
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

const persistentStore = new Store({
  name: 'app-persistent-state',
  encryptionKey: 'mySecret',
  defaults: {
    restHistory: [],
    wsHistory: [],
    apiCollections: [],
  },
});

function registerIpcHandlers(): void {
  ipcMain.handle('ping', () => 'pong');

  if (isE2E) {
    ipcMain.handle('open-file-dialog', async (): Promise<FileDialogResult> => ({
      filePath: 'test.txt',
      content: 'Hello E2E',
    }));
  } else {
    ipcMain.handle('open-file-dialog', async (): Promise<FileDialogResult | null> => {
      if (!mainWindow) return null;
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const filePath = result.filePaths[0];
      if (!filePath) return null;

      try {
        const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
        return { filePath, content };
      } catch {
        return { error: 'Failed to read file' };
      }
    });
  }

  if (isE2E) {
    ipcMain.handle('http-request', async (_, config: HttpRequestConfig): Promise<HttpResponse> => ({
      status: 200,
      data: JSON.stringify({ method: config.method, url: config.url, ok: true }),
      headers: { 'content-type': 'application/json' },
    }));
  } else {
    ipcMain.handle('http-request', async (_, config: HttpRequestConfig): Promise<HttpResponse> => {
      const handler = async (): Promise<HttpResponse> => {
        try {
          const response = await fetch(config.url, {
            method: config.method,
            headers: config.headers,
            body: config.body || undefined,
          });
          const data = await response.text();
          return {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            data,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          return { error: message };
        }
      };

      if (sentryDsn) {
        return Sentry.startSpan({ name: 'ipc.http-request', op: 'ipc' }, handler);
      }
      return handler();
    });
  }

  const wsConnections = new Map<number, WebSocket>();

  ipcMain.handle('ws-connect', (event, url: string): number => {
    const ws = new WebSocket(url);
    const id = Date.now();

    ws.onopen = () => {
      event.sender.send('ws-event', { type: 'open', id });
    };
    ws.onmessage = (e) => {
      event.sender.send('ws-event', { type: 'message', id, data: e.data });
    };
    ws.onclose = (e) => {
      event.sender.send('ws-event', { type: 'close', id, code: e.code, reason: e.reason });
      wsConnections.delete(id);
    };
    ws.onerror = () => {
      event.sender.send('ws-event', { type: 'error', id, error: 'WebSocket error' });
    };

    wsConnections.set(id, ws);
    return id;
  });

  ipcMain.on('ws-send', (_, { id, message }: { id: number; message: unknown }) => {
    const ws = wsConnections.get(id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (typeof message === 'string') {
        ws.send(message);
      } else {
        ws.send(JSON.stringify(message));
      }
    }
  });

  ipcMain.on('ws-close', (_, id: number) => {
    const ws = wsConnections.get(id);
    if (ws) {
      ws.close();
      wsConnections.delete(id);
    }
  });

  ipcMain.handle('persistent-get', (_, key: string) => persistentStore.get(key));

  ipcMain.handle('persistent-set', (_, key: string, value: unknown) => {
    persistentStore.set(key, value);
    return true;
  });
}

app.whenReady().then(() => {
  const startup = () => {
    registerIpcHandlers();
    createWindow();
    startMemoryReporting();
  };

  if (sentryDsn && !isE2E) {
    Sentry.startSpan({ name: 'app.startup', op: 'app.lifecycle' }, startup);
  } else {
    startup();
  }
});

app.on('window-all-closed', () => {
  if (memoryInterval) {
    clearInterval(memoryInterval);
    memoryInterval = null;
  }
  if (process.platform !== 'darwin') app.quit();
});
