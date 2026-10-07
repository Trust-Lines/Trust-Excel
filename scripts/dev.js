// Local development: starts the API (NestJS, watch mode, port 3001) and the
// frontend (Vite, port 5173, proxies /api to the API) together.
// Ctrl+C stops both.
const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const procs = [
  { name: 'api', color: '\x1b[36m', cmd: 'npm run dev:server' },
  { name: 'web', color: '\x1b[35m', cmd: 'npm run dev:web' },
].map(({ name, color, cmd }) => {
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
  return child;
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
