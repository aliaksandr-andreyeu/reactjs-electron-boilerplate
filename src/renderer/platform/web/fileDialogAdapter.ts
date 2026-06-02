import type { FileDialogPort } from '@platform/ports';
import type { FileDialogResult } from '@common/electronApi';

export const webFileDialogAdapter: FileDialogPort = {
  open(): Promise<FileDialogResult | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.json,.md,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.yaml,.yml,.toml,.log';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        try {
          const content = await file.text();
          resolve({ filePath: file.name, content });
        } catch {
          resolve({ error: 'Failed to read file' });
        }
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  },
};
