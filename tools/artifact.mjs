// Build the artifact fragment from dist/index.html: <title> + font links + inline CSS + body + module script.
// Also writes dist/files.json: every supporting file under dist/ (published path → source path, relative to dist/).
// Usage: npx vite build && node tools/artifact.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const title = html.match(/<title>(.*?)<\/title>/s)?.[1] ?? 'King Down Chess';
const fontLinks = [...html.matchAll(/<link[^>]+href="https:\/\/[^"]+"[^>]*>/g)].map(m => m[0]);
const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="\.?\/?(assets\/[^"]+\.css)"[^>]*>/g)]
  .map(m => readFileSync(join(dist, m[1]), 'utf8')).join('\n');
const scripts = [...html.matchAll(/<script[^>]+type="module"[^>]+src="\.?\/?(assets\/[^"]+\.js)"[^>]*><\/script>/g)]
  .map(m => `<script type="module" src="${m[1]}"></script>`);
const body = html.match(/<body[^>]*>(.*)<\/body>/s)?.[1] ?? '';
const out = `<title>${title}</title>\n${fontLinks.join('\n')}\n<style>\n${css}\n</style>\n${body.trim()}\n${scripts.join('\n')}\n`;
writeFileSync(join(dist, 'artifact.html'), out);

const files = {};
const walk = d => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else { const r = relative(dist, p); if (!['index.html', 'artifact.html', 'files.json'].includes(r) && !n.startsWith('.')) files[r] = r; } } };
walk(dist);
writeFileSync(join(dist, 'files.json'), JSON.stringify(files, null, 1));
console.log(`artifact.html ${(out.length / 1024).toFixed(0)} kB, ${Object.keys(files).length} files, scripts: ${scripts.join(' ')}`);
