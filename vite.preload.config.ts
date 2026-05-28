// vite.preload.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: '.vite/build',
        rollupOptions: {
            external: ['electron'],
        },
    },
});