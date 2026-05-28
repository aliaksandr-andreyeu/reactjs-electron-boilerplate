import React from 'react';
import { useFileStore } from '../../../entities/file/model/store';
import { Button } from '../../../shared/ui/Button/Button';

export const OpenFileButton: React.FC = () => {
  const loading = useFileStore((s) => s.loading);
  const openFile = useFileStore((s) => s.openFile);

  return (
    <Button
      variant="primary"
      className="btn-open-file"
      onClick={openFile}
      disabled={loading}
      loading={loading}
    >
      {loading ? 'Loading' : 'Open file'}
    </Button>
  );
};
