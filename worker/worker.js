// ut4-packs: serves UT4 WebGPU content packs from the public GitHub release
// (ut4-hub/ut4-webgpu-packages) with the headers a cross-origin-isolated page needs.
// Only /<release-tag>/<name>.data paths are proxied.
const REPO = 'ut4-hub/ut4-webgpu-packages';
const PATH = /^\/(packs-[0-9a-z-]+)\/([A-Za-z0-9_.-]+\.data)$/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, ETag',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Max-Age': '86400' } });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return new Response('method not allowed', { status: 405, headers: CORS });
    }
    const m = new URL(req.url).pathname.match(PATH);
    if (!m) {
      return new Response('not found', { status: 404, headers: CORS });
    }
    const src = `https://github.com/${REPO}/releases/download/${m[1]}/${m[2]}`;
    const fwd = new Headers();
    const range = req.headers.get('Range');
    if (range) fwd.set('Range', range);
    // Follow GitHub's redirect to the signed asset URL by hand (redirect: 'follow' fails with CF error 1042).
    let up = await fetch(src, { method: req.method, redirect: 'manual' });
    const loc = up.headers.get('location');
    if (up.status >= 300 && up.status < 400 && loc) {
      up = await fetch(loc, { method: req.method, headers: fwd, redirect: 'manual' });
    }

    const out = new Headers(CORS);
    for (const k of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
      const v = up.headers.get(k);
      if (v) out.set(k, v);
    }
    out.set('Content-Type', 'application/octet-stream');
    out.set('Cache-Control', up.ok ? 'public, max-age=604800, immutable' : 'no-store');
    return new Response(up.body, { status: up.status, headers: out });
  },
};
