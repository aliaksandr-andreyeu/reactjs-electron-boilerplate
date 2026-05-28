import React, { useState } from 'react';
import { useApiStore } from '../model/store';
import { Button } from '../../../shared/ui/Button/Button';

function statusVariant(status: number): string {
  if (status >= 200 && status < 300) return 'status-badge--success';
  if (status >= 300 && status < 400) return 'status-badge--redirect';
  if (status >= 400 && status < 500) return 'status-badge--client-error';
  return 'status-badge--server-error';
}

function tryFormatJson(text: string): { formatted: string; isJson: boolean } {
  const trimmed = text.trim();
  if (!trimmed) return { formatted: text, isJson: false };
  // Fast path: likely JSON
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
    return { formatted: text, isJson: false };
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
  } catch {
    return { formatted: text, isJson: false };
  }
}

export const ResponseViewer: React.FC = () => {
  const response = useApiStore((s) => s.restResponse);
  const [copied, setCopied] = useState(false);
  const [pretty, setPretty] = useState(true);

  if (!response) return null;

  const rawText = response.error ?? response.data ?? '';
  const formatted = response.error ? { formatted: rawText, isJson: false } : tryFormatJson(rawText);
  const displayText = !response.error && pretty && formatted.isJson ? formatted.formatted : rawText;
  const textToCopy = displayText;
  const headers = response.headers ?? {};
  const headerEntries = Object.entries(headers);

  const handleCopy = async () => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="response-viewer">
      <div className="response-viewer__header">
        <h4 className="response-viewer__title">Response</h4>
        {!response.error && response.status !== undefined && (
          <span className={`status-badge ${statusVariant(response.status)}`}>
            {response.status}
          </span>
        )}
        {!response.error && formatted.isJson && (
          <Button
            variant="secondary"
            className="response-viewer__toggle"
            onClick={() => setPretty((v) => !v)}
          >
            {pretty ? 'Pretty' : 'Raw'}
          </Button>
        )}
        {textToCopy && (
          <Button
            variant="secondary"
            className="response-viewer__copy"
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        )}
      </div>
      {!response.error && headerEntries.length > 0 && (
        <details className="response-viewer__details">
          <summary className="response-viewer__summary">Response headers</summary>
          <div className="response-viewer__headers">
            {headerEntries.map(([k, v]) => (
              <div key={k} className="response-viewer__headerRow">
                <span className="response-viewer__headerKey">{k}</span>
                <span className="response-viewer__headerValue">{v}</span>
              </div>
            ))}
          </div>
        </details>
      )}
      {response.error ? (
        <p className="error">{response.error}</p>
      ) : (
        <pre>{displayText}</pre>
      )}
    </div>
  );
};
