import { defineConfig, loadEnv } from 'vite';
import { createSentryVitePlugin, getSentryReleaseName } from './vite/sentryPlugin';

const rootDir = __dirname;
const release = getSentryReleaseName('api-client-electron-main');

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, rootDir, '');
  const isBuild = command === 'build';

  return {
    resolve: {
      conditions: ['node'],
    },
    build: {
      outDir: '.vite/build',
      sourcemap: isBuild,
      rollupOptions: {
        external: ['electron'],
      },
    },
    define: {
      'process.env.SENTRY_DSN': JSON.stringify(env.SENTRY_DSN ?? env.VITE_SENTRY_DSN ?? ''),
    },
    plugins: [isBuild && createSentryVitePlugin(mode, release)].filter(Boolean),
  };
});
