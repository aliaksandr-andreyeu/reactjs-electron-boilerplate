import React, { useState } from 'react';
import { HttpRequestForm } from './HttpRequestForm';
import { WebSocketRequestForm } from './WebSocketRequestForm';
import './apiClient.css';

export const ApiClientPanel: React.FC = () => {
  const [tab, setTab] = useState<'http' | 'ws'>('http');

  return (
    <div className="api-client-panel">
      <header className="api-client-panel__header">
        <div className="api-client-panel__tabs" role="tablist" aria-label="API protocol">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'http'}
            onClick={() => setTab('http')}
            className={tab === 'http' ? 'active' : ''}
          >
            REST API
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'ws'}
            onClick={() => setTab('ws')}
            className={tab === 'ws' ? 'active' : ''}
          >
            WebSocket
          </button>
        </div>
      </header>
      <div className="api-client-panel__body">
        {tab === 'http' ? <HttpRequestForm /> : <WebSocketRequestForm />}
      </div>
    </div>
  );
};
