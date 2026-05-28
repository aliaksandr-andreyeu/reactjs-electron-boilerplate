import React from 'react';
import { useFileStore } from '../model/store';

export const FileContent: React.FC = () => {
    const fileContent = useFileStore((s) => s.fileContent);
    const filePath = useFileStore((s) => s.filePath);
    const error = useFileStore((s) => s.error);

    if (error) return <p className="error">{error}</p>;
    if (!fileContent) return null;
    return (
        <div>
            {filePath && <p className="file-path">File: {filePath}</p>}
            <pre className="content">{fileContent}</pre>
        </div>
    );
};
