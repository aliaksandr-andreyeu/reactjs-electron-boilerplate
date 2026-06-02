import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@common': path.resolve(__dirname, 'src/common'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@platform': path.resolve(__dirname, 'src/renderer/platform'),
      '@entities': path.resolve(__dirname, 'src/renderer/entities'),
      '@features': path.resolve(__dirname, 'src/renderer/features'),
      '@pages': path.resolve(__dirname, 'src/renderer/pages'),
      '@shared': path.resolve(__dirname, 'src/renderer/shared'),
      '@widgets': path.resolve(__dirname, 'src/renderer/widgets'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'src/renderer/**/*.{ts,tsx}',
        'src/common/**/*.ts',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.ts',
        'src/renderer/app/entry.*.tsx',
        'src/renderer/app/bootstrap.tsx',
        'src/renderer/app/App.tsx',
        'src/renderer/**/*.css',
        'src/renderer/pages/**',
        'src/renderer/features/**/ui/**',
        'src/renderer/entities/**/ui/**',
      ],
      thresholds: {
        lines: 45,
        functions: 45,
        branches: 40,
        statements: 45,
      },
    },
  },
});
