import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { captureEvent } from './posthog';

function reportWebVital(metric: Metric): void {
  captureEvent('web_vital', {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
  });
}

export function initWebVitals(): void {
  if (!import.meta.env.PROD) return;

  onCLS(reportWebVital);
  onINP(reportWebVital);
  onLCP(reportWebVital);
  onFCP(reportWebVital);
  onTTFB(reportWebVital);
}
