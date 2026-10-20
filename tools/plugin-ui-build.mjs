import { build } from 'vite';
import { atRule, parse } from 'postcss';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pluginSymbols } from './lib/plugin-symbols.mjs';
import { buildWorker } from './plugin-runtime-build.mjs';
const output = resolve(process.argv[2] || 'dist-plugin-ui');
// Matches ART_ORIGIN in src/plugin/server.ts, which swaps in the server's public origin.
const ART_ORIGIN = 'https://kingdown-art.invalid';
const shared = parse((await readFile(resolve('src/style.css'), 'utf8')) + '\n' + await readFile(resolve('src/ui/table.css'), 'utf8'));
shared.walkRules(rule => {
  const selectors = rule.selectors.filter(selector => !/[#.](?:lesson[\w-]*|account[\w-]*|delete-account|title-lineup)\b/.test(selector));
  if (selectors.length) rule.selectors = selectors; else rule.remove();
});
shared.walkAtRules(rule => { if (rule.nodes?.every(node => node.type === 'comment')) rule.remove(); });
// On the website the table is the window's height. In the plugin it is shorter (the page head, the composer room), so
// the short-phone table rows read the height of the table's screen (app.css names it table-screen), not the window's.
shared.walkAtRules('media', rule => {
  if (/\(orientation: landscape\) and \(max-height: 500px\)/.test(rule.params)) {
    const landscape = atRule({ name: 'media', params: '(orientation: landscape)' });
    landscape.append(rule.clone({ name: 'container', params: 'table-screen (orientation: landscape) and (max-height: 640px) and (max-width: 899px)' }));
    rule.after(landscape);
  }
  if (/max-height: 640px/.test(rule.params) && rule.some(node => node.type === 'rule' && node.selector === '#game-table')) {
    const media = atRule({ name: 'media', params: '(orientation: portrait)' });
    rule.replaceWith(media);
    Object.assign(rule, { name: 'container', params: `table-screen ${rule.params.replace(' and (orientation: portrait)', '')}` });
    media.append(rule);
  }
});
const gameStyle = shared.toString().replaceAll("'./plugin/assets/", "'./assets/").replaceAll("'/fonts/", "'../../public/fonts/").replaceAll("'/ui/", "'../../public/ui/");
// The art leaves the page: hashed files under plugin-art/, loaded by absolute URL. The board scene asks for each
// image in CORS mode (crossOrigin 'anonymous'), so its getImageData works on art from the plugin origin.
await build({ define: { __KINGDOWN_PAGE_ENGINE__: JSON.stringify((await buildWorker()).engine) }, configFile: false, root: resolve('src/plugin'), base: './', publicDir: false, plugins: [pluginSymbols(), { name: 'game-style-assets', enforce: 'pre', transform(code, id) {
  if (!id.endsWith('.css')) return;
  if (id === resolve('src/plugin/app.css')) code = code.replace("@import '../style.css';", gameStyle).replace("@import '../ui/table.css';", '');
  // Seat hooks share the table look while the board keeps its IDs.
  return code.replace(/#(game-table|strip-me|strip-them|context-line|context-text|moves-line|last-move|table-bar)\b/g, ':is(#$1,[data-seat-id="$1"])');
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
