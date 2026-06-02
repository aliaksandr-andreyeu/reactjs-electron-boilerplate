import React, { useEffect, useRef, useState } from 'react';
import { useApiStore } from '@entities/apiRequest/model/store';
import { ResponseViewer } from '@entities/apiRequest/ui/ResponseViewer';
import { Button } from '@shared/ui/Button/Button';
import { captureEvent } from '@shared/lib/monitoring';
import { ApiWorkspace } from './ApiWorkspace';
import { HttpAuthSection } from './HttpAuthSection';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);
type RequestSection = 'headers' | 'body' | 'auth';

function methodClass(method: string | undefined): string {
  return `method-${(method ?? 'GET').toLowerCase()}`;
}

export const HttpRequestForm: React.FC = () => {
  const {
    restUrl, restMethod, restHeaders, restBody, restLoading, restUrlError, restHistory,
    setRestUrl, setRestMethod, setRestBody,
    addHeader, removeHeader, updateHeader, sendHttp, loadRestHistoryEntry,
  } = useApiStore();

  const [section, setSection] = useState<RequestSection>('headers');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const didFirstSend = useRef(false);

  const handleSend = () => {
    if (!didFirstSend.current) {
      didFirstSend.current = true;
      captureEvent('time_to_first_send_ms', {
        ms: Math.round(performance.now()),
      });
    }
    void sendHttp();
  };

  const handleHistorySelect = (id: string) => {
    setSelectedHistoryId(id);
    loadRestHistoryEntry(id);
  };

  const method = restMethod ?? 'GET';
  const showBody = BODY_METHODS.has(method);

  useEffect(() => {
    if (!showBody && section === 'body') {
      setSection('headers');
    }
  }, [showBody, section]);

  const historyItems = restHistory.map((entry) => ({
    id: entry.id,
    label: entry.url,
    sublabel: entry.method,
  }));

  return (
    <ApiWorkspace
      sidebarTitle="History"
      historyItems={historyItems}
      selectedHistoryId={selectedHistoryId}
      onSelectHistory={handleHistorySelect}
      historyEmptyLabel="Sent requests appear here"
    >
      <div className="http-workspace">
        <div className="http-workspace__request">
          <div className="request-bar">
            <select
              className={methodClass(method)}
              value={method}
              onChange={(e) => setRestMethod(e.target.value)}
              aria-label="HTTP method"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              type="text"
              className={`request-bar__url${restUrlError ? ' input--error' : ''}`}
              placeholder="https://api.example.com/resource"
              value={restUrl}
              onChange={(e) => setRestUrl(e.target.value)}
              aria-label="Request URL"
              aria-invalid={!!restUrlError}
            />
            <Button variant="primary" loading={restLoading} onClick={handleSend}>
              Send
            </Button>
          </div>
          {restUrlError && <p className="field-error" role="alert">{restUrlError}</p>}

          <div className="section-tabs" role="tablist" aria-label="Request sections">
            <button
              type="button"
              role="tab"
              aria-selected={section === 'headers'}
              className={section === 'headers' ? 'active' : ''}
              onClick={() => setSection('headers')}
            >
              Headers
            </button>
            {showBody && (
              <button
                type="button"
                role="tab"
                aria-selected={section === 'body'}
                className={section === 'body' ? 'active' : ''}
                onClick={() => setSection('body')}
              >
                Body
              </button>
            )}
            <button
              type="button"
              role="tab"
              aria-selected={section === 'auth'}
              className={section === 'auth' ? 'active' : ''}
              onClick={() => setSection('auth')}
            >
              Auth
            </button>
          </div>

          <div className="section-panel">
            {section === 'headers' && (
              <div className="headers-panel">
                {restHeaders.map((h) => (
                  <div key={h.id} className="header-pair">
                    <input
                      placeholder="Name"
                      value={h.key}
                      onChange={(e) => updateHeader(h.id, e.target.value, h.value)}
                    />
                    <input
                      placeholder="Value"
                      value={h.value}
                      onChange={(e) => updateHeader(h.id, h.key, e.target.value)}
                    />
                    <Button
                      variant="icon"
                      onClick={() => removeHeader(h.id)}
                      aria-label="Remove header"
                      title="Remove"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" onClick={addHeader}>
                  + Add header
                </Button>
              </div>
            )}
            {section === 'body' && showBody && (
              <textarea
                className="body-panel__textarea"
                rows={8}
                placeholder='{"key": "value"}'
                value={restBody}
                onChange={(e) => setRestBody(e.target.value)}
                aria-label="Request body"
              />
            )}
            {section === 'auth' && <HttpAuthSection />}
          </div>
        </div>

        <div className="http-workspace__response">
          <ResponseViewer />
        </div>
      </div>
    </ApiWorkspace>
  );
};
