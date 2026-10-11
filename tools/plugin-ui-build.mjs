import { build } from 'vite';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
const output = resolve(process.argv[2] || 'dist-plugin-ui');
// Matches ART_ORIGIN in src/plugin/server.ts, which swaps in the server's public origin.
const ART_ORIGIN = 'https://kingdown-art.invalid';
const gameStyle = (await readFile(resolve('src/style.css'), 'utf8')).replaceAll("'/fonts/", "'../../public/fonts/").replaceAll("'/ui/", "'../../public/ui/");
const tableStyle = await readFile(resolve('src/ui/table.css'), 'utf8');
// The art leaves the page: hashed files under plugin-art/, loaded by absolute URL. The board scene asks for each
// image in CORS mode (crossOrigin 'anonymous'), so its getImageData works on art from the plugin origin.
await build({ configFile: false, root: resolve('src/plugin'), base: './', publicDir: false, plugins: [{ name: 'game-style-assets', enforce: 'pre', async load(id) {
  if (!id.endsWith('.svg?symbol')) return;
  const source = await readFile(id.slice(0, -7), 'utf8');
  const urls = ['color:#2b2621;--pi-disc:#fffcf4', 'color:#2b2621;--pi-disc:#4a4850;--pi-ring:#6e6a74;--pi-glyph:#f3ead7'].map((style, side) => {
    const ref = this.emitFile({ type: 'asset', name: `${basename(id.slice(0, -11))}-${side}.svg`, source: source.replace('<svg ', `<svg style="${style}" `) });
    return `"__VITE_ASSET__${ref}__"`;
  });
  return `export default [${urls.join(',')}];`;
}, transform(code, id) {
  if (id === resolve('src/plugin/app.css')) return code.replace("@import '../style.css';", gameStyle).replace("@import '../ui/table.css';", tableStyle);
} }], experimental: { renderBuiltUrl: (file, { hostType }) => hostType === 'html' ? { relative: true } : `${ART_ORIGIN}/${file}` },
  build: { outDir: output, emptyOutDir: true, assetsDir: 'plugin-art', assetsInlineLimit: 0, cssCodeSplit: false, rolldownOptions: { output: { codeSplitting: false } } } });
let html = await readFile(resolve(output, 'index.html'), 'utf8');
const script = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/);
if (!script) throw new Error('Missing built UI script');
const js = await readFile(resolve(output, script[1]), 'utf8');
// Callback replacement keeps minified JavaScript dollar sequences literal.
html = html.replace(script[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`);
await rm(resolve(output, script[1]));
for (const style of html.matchAll(/<link[^>]*href="([^"]+\.css)"[^>]*>/g)) { const css = await readFile(resolve(output, style[1]), 'utf8'); html = html.replace(style[0], () => `<style>${css}</style>`); await rm(resolve(output, style[1])); }
html = html.replace(/href="\.\/plugin-art\//g, `href="${ART_ORIGIN}/plugin-art/`);
const uri = `ui://kingdown/board-${createHash('sha256').update(html).digest('hex')}.html`;
const payloadBytes = Buffer.byteLength(JSON.stringify({ contents: [{ uri, mimeType: 'text/html;profile=mcp-app', text: html }] }));
// The art is served as files (ticket 09); an inlined image would put the page near the host's 4.4 MB limit again.
if (/data:image\/(?!svg\+xml)/.test(html)) throw new Error('The board page inlines an image; serve it from the plugin origin');
if (payloadBytes > 1_000_000) throw new Error(`MCP resource payload exceeds response budget: ${payloadBytes}`);
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'board.html'), html);
console.log(`MCP App resource: ${resolve(output, 'board.html')} (${Buffer.byteLength(html)} bytes, payload ${payloadBytes}); art in ${resolve(output, 'plugin-art')}`);
