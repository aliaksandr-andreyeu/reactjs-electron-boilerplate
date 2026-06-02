import type { HttpRequestConfig, HttpResponse } from '@common/electronApi';
import { captureEvent } from './posthog';
import { captureException, startSpan } from './sentry';

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'invalid';
  }
}

export interface HttpMetricsMeta {
  viaProxy?: boolean;
  platform?: 'web' | 'electron';
}

export async function withHttpMetrics(
  config: HttpRequestConfig,
  requestFn: () => Promise<HttpResponse>,
  meta: HttpMetricsMeta = {},
): Promise<HttpResponse> {
  const start = performance.now();

  return startSpan(
    'http.request',
    'http.client',
    async () => {
      try {
        const result = await requestFn();
        const durationMs = Math.round(performance.now() - start);

        captureEvent('http_request_completed', {
          method: config.method,
          host: safeHost(config.url),
          status: result.status,
          duration_ms: durationMs,
          via_proxy: meta.viaProxy ?? false,
          platform: meta.platform,
          has_error: Boolean(result.error),
        });

        return result;
      } catch (err) {
        captureException(err);
        throw err;
      }
    },
    {
      'http.method': config.method,
      'http.host': safeHost(config.url),
    },
  );
}
