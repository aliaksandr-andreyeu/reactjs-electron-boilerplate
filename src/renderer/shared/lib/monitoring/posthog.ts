import posthog from 'posthog-js';
import type { MonitoringOptions } from './types';

let initialized = false;

function isPostHogEnabled(): boolean {
  return Boolean(import.meta.env.VITE_POSTHOG_KEY);
}

export function initPostHog({ platform }: MonitoringOptions): void {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  if (!apiKey || initialized) return;

  posthog.init(apiKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    loaded: (client) => {
      client.register({ platform });
      if (import.meta.env.DEV) {
        client.opt_out_capturing();
      }
    },
  });

  initialized = true;
}

export function captureEvent(event: string, properties?: Record<string, unknown>): void {
  if (!initialized || !isPostHogEnabled()) return;
  if (import.meta.env.DEV) return;
  posthog.capture(event, properties);
}

export function capturePageView(path: string): void {
  if (!initialized || import.meta.env.DEV) return;
  posthog.capture('$pageview', { $current_url: path });
}

export function trackPwaLifecycle(): void {
  if (typeof window === 'undefined') return;

  if (window.matchMedia('(display-mode: standalone)').matches) {
    captureEvent('pwa_launched_standalone');
  }

  window.addEventListener('appinstalled', () => {
    captureEvent('pwa_installed');
  });
}

export { posthog };
