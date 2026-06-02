import type { ServerResponse } from 'node:http';
import { Connect, defineConfig, type ViteDevServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { createRendererAliases } from './vite/aliases';
import { createSentryVitePlugin, getSentryReleaseName } from './vite/sentryPlugin';

const rootDir = __dirname;
const release = getSentryReleaseName('api-client-electron-renderer');

type DevMiddleware = (
  req: Connect.IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction,
) => Promise<void>;

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';

  return {
    esbuild: {
      jsx: 'automatic',
    },
    build: {
      sourcemap: isBuild,
      rollupOptions: {
        input: {
          main_window: path.join(rootDir, 'src/renderer/index.html'),
        },
      },
    },
    define: {
      'import.meta.env.VITE_SENTRY_RELEASE': JSON.stringify(release),
    },
    resolve: {
      conditions: ['browser'],
      alias: createRendererAliases(rootDir),
    },
    plugins: [
      {
        name: 'serve-renderer-html',
        configureServer(server: ViteDevServer) {
          const htmlPath = path.resolve(rootDir, 'src/renderer/index.html');

          const serveRendererHtml: DevMiddleware = async (req, res, next) => {
            if (req.url === '/') {
              try {
                let html = await fs.promises.readFile(htmlPath, 'utf-8');
                html = await server.transformIndexHtml(req.url ?? '/', html);
                res.setHeader('Content-Type', 'text/html');
                res.end(html);
              } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error('[plugin] failed to load HTML:', errorMessage);
                res.statusCode = 500;
                res.end(`Error loading index.html: ${errorMessage}`);
              }
              return;
            }
            next();
          };
          server.middlewares.use(serveRendererHtml);
        },
      },
      isBuild && createSentryVitePlugin(mode, release),
    ].filter(Boolean),
  };
});
