import React, { useState } from 'react';
import { HttpRequestForm } from './HttpRequestForm';
import { WebSocketRequestForm } from './WebSocketRequestForm';
import './apiClient.css';

export const ApiClientPanel: React.FC = () => {
  const [tab, setTab] = useState<'http' | 'ws'>('http');
  return (
    <div className="api-client-panel">
      <div className="tabs" role="tablist">
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
      {tab === 'http' ? <HttpRequestForm /> : <WebSocketRequestForm />}
    </div>
  );
};
