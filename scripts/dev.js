// Local development: starts the API (NestJS, watch mode, port 3001) and, once it answers,
// the frontend (Vite, port 5173, proxies /api to the API). Ctrl+C stops both.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const API_HEALTH = `${process.env.API_PROXY_TARGET || 'http://localhost:3001'}/api/health`;
const procs = [];

function start(name, color, cmd) {
  const child = spawn(cmd, { cwd: root, shell: true, env: process.env });
  const prefix = `${color}[${name}]\x1b[0m `;
  const pipe = (stream, out) => {
    let buf = '';
    stream.on('data', (chunk) => {
      buf += chunk;
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      lines.forEach((l) => out.write(prefix + l + '\n'));
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${prefix}exited (${code})`);
    shutdown(code ?? 0);
  });
  procs.push(child);
  return child;
}

const apiAnswers = () => new Promise((resolve) => {
  const req = http.get(API_HEALTH, (res) => { res.resume(); resolve(res.statusCode < 500 || res.statusCode === 503); });
  req.on('error', () => resolve(false));
  req.setTimeout(2000, () => { req.destroy(); resolve(false); });
});

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  for (const p of procs) {
    if (p.exitCode !== null) continue;
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(p.pid), '/T', '/F']);
    else p.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 500);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

(async () => {
  start('api', '\x1b[36m', 'npm run dev:server');
  // Wait for the API before starting the frontend, so the first page load doesn't hit a dead proxy
  const started = Date.now();
  while (!stopping && Date.now() - started < 90_000 && !(await apiAnswers())) {
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (stopping) return;
  console.log(`\x1b[35m[web]\x1b[0m ${Date.now() - started < 90_000 ? 'API is up — starting the frontend' : 'API not up after 90s — starting the frontend anyway'}`);
  start('web', '\x1b[35m', 'npm run dev:web');
})();
