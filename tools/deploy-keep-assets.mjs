// Keep the content-named files of the live build in the new static tree. tools/deploy.sh runs this on
// the publish copy before publication. A page of the old build that is still starting at the switch, or
// that loads a lazy chunk later, then gets its own file and not a 404 (release review 2026-10-25, P2).
// The walk starts at the live / and /sw.js. It follows each quoted assets path in the text files that it
// reads. It adds only names that the build does not have, and it changes no file of the build. It keeps
// one build back: a file that the live build kept from its own previous build is not kept again.
// assets/kept-files.json names the kept files. When the live page is the page of this build (a rerun,
// for example after a failed live check), the walk also reads that live list and keeps its files again.
// Send no cookie. DEPLOY_LIVE_URL defaults to https://kingdown.dev.
// Exit: 0 pass, 1 live fault (a failed read, a wrong type, a type with no check, or other bytes at a
// name of the build), 2 invalid build or arguments.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const fault = (code, message) => { console.error(`keep-assets: ${message}`); process.exit(code); };
const [folder, ...extra] = process.argv.slice(2);
if (!folder || extra.length) fault(2, 'usage: node tools/deploy-keep-assets.mjs <static folder>');
for (const name of ['index.html', 'sw.js', 'assets']) if (!existsSync(join(folder, name))) fault(2, `the build has no ${name} in ${folder}`);
const base = (process.env.DEPLOY_LIVE_URL || 'https://kingdown.dev').replace(/\/+$/, '');

// The content types of tools/deploy-live-check.mjs. The live check compares each file under assets/, so
// a build file of another type stops here, before publication, and not after it.
const types = { js: ['text/javascript', 'application/javascript'], mjs: ['text/javascript', 'application/javascript'], css: ['text/css'], json: ['application/json'], svg: ['image/svg+xml'], png: ['image/png'], webp: ['image/webp'], woff2: ['font/woff2'], wasm: ['application/wasm'] };
const binary = ['png', 'webp', 'woff2', 'wasm'];
const typeOf = file => types[extname(file).slice(1)];
for (const file of readdirSync(join(folder, 'assets'))) if (!typeOf(file)) fault(2, `the build has no checked content type for assets/${file}`);
const list = 'kept-files.json';
if (existsSync(join(folder, 'assets', list))) fault(2, `the build already has assets/${list}`);
// A Vite content name: <name>-<8-character hash>.<extension>, of any extension: an old file of a type
// with no check stops the walk, so that no old file goes without a word. "/assets/x", "./assets/x" and
// "assets/x" name a file under /assets/ (the page, the CSS, Vite's preload lists and the worker lists).
// "./x" names one only in a file under /assets/ (a sibling chunk). A query or a fragment can follow the
// name ("/assets/x.svg#mark" in CSS); the walk reads the file without it. A space or a comma can also
// end or start a name, as in a srcset list.
const name = String.raw`[\w.-]+-[\w-]{8}\.[A-Za-z0-9]+`;
const reference = new RegExp(String.raw`["'\x60(\s,]((?:\.?\/)?assets\/|\.\/)(${name})(?=["'\x60)?#\s,])`, 'g');

/** GET with no cookie and no redirect. A fault stops the publish before it starts. */
async function get(path) {
  try {
    const res = await fetch(base + path, { credentials: 'omit', redirect: 'manual', headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15_000) });
    return { status: res.status, type: (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase(), bytes: Buffer.from(await res.arrayBuffer()) };
  } catch (error) {
    fault(1, `GET ${path}: fetch failed (${error.cause?.code ?? error.message})`);
  }
}

const live = new Map(), queue = [], roots = {};
const read = (path, text) => { for (const [, prefix, file] of text.matchAll(reference)) if (prefix !== './' || path.startsWith('/assets/')) queue.push(file); };
for (const [path, accepted] of [['/', ['text/html']], ['/sw.js', types.js]]) {
  const { status, type, bytes } = await get(path);
  if (status !== 200) fault(1, `GET ${path}: expected HTTP 200, got ${status}`);
  if (!accepted.includes(type)) fault(1, `GET ${path}: expected ${accepted.join(' or ')}, got ${type || 'no content type'}`);
  read(path, bytes.toString('utf8'));
  roots[path] = bytes;
}
if (!queue.length) fault(1, `${base}/ and /sw.js name no file under /assets/`);
const rerun = roots['/'].equals(readFileSync(join(folder, 'index.html')));
let listed = 'no live list';
if (rerun) {
  const { status, type, bytes } = await get(`/assets/${list}`);
  if (status === 200 && type === 'application/json') {
    let names;
    try { names = JSON.parse(bytes.toString('utf8')); } catch { /* checked below */ }
    if (!Array.isArray(names) || names.some(file => typeof file !== 'string' || !new RegExp(`^${name}$`).test(file))) fault(1, `/assets/${list}: the live list is not a list of content names`);
    queue.push(...names);
    listed = `the live list names ${names.length}`;
  } else if (status !== 404) fault(1, `GET /assets/${list}: expected JSON with HTTP 200, or HTTP 404, got HTTP ${status} ${type || 'no content type'}`);
}
while (queue.length) {
  const level = [...new Set(queue.splice(0))].filter(file => !live.has(file));
  for (const file of level) live.set(file, null);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(8, level.length) }, async () => {
    while (next < level.length) {
      const file = level[next++], path = `/assets/${file}`;
      const { status, type, bytes } = await get(path);
      if (status !== 200) fault(1, `GET ${path}: expected HTTP 200, got ${status}`);
      if (!typeOf(file)) fault(1, `GET ${path}: the live build names a file of a type with no check; add the type here and in tools/deploy-live-check.mjs`);
      if (!typeOf(file).includes(type)) fault(1, `GET ${path}: expected ${typeOf(file).join(' or ')}, got ${type || 'no content type'}`);
      live.set(file, bytes);
      if (!binary.includes(extname(file).slice(1))) read(path, bytes.toString('utf8'));
    }
  }));
}

// Check every live file before the first write, so that a fault leaves the build as it was.
const kept = [];
let same = 0;
for (const [file, bytes] of [...live].sort(([a], [b]) => (a < b ? -1 : 1))) {
  const target = join(folder, 'assets', file);
  if (!existsSync(target)) kept.push([file, bytes]);
  else if (readFileSync(target).equals(bytes)) same++;
  else fault(1, `/assets/${file}: the live file differs from the build's file of the same name`);
}
for (const [file, bytes] of kept) writeFileSync(join(folder, 'assets', file), bytes, { flag: 'wx' });
writeFileSync(join(folder, 'assets', list), JSON.stringify(kept.map(([file]) => file)) + '\n', { flag: 'wx' });
console.log(`keep-assets: ${base} serves ${live.size} content-named files under /assets/${rerun ? ` (a rerun: the live page is the page of this build; ${listed})` : ''}; ${same} are in the build with the same bytes; kept ${kept.length}${kept.length ? `: ${kept.map(([file]) => file).join(', ')}` : ''}; assets/${list} names them`);
