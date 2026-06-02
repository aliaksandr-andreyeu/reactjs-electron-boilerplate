import { initSentry, captureException, startSpan, Sentry } from './sentry';
import { initPostHog, captureEvent, capturePageView, trackPwaLifecycle, posthog } from './posthog';
import { initWebVitals } from './webVitals';
import { withHttpMetrics } from './httpMetrics';
import type { MonitoringOptions } from './types';

export type { MonitoringOptions, AppPlatform } from './types';
export type { HttpMetricsMeta } from './httpMetrics';
export {
  initSentry,
  captureException,
  startSpan,
  Sentry,
  initPostHog,
  captureEvent,
  capturePageView,
  trackPwaLifecycle,
  posthog,
  initWebVitals,
  withHttpMetrics,
};

export function initMonitoring(options: MonitoringOptions): void {
  initSentry(options);
  initPostHog(options);

  if (options.platform === 'web') {
    initWebVitals();
    trackPwaLifecycle();
  }
}
