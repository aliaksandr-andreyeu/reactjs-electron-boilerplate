// vite.renderer.config.ts
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

export default defineConfig({
    // base: './',
    // server: {
    //     fs: {
    //         allow: [path.join(__dirname, 'src')],
    //     },
    // },
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        // sourcemap: true,
        // outDir: '.vite/renderer/main_window',
        rollupOptions: {
            input: {
                main_window: path.join(__dirname, 'src/renderer/index.html'),
            },
        },
    },
    resolve: {
        conditions: ['browser'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@renderer': path.resolve(__dirname, 'src/renderer'),
            '@entities': path.resolve(__dirname, 'src/renderer/entities'),
            '@features': path.resolve(__dirname, 'src/renderer/features'),
            '@pages': path.resolve(__dirname, 'src/renderer/pages'),
            '@shared': path.resolve(__dirname, 'src/renderer/shared'),
            '@widgets': path.resolve(__dirname, 'src/renderer/widgets'),
        },
    },
    plugins: [
        {
            name: 'serve-renderer-html',
            configureServer(server) {
                const htmlPath = path.resolve(__dirname, 'src/renderer/index.html');
                console.log(`[plugin] expecting HTML at: ${htmlPath}`);
                console.log(`[plugin] file exists? ${fs.existsSync(htmlPath)}`);

                server.middlewares.use(async (req, res, next) => {
                    if (req.url === '/') {
                        try {
                            let html = await fs.promises.readFile(htmlPath, 'utf-8');
                            // Apply Vite transforms (HMR, etc.)
                            html = await server.transformIndexHtml(req.url, html);
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
                });
            },
        },
    ],
});
