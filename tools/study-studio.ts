import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream, realpathSync, statSync } from 'node:fs';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRunHandler } from './study-runs/http';
import { localStudio } from './study-runs/local';

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg' };
export function staticFile(root: string, url: string): string | null {
  let path: string;
  try { path = decodeURIComponent(new URL(url, 'http://127.0.0.1').pathname); } catch { return null; }
  if (path.includes('\0') || path.includes('\\') || path.split('/').some(part => part.startsWith('.') && part !== '')) return null;
  try {
    const base = realpathSync(root), file = realpathSync(resolve(base, `.${path === '/' ? '/index.html' : path}`));
    const rel = relative(base, file);
    if (!rel || rel.startsWith(`..${sep}`) || rel === '..' || isAbsolute(rel) || !statSync(file).isFile()) return null;
    return file;
  } catch { return null; }
}
export function serveStatic(root: string, req: IncomingMessage, res: ServerResponse): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  const file = staticFile(root, req.url ?? '/');
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'x-content-type-options': 'nosniff', 'cache-control': 'no-cache' });
  if (req.method === 'HEAD') { res.end(); return; }
  const stream = createReadStream(file); stream.on('error', () => res.destroy()); stream.pipe(res);
}
export function startStudio(sourceRoot = process.cwd(), port = 4174) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Use a local port from 1024 to 65535.');
  const dist = resolve(sourceRoot, 'dist'); realpathSync(resolve(dist, 'index.html'));
  const studio = localStudio(sourceRoot), handler = createRunHandler(() => studio.getCoordinator());
  const server = createServer((req, res) => {
    if (req.headers.host !== `127.0.0.1:${port}`) { res.writeHead(403); res.end('Use the local studio address.'); return; }
    void handler(req, res, () => serveStatic(dist, req, res));
  });
  server.on('close', () => studio.close());
  server.on('error', () => studio.close());
  server.listen(port, '127.0.0.1', () => console.log(`Local study studio: http://127.0.0.1:${port}`));
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = process.argv[2] === undefined ? 4174 : Number(process.argv[2]);
  startStudio(process.cwd(), port);
}
