import type { ServerResponse } from 'node:http';
import { Connect, defineConfig, type PluginOption, type UserConfig, type ViteDevServer } from 'vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { createRendererAliases } from './vite/aliases';
import { createSentryVitePlugin, getSentryReleaseName } from './vite/sentryPlugin';

const rootDir = __dirname;
const release = getSentryReleaseName('api-client-web');

type DevMiddleware = (
  req: Connect.IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction,
) => Promise<void>;

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const plugins: PluginOption[] = [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'API Client',
        short_name: 'API Client',
        description: 'HTTP & WebSocket API testing tool',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
    {
      name: 'serve-web-html',
      configureServer(server: ViteDevServer) {
        const htmlPath = path.resolve(rootDir, 'src/renderer/index.web.html');

        const serveWebHtml: DevMiddleware = async (req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            try {
              const fs = await import('fs');
              let html = await fs.promises.readFile(htmlPath, 'utf-8');
              html = await server.transformIndexHtml(req.url ?? '/', html);
              res.setHeader('Content-Type', 'text/html');
              res.end(html);
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : String(err);
              res.statusCode = 500;
              res.end(`Error: ${message}`);
            }
            return;
          }
          next();
        };
        server.middlewares.use(serveWebHtml);
      },
    },
    createSentryVitePlugin(mode, release),
  ].filter(Boolean) as PluginOption[];

  if (process.env.ANALYZE === 'true') {
    const { visualizer } = await import('rollup-plugin-visualizer');
    plugins.push(
      visualizer({
        filename: 'dist-web/stats.html',
        gzipSize: true,
        open: false,
      }),
    );
  }

  return {
    publicDir: 'public',
    esbuild: {
      jsx: 'automatic',
    },
    build: {
      outDir: 'dist-web',
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: path.resolve(rootDir, 'src/renderer/index.web.html'),
      },
    },
    define: {
      'import.meta.env.VITE_SENTRY_RELEASE': JSON.stringify(release),
    },
    resolve: {
      alias: createRendererAliases(rootDir),
    },
    plugins,
    server: {
      port: 3000,
      open: true,
    },
  };
});
