import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../shared/styles/tokens.css';
import './App.css';
import '../shared/ui/Button/Button.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
const root = createRoot(rootElement);
root.render(<App />);
