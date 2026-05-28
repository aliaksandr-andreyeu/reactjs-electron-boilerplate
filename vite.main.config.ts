// vite.main.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        conditions: ['node'],
    },
    build: {
        outDir: '.vite/build',
        rollupOptions: {
            external: ['electron'],
        },
    },
});