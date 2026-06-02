import type { HttpPort } from '@platform/ports';
import type { HttpRequestConfig, HttpResponse } from '@common/electronApi';
import { withHttpMetrics, captureEvent } from '@shared/lib/monitoring';
import type { HttpMetricsMeta } from '@shared/lib/monitoring';

const PROXY_URL = import.meta.env.VITE_CORS_PROXY_URL as string | undefined;

function isCorsError(err: unknown): boolean {
  return err instanceof TypeError;
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'invalid';
  }
}

async function directRequest(config: HttpRequestConfig): Promise<HttpResponse> {
  const res = await fetch(config.url, {
    method: config.method,
    headers: config.headers,
    body: config.body || undefined,
  });

  const headersObj: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  return {
    status: res.status,
    headers: headersObj,
    data: await res.text(),
  };
}

async function proxyRequest(config: HttpRequestConfig): Promise<HttpResponse> {
  if (!PROXY_URL) {
    return {
      error: 'CORS blocked and no proxy configured. Set VITE_CORS_PROXY_URL or use the desktop version.',
    };
  }

  const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(config.url)}`;
  const res = await fetch(proxyUrl, {
    method: config.method,
    headers: {
      ...config.headers,
      'X-Proxy-Target': config.url,
    },
    body: config.body || undefined,
  });

  const headersObj: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  return {
    status: res.status,
    headers: headersObj,
    data: await res.text(),
  };
}

export const webHttpAdapter: HttpPort = {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    const meta: HttpMetricsMeta = { platform: 'web', viaProxy: false };

    return withHttpMetrics(
      config,
      async () => {
        try {
          return await directRequest(config);
        } catch (err) {
          if (isCorsError(err)) {
            captureEvent('cors_fallback_used', { host: safeHost(config.url) });
            meta.viaProxy = true;
            return proxyRequest(config);
          }
          return { error: err instanceof Error ? err.message : 'Request failed' };
        }
      },
      meta,
    );
  },
};
