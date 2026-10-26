import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// While the local API is starting or restarting (nest --watch after a code change) the proxy
// can't reach it. Answer 503 quietly with one short log line instead of a stack trace per request.
let lastNote = 0;
const quietWhileApiRestarts = (proxy: any) => {
  // Vite adds its own (noisy) error handler right after `configure` — replace it on the next tick
  setImmediate(() => {
    proxy.removeAllListeners('error');
    proxy.on('error', (err: any, _req: any, res: any) => {
      if (Date.now() - lastNote > 10_000) {
        lastNote = Date.now();
        console.log(`\x1b[33m[proxy] API not reachable (${err?.code || err?.message}) — it is probably starting/restarting; requests get 503 until it's back.\x1b[0m`);
      }
      if (res && typeof res.writeHead === 'function' && !res.headersSent && !res.writableEnded) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'API is starting or restarting — try again in a moment' }));
      } else if (res && typeof res.destroy === 'function') {
        res.destroy();
      }
    });
  });
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: quietWhileApiRestarts,
      }
    }
  }
});
