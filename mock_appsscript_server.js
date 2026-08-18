// Mimics the exact request/response contract of the deployed Google Apps Script Web App
// (Code.gs's doGet/doPost) so the frontend sync logic can be tested locally without a real
// Google account/deployment. Also serves the app's index.html so it can be tested in a browser.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || 5180);
const HTML_PATH = process.argv[3] || path.join(__dirname, '..', 'index.html');

let store = { data: null, updatedAt: null };

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/state')) {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(store));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (typeof parsed.data === 'undefined') { res.end(JSON.stringify({ error: 'Missing data' })); return; }
          store = { data: parsed.data, updatedAt: new Date().toISOString() };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, updatedAt: store.updatedAt }));
        } catch (e) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
      return;
    }
  }
  if (req.url === '/') {
    let html = fs.readFileSync(HTML_PATH, 'utf8');
    html = html.replace("const SHARED_STATE_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';", `const SHARED_STATE_URL = 'http://localhost:${PORT}/state';`);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }
  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => console.log(`Mock Apps Script + app server on http://localhost:${PORT}`));
