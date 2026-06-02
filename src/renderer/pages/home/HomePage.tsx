import React, { useState } from 'react';
import { OpenFileButton } from '@features/openFile/ui/OpenFileButton';
import { FileContent } from '@entities/file/ui/FileContent';
import { ApiClientPanel } from '@features/apiClient/ui/ApiClientPanel';
import { useFileStore } from '@entities/file/model/store';
import { initTheme, toggleTheme, type Theme } from '@shared/lib/theme';
import { capturePageView } from '@shared/lib/monitoring';
import { Button } from '@shared/ui/Button/Button';

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'file' | 'api'>('file');

  const selectTab = (tab: 'file' | 'api') => {
    setActiveTab(tab);
    capturePageView(tab === 'file' ? '/file' : '/api');
  };
  const [theme, setTheme] = useState<Theme>(() => initTheme());
  const isLoading = useFileStore((s) => s.loading);
  const hasContent = useFileStore((s) => s.fileContent !== null);
  const hasError = useFileStore((s) => s.error !== null);

  const handleToggleTheme = () => {
    setTheme((current) => toggleTheme(current));
  };

  return (
    <div className="app">
      <nav className="menu">
        <button type="button" onClick={() => selectTab('file')} className={activeTab === 'file' ? 'active' : ''}>
          File
        </button>
        <button type="button" onClick={() => selectTab('api')} className={activeTab === 'api' ? 'active' : ''}>
          API Client
        </button>
        {activeTab === 'file' && <OpenFileButton />}
        <Button
          variant="secondary"
          className="theme-toggle"
          onClick={handleToggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </Button>
      </nav>
      <main className={activeTab === 'api' ? 'main--api' : undefined}>
        {activeTab === 'file' && (
          <>
            <FileContent />
            {!isLoading && !hasContent && !hasError && (
              <p>Click &quot;Open file&quot; to choose a text file.</p>
            )}
          </>
        )}
        {activeTab === 'api' && <ApiClientPanel />}
      </main>
    </div>
  );
};
