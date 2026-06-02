/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_RELEASE?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_CORS_PROXY_URL?: string;
  readonly VITE_PLATFORM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
