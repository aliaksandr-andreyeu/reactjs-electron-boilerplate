export interface UrlValidationResult {
  valid: boolean;
  message?: string;
}

export function validateHttpUrl(url: string): UrlValidationResult {
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, message: 'Enter a request URL' };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, message: 'URL must start with http:// or https://' };
    }
    if (!parsed.host) {
      return { valid: false, message: 'Invalid host in URL' };
    }
    return { valid: true };
  } catch {
    return { valid: false, message: 'Invalid URL' };
  }
}

export function validateWebSocketUrl(url: string): UrlValidationResult {
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, message: 'Enter a WebSocket URL' };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
      return { valid: false, message: 'URL must start with ws:// or wss://' };
    }
    if (!parsed.host) {
      return { valid: false, message: 'Invalid host in URL' };
    }
    return { valid: true };
  } catch {
    return { valid: false, message: 'Invalid URL' };
  }
}
