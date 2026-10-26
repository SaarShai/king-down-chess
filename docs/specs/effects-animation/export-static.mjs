import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { pluginSymbols } from '../../../tools/lib/plugin-symbols.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '../../..');
const output = join(here, 'static-preview');
const pages = [
  'bank.html', 'card-art/index.html', 'card-art/crop-review/index.html',
  'card-art/salvation-concepts/index.html', 'card-art/wide-review/index.html',
  'card-art/wide-review/all.html', 'card-art/wide-review/corrections.html',
  'card-art/wide-review/motion/index.html', 'gui/index.html', 'gui/triggers.html',
  'comparisons/index.html', 'comparisons/board/index.html', 'comparisons/release/index.html',
  'comparisons/information/index.html', 'comparisons/magic/index.html',
  'concepts/index.html', 'concepts/cards/index.html', 'concepts/promotion/index.html', 'concepts/check/index.html',
];
const walk = async directory => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async item => {
  const path = join(directory, item.name);
  return item.isDirectory() ? walk(path) : [path];
}))).flat();

await build({
  configFile: false, root, publicDir: false, base: './',
  plugins: [pluginSymbols(), {
    name: 'preview-public-assets', enforce: 'pre',
    transform(code, id) {
      if (id !== join(root, 'src/style.css')) return;
      return code.replaceAll("'/fonts/", "'../public/fonts/").replaceAll("'/ui/", "'../public/ui/");
    },
    transformIndexHtml: { order: 'pre', handler(html, context) {
      const publicPath = relative(dirname(context.filename), join(root, 'public')).replaceAll('\\', '/');
      html = html.replace(/(["'])\/(icons|ui)\//g, `$1${publicPath}/$2/`);
      html = html.replace(/href="([^"]+)"/g, (attribute, href) => {
        if (resolve(dirname(context.filename), href) !== join(here, 'preview/index.html')
          && resolve(dirname(context.filename), href) !== join(here, 'preview')) return attribute;
        return `href="${relative(dirname(context.filename), join(here, 'preview/bank.html')).replaceAll('\\', '/')}"`;
      });
      return html;
    } },
  }],
  build: { outDir: output, emptyOutDir: true, assetsInlineLimit: 0,
    rolldownOptions: { input: pages.map(page => join(here, 'preview', page)) } },
});

for (const name of ['manifest.json', 'motion/catalog.json']) {
  const destination = join(output, relative(root, here), 'preview/card-art/wide-review', name);
  await mkdir(dirname(destination), { recursive: true });
  await cp(join(here, 'preview/card-art/wide-review', name), destination);
}
for (const file of (await walk(output)).filter(path => path.endsWith('.html'))) {
  let html = await readFile(file, 'utf8');
  // Full-painting links use the same emitted original asset as their image.
  html = html.replace(/(<a\b[^>]*\bhref=")[^"]+\.(?:png|webp|jpe?g)("[^>]*>\s*<img\b[^>]*\bsrc=")([^"]+)"/g, '$1$3$2$3"');
  await writeFile(file, html);
}
const bank = `${relative(root, here).replaceAll('\\', '/')}/preview/bank.html`;
await writeFile(join(output, 'index.html'), `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./${bank}"><title>King Down effects previews</title><a href="./${bank}">Open banked effects previews</a>\n`);

const manifest = JSON.parse(await readFile(join(here, 'preview/card-art/wide-review/manifest.json'), 'utf8'));
const catalog = JSON.parse(await readFile(join(here, 'preview/card-art/wide-review/motion/catalog.json'), 'utf8'));
assert.equal(catalog.cards.length, 23);
assert.deepEqual(new Set(catalog.cards.map(card => card.id)), new Set(manifest.cards.map(card => card.id.toLowerCase())));
const files = await walk(output);
const present = new Set(files.map(file => resolve(file)));
for (const file of files.filter(path => path.endsWith('.js'))) {
  const code = await readFile(file, 'utf8');
  assert(!/["'`]\/(?:ui|fonts|icons)\//.test(code), `Root-relative runtime art URL in ${file}`);
}

for (const file of files.filter(path => path.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  for (const [, value] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:#|https?:|data:|mailto:)/.test(value)) continue;
    assert(!value.startsWith('/'), `Root-relative static URL: ${value}`);
    const target = resolve(dirname(file), decodeURIComponent(value.split(/[?#]/)[0] || '.'));
    assert(present.has(target) || present.has(join(target, 'index.html')), `Missing static link: ${file}: ${value}`);
  }
}
const sources = {};
for (const file of await walk(join(here, 'preview'))) {
  sources[relative(root, file).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(file)).digest('hex');
}
await writeFile(join(output, 'SOURCE-HASHES.json'), `${JSON.stringify(sources, null, 2)}\n`);
console.log(`Static preview: ${output}; ${pages.length} pages, ${catalog.cards.length} living cards; local HTML links pass.`);
