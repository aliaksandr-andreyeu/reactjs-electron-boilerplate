import React from 'react';
import { useApiStore } from '../../../entities/apiRequest/model/store';
import { ResponseViewer } from '../../../entities/apiRequest/ui/ResponseViewer';
import { Button } from '../../../shared/ui/Button/Button';
import { RequestHistory } from './RequestHistory';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

function methodClass(method: string | undefined): string {
  return `method-${(method ?? 'GET').toLowerCase()}`;
}

export const HttpRequestForm: React.FC = () => {
  const {
    restUrl, restMethod, restHeaders, restBody, restLoading, restUrlError, restHistory,
    setRestUrl, setRestMethod, setRestBody,
    addHeader, removeHeader, updateHeader, sendHttp, loadRestHistoryEntry,
  } = useApiStore();

  const method = restMethod ?? 'GET';
  const showBody = BODY_METHODS.has(method);

  const historyItems = restHistory.map((entry) => ({
    id: entry.id,
    label: entry.url,
    sublabel: entry.method,
  }));

  return (
    <div className="http-form">
      <RequestHistory
        selectId="rest-history-select"
        items={historyItems}
        onSelect={loadRestHistoryEntry}
        emptyLabel="Select a request from history"
      />

      <div className="form-row">
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
          className={restUrlError ? 'input--error' : ''}
          placeholder="https://api.example.com/resource"
          value={restUrl}
          onChange={(e) => setRestUrl(e.target.value)}
          aria-label="Request URL"
          aria-invalid={!!restUrlError}
        />
        <Button variant="primary" loading={restLoading} onClick={sendHttp}>
          Send
        </Button>
      </div>
      {restUrlError && <p className="field-error" role="alert">{restUrlError}</p>}

      <section className="api-form-section headers-section">
        <h4 className="api-form-section__title">Headers</h4>
        <div className="api-form-section__body">
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
      </section>

      {showBody && (
        <section className="api-form-section body-section">
          <h4 className="api-form-section__title">Request body</h4>
          <div className="api-form-section__body">
            <textarea
              rows={6}
              placeholder='{"key": "value"}'
              value={restBody}
              onChange={(e) => setRestBody(e.target.value)}
              aria-label="Request body"
            />
          </div>
        </section>
      )}

      <ResponseViewer />
    </div>
  );
};
