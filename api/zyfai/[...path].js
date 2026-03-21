/**
 * CORS proxy for the ZyFAI execution API.
 *
 * The ZyFAI SDK (axios) triggers CORS preflight requests, but api.zyf.ai does
 * not return Access-Control-Allow-Origin headers for arbitrary origins.  This
 * serverless function sits on the same origin as the app (yieldling.vercel.app)
 * so the browser makes a same-origin request here; we then forward the call
 * server-to-server to ZyFAI (no CORS involved).
 *
 * URL mapping:
 *   Browser  →  /api/zyfai/<path>
 *   Proxy    →  https://api.zyf.ai/api/v1/<path>
 */

const ZYFAI_BASE = 'https://api.zyf.ai/api/v1';

export default async function handler(req, res) {
  // Always set CORS headers (needed for both preflight and actual requests)
  res.setHeader('Access-Control-Allow-Origin',  req.headers['origin'] || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-API-Key,Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle CORS preflight immediately
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Build the target URL — join the dynamic path segments
  const segments = req.query.path;           // string[] from [...path]
  const tail     = Array.isArray(segments) ? segments.join('/') : (segments ?? '');

  // Preserve any query string parameters (excluding 'path' which is the route param)
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path') continue;
    if (Array.isArray(v)) v.forEach(vi => qs.append(k, vi));
    else qs.append(k, v);
  }
  const qstr   = qs.toString();
  const target = `${ZYFAI_BASE}/${tail}${qstr ? '?' + qstr : ''}`;

  console.log(`[ZyFAI proxy] ${req.method} ${tail} → ${target}`);

  // Forward only safe headers
  const forwardHeaders = { 'Content-Type': 'application/json' };
  if (req.headers['x-api-key'])    forwardHeaders['X-API-Key']    = req.headers['x-api-key'];
  if (req.headers['authorization']) forwardHeaders['Authorization'] = req.headers['authorization'];
  // Forward the browser's Origin so ZyFAI can validate the SIWE domain
  const browserOrigin = req.headers['origin'] || req.headers['referer']?.split('/').slice(0, 3).join('/');
  if (browserOrigin) forwardHeaders['Origin'] = browserOrigin;

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = JSON.stringify(req.body ?? {});
  }

  let upstreamRes;
  try {
    upstreamRes = await fetch(target, {
      method:  req.method,
      headers: forwardHeaders,
      body,
    });
  } catch (err) {
    console.error('[ZyFAI proxy] fetch error:', err.message);
    return res.status(502).json({ error: 'Upstream fetch failed', detail: err.message });
  }

  const contentType = upstreamRes.headers.get('content-type') ?? '';
  const status      = upstreamRes.status;

  if (contentType.includes('application/json')) {
    const data = await upstreamRes.json();
    console.log(`[ZyFAI proxy] ${status} ${tail}`, JSON.stringify(data).slice(0, 120));
    return res.status(status).json(data);
  }

  const text = await upstreamRes.text();
  console.log(`[ZyFAI proxy] ${status} ${tail} (non-JSON):`, text.slice(0, 120));
  return res.status(status).send(text);
}

// Handle CORS preflight for the proxy itself
export const config = {
  api: { bodyParser: true },
};
