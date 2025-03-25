const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    pathRewrite: function (path, req) {
      // Log the original path and the rewritten path
      console.log('Original path:', path);
      const rewrittenPath = path;
      console.log('Rewritten path:', rewrittenPath);
      return rewrittenPath;
    },
    onProxyReq: (proxyReq, req, res) => {
      // Log the proxied request details
      console.log('Proxying request:', {
        method: req.method,
        originalUrl: req.originalUrl,
        path: req.path,
        targetUrl: `http://localhost:8000${req.path}`
      });
    },
    onProxyRes: (proxyRes, req, res) => {
      // Log the response details
      console.log('Received response:', {
        statusCode: proxyRes.statusCode,
        originalUrl: req.originalUrl,
        path: req.path,
        headers: proxyRes.headers
      });
    },
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      res.end(`Proxy Error: ${err.message}`);
    }
  });

  // Apply the proxy middleware to all routes starting with /api
  app.use('/api', apiProxy);
}; 