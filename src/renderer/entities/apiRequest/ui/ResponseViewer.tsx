import React, { useState } from 'react';
import { useApiStore } from '@entities/apiRequest/model/store';
import { Button } from '@shared/ui/Button/Button';

function statusVariant(status: number): string {
  if (status >= 200 && status < 300) return 'status-badge--success';
  if (status >= 300 && status < 400) return 'status-badge--redirect';
  if (status >= 400 && status < 500) return 'status-badge--client-error';
  return 'status-badge--server-error';
}

function tryFormatJson(text: string): { formatted: string; isJson: boolean } {
  const trimmed = text.trim();
  if (!trimmed) return { formatted: text, isJson: false };
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ResponseViewer: React.FC = () => {
  const response = useApiStore((s) => s.restResponse);
  const meta = useApiStore((s) => s.restResponseMeta);
  const loading = useApiStore((s) => s.restLoading);
  const [copied, setCopied] = useState(false);
  const [pretty, setPretty] = useState(true);

  if (loading) {
    return (
      <div className="response-viewer response-viewer--empty">
        <p className="response-viewer__placeholder">Sending request…</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-viewer response-viewer--empty">
        <p className="response-viewer__placeholder">Send a request to see the response</p>
      </div>
    );
  }

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
        <div className="response-viewer__meta">
          {!response.error && response.status !== undefined && (
            <span className={`status-badge ${statusVariant(response.status)}`}>
              {response.status}
            </span>
          )}
          {meta && (
            <>
              <span className="response-viewer__stat">{meta.durationMs} ms</span>
              <span className="response-viewer__stat">{formatBytes(meta.bodySize)}</span>
            </>
          )}
        </div>
        <div className="response-viewer__actions">
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
        <p className="error response-viewer__body-error">{response.error}</p>
      ) : (
        <pre className="response-viewer__body">{displayText}</pre>
      )}
    </div>
  );
};
