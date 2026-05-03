const react = require('@vitejs/plugin-react');

/** @type {import('vite').UserConfig} */
module.exports = {
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5142',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/messageHub': {
        target: 'http://localhost:5142',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path,
        logLevel: 'debug'
      },
      '/notificationHub': {
        target: 'http://localhost:5142',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path,
        logLevel: 'debug'
      },
      '/postHub': {
        target: 'http://localhost:5142',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path,
        logLevel: 'debug'
      },
      '/commentHub': {
        target: 'http://localhost:5142',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path,
        logLevel: 'debug'
      },
    },
  },
};
