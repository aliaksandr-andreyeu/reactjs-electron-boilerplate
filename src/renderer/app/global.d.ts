export {};

import type { ElectronAPI } from '../common/electronApi';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}