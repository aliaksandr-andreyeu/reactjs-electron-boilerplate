import * as Sentry from '@sentry/react';
import type { MonitoringOptions } from './types';

export function initSentry({ platform }: MonitoringOptions): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    enabled: import.meta.env.PROD,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0,
    initialScope: {
      tags: { platform },
    },
  });
}

export function captureException(error: unknown): void {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.captureException(error);
}

export function startSpan<T>(
  name: string,
  op: string,
  fn: () => T | Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): T | Promise<T> {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return fn();
  }
  return Sentry.startSpan({ name, op, attributes }, fn);
}

export { Sentry };
