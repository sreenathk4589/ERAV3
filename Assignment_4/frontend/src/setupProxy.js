const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('Setting up proxy middleware');
  
  const ports = Array.from({ length: 101 }, (_, i) => 8000 + i);
  
  const findActivePort = async () => {
    for (const port of ports) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`);
        if (response.ok) {
          return port;
        }
      } catch (e) {
        continue;
      }
    }
    throw new Error('No active backend server found');
  };

  const proxy = createProxyMiddleware({
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    router: async () => {
      const port = await findActivePort();
      return `http://127.0.0.1:${port}`;
    },
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.status(500).json({ error: 'Proxy Error' });
    },
    logLevel: 'debug'
  });

  app.use('/api', proxy);
  app.use('/ws', createProxyMiddleware({
    target: 'ws://127.0.0.1:8000',
    ws: true,
    changeOrigin: true,
    router: async () => {
      const port = await findActivePort();
      return `ws://127.0.0.1:${port}`;
    }
  }));
}; 