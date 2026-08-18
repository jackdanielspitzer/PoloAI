// Mimics the NEW chunked Apps Script contract (Code.gs) so the client's chunked push/pull can be
// tested locally. Also serves index.html with SHARED_STATE_URL pointed at this mock.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || 5199);
const HTML_PATH = process.argv[3] || path.join(__dirname, '..', 'index.html');

let store = { totalChunks: 0, updatedAt: null, chunks: [] };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/state') {
    if (req.method === 'GET') {
      const chunkParam = url.searchParams.get('chunk');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (chunkParam !== null) {
        const idx = parseInt(chunkParam, 10);
        res.end(JSON.stringify({ chunk: store.chunks[idx] || '' }));
      } else {
        res.end(JSON.stringify({ totalChunks: store.totalChunks, updatedAt: store.updatedAt }));
      }
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        try {
          const parsed = JSON.parse(body);
          if (typeof parsed.chunkIndex !== 'number' || typeof parsed.totalChunks !== 'number' || typeof parsed.chunk !== 'string') {
            res.end(JSON.stringify({ error: 'Malformed chunk payload' })); return;
          }
          store.chunks[parsed.chunkIndex] = parsed.chunk;
          if (parsed.chunkIndex === parsed.totalChunks - 1) {
            store.chunks.length = parsed.totalChunks;
            store.totalChunks = parsed.totalChunks;
            store.updatedAt = new Date().toISOString();
            res.end(JSON.stringify({ ok: true, updatedAt: store.updatedAt, committed: true }));
          } else {
            res.end(JSON.stringify({ ok: true, committed: false }));
          }
        } catch (e) {
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
      return;
    }
  }
  if (req.url === '/') {
    let html = fs.readFileSync(HTML_PATH, 'utf8');
    html = html.replace("const SHARED_STATE_URL = 'https://script.google.com/macros/s/AKfycbzW9w_jOxaADk6XMvT1-MpMcHajvJotIJ1-BCLbzuQ7u0fLX4n1SeN35zHo7I5hmx6F/exec';", `const SHARED_STATE_URL = 'http://localhost:${PORT}/state';`);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }
  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => console.log(`Mock chunked Apps Script + app server on http://localhost:${PORT}`));
