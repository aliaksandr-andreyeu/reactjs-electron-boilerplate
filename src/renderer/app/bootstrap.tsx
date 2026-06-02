import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sentry } from '@shared/lib/monitoring';
import { initMonitoring, type MonitoringOptions } from '@shared/lib/monitoring';
import App from './App';
import '@shared/styles/tokens.css';
import './App.css';
import '@shared/ui/Button/Button.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoot(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <Sentry.ErrorBoundary fallback={<p>Something went wrong.</p>}>
        <App />
      </Sentry.ErrorBoundary>
    </QueryClientProvider>
  );
}

export default function bootstrap(options: MonitoringOptions): void {
  initMonitoring(options);

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  const root = createRoot(rootElement);
  root.render(<AppRoot />);
}
