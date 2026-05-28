import React, { useEffect, useRef, useState } from 'react';
import { useApiStore } from '../../../entities/apiRequest/model/store';
import { Button } from '../../../shared/ui/Button/Button';
import { RequestHistory } from './RequestHistory';

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const WebSocketRequestForm: React.FC = () => {
  const {
    wsUrl, wsConnected, wsConnecting, wsMessages, wsError, wsUrlError, wsHistory,
    wsSubscriptions,
    setWsUrl, connectWs, disconnectWs, sendWs, subscribeWs, unsubscribeWs, clearWsMessages, loadWsHistoryEntry,
  } = useApiStore();
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [wsMessages]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendWs(trimmed);
    setMessage('');
  };

  const handleSubscribe = () => {
    const trimmed = channel.trim();
    if (!trimmed) return;
    subscribeWs(trimmed);
    setChannel('');
  };

  const historyItems = wsHistory.map((entry) => ({
    id: entry.id,
    label: entry.url,
  }));

  return (
    <div className="ws-form">
      <RequestHistory
        selectId="ws-history-select"
        items={historyItems}
        onSelect={loadWsHistoryEntry}
        emptyLabel="Select a URL from history"
      />

      <div className="form-row">
        <input
          type="text"
          className={wsUrlError ? 'input--error' : ''}
          placeholder="wss://api.example.com/socket"
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          disabled={wsConnected || wsConnecting}
          aria-label="WebSocket URL"
          aria-invalid={!!wsUrlError}
        />
        {!wsConnected ? (
          <Button variant="primary" loading={wsConnecting} onClick={connectWs}>
            Connect
          </Button>
        ) : (
          <Button variant="danger" onClick={disconnectWs}>
            Disconnect
          </Button>
        )}
      </div>
      {wsUrlError && <p className="field-error" role="alert">{wsUrlError}</p>}
      {wsError && <p className="field-error" role="alert">{wsError}</p>}

      <div className="ws-status-bar">
        <span
          className={`ws-status ${
            wsConnected ? 'ws-status--connected' : wsConnecting ? 'ws-status--connecting' : ''
          }`}
        >
          {wsConnecting
            ? 'Connecting…'
            : wsConnected
              ? 'Connected'
              : 'Disconnected'}
        </span>
      </div>

      {wsConnected && (
        <>
        <section className="api-form-section ws-subscriptions">
          <h4 className="api-form-section__title">Subscriptions</h4>
          <div className="api-form-section__body">
            <div className="ws-subscriptions__row">
              <input
                type="text"
                placeholder="Channel (e.g. orders)"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubscribe();
                }}
                aria-label="Channel name"
              />
              <Button variant="primary" onClick={handleSubscribe}>
                Subscribe
              </Button>
            </div>

            {wsSubscriptions.length > 0 && (
              <div className="ws-subscriptions__list" aria-label="Subscribed channels">
                {wsSubscriptions.map((c) => (
                  <span key={c} className="ws-subscriptions__chip">
                    <span className="ws-subscriptions__chipText">{c}</span>
                    <button
                      type="button"
                      className="ws-subscriptions__chipRemove"
                      onClick={() => unsubscribeWs(c)}
                      aria-label={`Unsubscribe from ${c}`}
                      title="Unsubscribe"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="api-form-section ws-messages">
          <h4 className="api-form-section__title">Messages</h4>
          {wsMessages.length > 0 && (
            <div className="ws-toolbar">
              <Button variant="secondary" onClick={clearWsMessages}>
                Clear
              </Button>
            </div>
          )}
          <div className="api-form-section__body">
            <div className="message-list" role="log" aria-live="polite">
              {wsMessages.length === 0 ? (
                <p className="message-list__empty">No messages yet</p>
              ) : (
                wsMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`ws-message ${msg.incoming ? 'incoming' : 'outgoing'}`}
                  >
                    <time className="ws-message__time" dateTime={new Date(msg.timestamp).toISOString()}>
                      {formatTime(msg.timestamp)}
                    </time>
                    <span className="ws-message__text">{msg.text}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-input">
              <input
                type="text"
                placeholder="Type a message…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                aria-label="WebSocket message"
              />
              <Button variant="primary" onClick={handleSend}>
                Send
              </Button>
            </div>
          </div>
        </section>
        </>
      )}
    </div>
  );
};
