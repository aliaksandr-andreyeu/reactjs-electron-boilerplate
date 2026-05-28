import { describe, it, expect } from 'vitest';
import { validateHttpUrl, validateWebSocketUrl } from '../../src/renderer/shared/lib/validateUrl';

describe('validateHttpUrl', () => {
  it('rejects an empty URL', () => {
    expect(validateHttpUrl('').valid).toBe(false);
  });

  it('accepts a valid https URL', () => {
    expect(validateHttpUrl('https://api.example.com/users').valid).toBe(true);
  });

  it('rejects ws:// protocol', () => {
    const result = validateHttpUrl('ws://localhost:8080');
    expect(result.valid).toBe(false);
  });

  it('rejects a malformed string', () => {
    expect(validateHttpUrl('not-a-url').valid).toBe(false);
  });
});

describe('validateWebSocketUrl', () => {
  it('rejects an empty URL', () => {
    expect(validateWebSocketUrl('  ').valid).toBe(false);
  });

  it('accepts a valid wss URL', () => {
    expect(validateWebSocketUrl('wss://echo.example.com').valid).toBe(true);
  });

  it('rejects https:// protocol', () => {
    const result = validateWebSocketUrl('https://example.com');
    expect(result.valid).toBe(false);
  });
});
