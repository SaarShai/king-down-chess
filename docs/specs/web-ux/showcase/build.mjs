// Assembles the published showcase in dist/: the presentation, the kit, the demos, the art and the media.
// node docs/specs/web-ux/showcase/build.mjs [--preview]
//   --preview also writes dist/preview.html: the presentation with a document skeleton, for a local check.
// It prints the file list (one path per line) to dist/files.txt, for the publish step.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const SKIP = /(^|\/)(\.DS_Store|test-engine\.mjs|capture\.mjs|build-engine\.mjs|sync-assets\.mjs|build-judge\.mjs|engine-entry\.ts|README\.md)$/;
const copy = (from, to = from) => {
  const src = join(here, from);
  if (!existsSync(src)) throw new Error(`missing ${from}`);
  cpSync(src, join(dist, to), { recursive: true, filter: s => !SKIP.test(s) });
};

for (const f of ['index.html', 'present.css', 'present.js', 'deck-data.js']) copy(f);
copy('kit');
copy('assets');
copy('media');
// Keep only the demo stills that the deck shows: a version holds at most 511 files.
const deck = { window: {} };
runInNewContext(readFileSync(join(here, 'deck-data.js'), 'utf8'), deck);
const shown = new Set(JSON.stringify(deck.window.DECK).match(/media\/demos\/[^"]+/g));
for (const id of readdirSync(join(dist, 'media', 'demos'))) {
  for (const f of readdirSync(join(dist, 'media', 'demos', id))) {
    if (!shown.has(`media/demos/${id}/${f}`)) rmSync(join(dist, 'media', 'demos', id, f));
  }
}
const demos = readdirSync(join(here, 'demos')).filter(d => existsSync(join(here, 'demos', d, 'index.html')));
for (const d of demos) copy(join('demos', d));

const walk = dir => readdirSync(dir).flatMap(n => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(dist).map(p => relative(dist, p)).sort();
let bytes = 0;
for (const f of files) bytes += statSync(join(dist, f)).size;
writeFileSync(join(dist, 'files.txt'), files.filter(f => f !== 'index.html').join('\n') + '\n');

if (process.argv.includes('--preview')) {
  const page = readFileSync(join(dist, 'index.html'), 'utf8');
  writeFileSync(join(dist, 'preview.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>\n${page}\n</body></html>\n`);
}
console.log(`${files.length} files, ${(bytes / 1048576).toFixed(1)} MB, ${demos.length} demos`);
const big = files.filter(f => statSync(join(dist, f)).size > 4 * 1048576);
if (big.length) console.log('files over 4 MB:', big.join(', '));
