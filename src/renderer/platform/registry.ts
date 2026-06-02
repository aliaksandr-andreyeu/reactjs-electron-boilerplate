import type { PlatformPorts } from './ports';

let ports: PlatformPorts | null = null;

export function initPlatform(p: PlatformPorts): void {
  ports = p;
}

export function getPlatform(): PlatformPorts {
  if (!ports) {
    throw new Error('Platform not initialized. Call initPlatform() before using platform services.');
  }
  return ports;
}
