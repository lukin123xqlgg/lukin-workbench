const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4173;
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  
  // 处理 manifest 和 sw.js
  if (urlPath === '/manifest.webmanifest' || urlPath === '/sw.js' || urlPath === '/registerSW.js') {
    const filePath = path.join(DIST, urlPath);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(urlPath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }
  
  // 静态资源
  if (urlPath.startsWith('/assets/')) {
    const filePath = path.join(DIST, urlPath);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(urlPath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }
  
  // 图标等根路径文件
  if (urlPath.startsWith('/icon-') || urlPath === '/favicon.svg' || urlPath === '/favicon.ico') {
    const filePath = path.join(DIST, urlPath);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(urlPath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }
  
  // SPA 回退到 index.html
  const indexPath = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(indexPath).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
