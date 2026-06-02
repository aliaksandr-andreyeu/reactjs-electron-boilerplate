import { sentryVitePlugin } from '@sentry/vite-plugin';
import type { PluginOption } from 'vite';
import { loadEnv } from 'vite';

export function getSentryReleaseName(appId: string): string {
  const version = process.env.npm_package_version ?? '1.0.0';
  const sha = process.env.GITHUB_SHA?.slice(0, 7) ?? 'local';
  return `${appId}@${version}+${sha}`;
}

/**
 * Uploads source maps when SENTRY_AUTH_TOKEN is set.
 * Local prod: .env.production
 * CI: GitHub Actions secret SENTRY_AUTH_TOKEN
 */
export function createSentryVitePlugin(mode: string, releaseName: string): PluginOption | null {
  const env = loadEnv(mode, process.cwd(), '');
  const authToken = env.SENTRY_AUTH_TOKEN;

  if (!authToken || !env.SENTRY_ORG || !env.SENTRY_PROJECT) {
    return null;
  }

  return sentryVitePlugin({
    org: env.SENTRY_ORG,
    project: env.SENTRY_PROJECT,
    authToken,
    release: { name: releaseName },
    sourcemaps: {
      filesToDeleteAfterUpload: ['**/*.map'],
    },
  });
}
