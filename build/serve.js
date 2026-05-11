// Local dev server with SPA fallback.
//
// `python3 -m http.server` returns its own 404 page for unknown paths,
// which breaks reloading the SPA at any route other than `/`. On GitHub
// Pages, `404.html` runs the rafgraph handshake; locally we just serve
// `index.html` for any path that doesn't map to a real file. The router
// (`scripts/router.js`) reads the original URL from `location.pathname`
// and renders the right stack without needing the handshake.
//
// Standard library only. No imports from the app.
//
// Usage:
//   node build/serve.js [port]      # default 8000

import * as http from 'node:http';
import * as fs   from 'node:fs';
import * as path from 'node:path';

const PORT = Number(process.argv[2] ?? 8000);
const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
};

function resolveSafe(urlPathname) {
  const decoded = decodeURIComponent(urlPathname);
  const resolved = path.resolve(ROOT, '.' + decoded);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  return resolved;
}

function serveFile(res, file) {
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] ?? 'application/octet-stream';
  const data = fs.readFileSync(file);
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': data.length,
    'Cache-Control': 'no-cache',
  });
  res.end(data);
}

const server = http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];
  let target = resolveSafe(pathname);
  if (!target) {
    res.writeHead(403).end('forbidden');
    return;
  }

  try {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) target = path.join(target, 'index.html');
  } catch {
    // not present; fall through to SPA fallback below
  }

  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    serveFile(res, target);
    return;
  }

  // SPA fallback: serve index.html so the router can resolve the URL.
  const fallback = path.join(ROOT, 'index.html');
  if (fs.existsSync(fallback)) {
    serveFile(res, fallback);
    return;
  }

  res.writeHead(404).end('not found');
});

server.listen(PORT, () => {
  console.log(`Serving ${ROOT} on http://localhost:${PORT}/ (SPA fallback)`);
});
