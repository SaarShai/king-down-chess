import { build } from 'vite';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve(process.argv[2] || 'dist-plugin-ui');
await build({ configFile: false, root: resolve('src/plugin'), base: './', publicDir: false, build: { outDir: output, emptyOutDir: true, assetsInlineLimit: Number.MAX_SAFE_INTEGER, cssCodeSplit: false, rolldownOptions: { output: { codeSplitting: false } } } });
let html = await readFile(resolve(output, 'index.html'), 'utf8');
const script = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/);
if (!script) throw new Error('Missing built UI script');
const js = await readFile(resolve(output, script[1]), 'utf8');
// Callback replacement keeps minified JavaScript dollar sequences literal.
html = html.replace(script[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`);
for (const style of html.matchAll(/<link[^>]*href="([^"]+\.css)"[^>]*>/g)) { const css = await readFile(resolve(output, style[1]), 'utf8'); html = html.replace(style[0], () => `<style>${css}</style>`); }
const uri = `ui://kingdown/board-${createHash('sha256').update(html).digest('hex')}.html`;
const payloadBytes = Buffer.byteLength(JSON.stringify({ contents: [{ uri, mimeType: 'text/html;profile=mcp-app', text: html }] }));
if (payloadBytes > 4_400_000) throw new Error(`MCP resource payload exceeds response budget: ${payloadBytes}`);
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'board.html'), html);
console.log(`Self-contained MCP App resource: ${resolve(output, 'board.html')} (${Buffer.byteLength(html)} bytes)`);
