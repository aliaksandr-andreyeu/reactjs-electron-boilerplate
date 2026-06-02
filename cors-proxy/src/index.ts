export interface Env {
  ALLOWED_ORIGINS: string;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': '*',
    'Access-Control-Max-Age': '86400',
  };
}

function isAllowedOrigin(origin: string | null, allowed: string): boolean {
  if (!origin) return false;
  const origins = allowed.split(',').map((o) => o.trim());
  return origins.includes(origin) || origins.includes('*');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';

    if (!isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
      return new Response('Forbidden', { status: 403 });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing ?url= query parameter' }),
        { status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } },
      );
    }

    try {
      new URL(targetUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid target URL' }),
        { status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } },
      );
    }

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('origin');
    headers.delete('referer');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ray');
    headers.delete('cf-ipcountry');

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD'
          ? await request.arrayBuffer()
          : undefined,
      });

      const responseHeaders = new Headers(response.headers);
      Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Proxy request failed';
      return new Response(
        JSON.stringify({ error: message }),
        { status: 502, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } },
      );
    }
  },
};
