const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3001);
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

function forwardRequest(req, res) {
  const targetUrl = new URL(req.url, BACKEND_URL);
  const isBodyAllowed = !['GET', 'HEAD'].includes(req.method);

  const proxyRequest = http.request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
        connection: 'close'
      }
    },
    (proxyResponse) => {
      res.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(res);
    }
  );

  proxyRequest.on('error', (error) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Falha ao conectar no backend', detail: error.message }, null, 2));
  });

  if (!isBodyAllowed) {
    proxyRequest.end();
    return;
  }

  req.pipe(proxyRequest);
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

  if (pathname === '/' || pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify(
        {
          ok: true,
          role: 'api-gateway',
          backendUrl: BACKEND_URL,
          ts: new Date().toISOString()
        },
        null,
        2
      )
    );
    return;
  }

  if (pathname.startsWith('/api/')) {
    forwardRequest(req, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not found' }, null, 2));
});

server.listen(PORT, () => {
  console.log(`API gateway rodando em http://localhost:${PORT}`);
  console.log(`Encaminhando para ${BACKEND_URL}`);
});