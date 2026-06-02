import React from 'react';
import { useApiStore } from '@entities/apiRequest/model/store';

export const HttpAuthSection: React.FC = () => {
  const { restHeaders, setBearerToken } = useApiStore();

  const authHeader = restHeaders.find((h) => h.key.toLowerCase() === 'authorization');
  const bearerValue = authHeader?.value.replace(/^Bearer\s+/i, '').trim() ?? '';

  return (
    <div className="http-auth-section">
      <label className="http-auth-section__label" htmlFor="bearer-token">
        Bearer token
      </label>
      <input
        id="bearer-token"
        type="password"
        className="http-auth-section__input"
        placeholder="Paste token (sent as Authorization: Bearer …)"
        value={bearerValue}
        onChange={(e) => setBearerToken(e.target.value)}
        autoComplete="off"
      />
      <p className="http-auth-section__hint">
        Sets the Authorization header. Use the Headers tab for API keys or custom schemes.
      </p>
    </div>
  );
};
