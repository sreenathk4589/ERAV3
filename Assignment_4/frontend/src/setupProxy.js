const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const proxyConfig = {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    timeout: 60000,
    proxyTimeout: 60000,
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.writeHead(500, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({ 
        error: 'Proxy error occurred', 
        details: err.message 
      }));
    },
    logLevel: 'debug'
  };

  app.use('/api', createProxyMiddleware({
    ...proxyConfig,
    pathRewrite: {
      '^/api': '/api'
    }
  }));

  app.use('/ws', createProxyMiddleware({
    ...proxyConfig,
    ws: true
  }));
}; 