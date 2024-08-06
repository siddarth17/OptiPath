// setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/predict-email',
    createProxyMiddleware({
      target: 'http://18.144.66.232:3001/',
      changeOrigin: true,
    })
  );
};