/** Match api-ws server channel normalization. */
export function normalizeWsChannel(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  return s.toLowerCase();
}

export type WsSubscriptionControl =
  | { type: 'subscribe'; channel: string }
  | { type: 'unsubscribe'; channel: string };

/** Parse outgoing JSON subscribe/unsubscribe from the message input. */
export function parseOutgoingSubscriptionControl(message: string): WsSubscriptionControl | null {
  const trimmed = message.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const obj = JSON.parse(trimmed) as { type?: string; channel?: string };
    if (obj.type !== 'subscribe' && obj.type !== 'unsubscribe') return null;
    if (typeof obj.channel !== 'string') return null;
    const channel = normalizeWsChannel(obj.channel);
    if (!channel) return null;
    return { type: obj.type, channel };
  } catch {
    return null;
  }
}

/** Sync chips from server welcome / subscribed / unsubscribed payloads. */
export function parseIncomingSubscriptionChannels(data: string): string[] | null {
  try {
    const obj = JSON.parse(data) as { type?: string; channels?: unknown };
    if (obj.type !== 'welcome' && obj.type !== 'subscribed' && obj.type !== 'unsubscribed') {
      return null;
    }
    if (!Array.isArray(obj.channels)) return null;
    return obj.channels
      .map((c) => normalizeWsChannel(String(c)))
      .filter(Boolean)
      .sort();
  } catch {
    return null;
  }
}

export function applySubscriptionControl(
  channels: string[],
  control: WsSubscriptionControl,
): string[] {
  if (control.type === 'subscribe') {
    return channels.includes(control.channel) ? channels : [...channels, control.channel];
  }
  return channels.filter((c) => c !== control.channel);
}
