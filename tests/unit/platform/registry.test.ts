import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PlatformPorts } from '@platform/ports';

function createMockPorts(): PlatformPorts {
  return {
    http: { request: vi.fn() },
    ws: { connect: vi.fn(), send: vi.fn(), close: vi.fn(), onEvent: vi.fn(), removeListener: vi.fn() },
    storage: { get: vi.fn(), set: vi.fn() },
    fileDialog: { open: vi.fn() },
  };
}

describe('Platform Registry', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('throws if getPlatform is called before initPlatform', async () => {
    const { getPlatform } = await import('@platform/registry');
    expect(() => getPlatform()).toThrow('Platform not initialized');
  });

  it('returns ports after initPlatform is called', async () => {
    const { initPlatform, getPlatform } = await import('@platform/registry');
    const ports = createMockPorts();
    initPlatform(ports);
    expect(getPlatform()).toBe(ports);
  });

  it('allows re-initialization (useful for tests)', async () => {
    const { initPlatform, getPlatform } = await import('@platform/registry');
    const ports1 = createMockPorts();
    const ports2 = createMockPorts();
    initPlatform(ports1);
    expect(getPlatform()).toBe(ports1);
    initPlatform(ports2);
    expect(getPlatform()).toBe(ports2);
  });
});
