import path from 'path';

export function createRendererAliases(rootDir: string): Record<string, string> {
  return {
    '@': path.resolve(rootDir, 'src'),
    '@common': path.resolve(rootDir, 'src/common'),
    '@renderer': path.resolve(rootDir, 'src/renderer'),
    '@platform': path.resolve(rootDir, 'src/renderer/platform'),
    '@entities': path.resolve(rootDir, 'src/renderer/entities'),
    '@features': path.resolve(rootDir, 'src/renderer/features'),
    '@pages': path.resolve(rootDir, 'src/renderer/pages'),
    '@shared': path.resolve(rootDir, 'src/renderer/shared'),
    '@widgets': path.resolve(rootDir, 'src/renderer/widgets'),
  };
}
