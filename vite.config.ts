import { defineConfig, type Plugin } from 'vitest/config';
import { createHash } from 'node:crypto';
import { cpSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

/** Public files the built game uses. The rest of `public/` (graphics-study models, guides, sprite
 *  sets: ~37 MB) stays available to `npm run dev` / `npm run graphics:study` but is not published. */
const published = (rel: string): boolean =>
  rel === '' || rel === 'prototype' || rel === 'prototype/models' || /^prototype\/models\/board-[^/]+\.glb$/.test(rel)
  || !(rel.startsWith('prototype') || rel.startsWith('sprites'));

const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

/** Code a player may never need: the clay look and the Supabase client (only for an account). */
const onDemand = /\/src\/(render\/clay|account\/client)\.ts$/;

/** Copies the published public files and writes dist/sw.js with a content version and its precache list. */
function offlineBuild(): Plugin {
  let publicDir = '', outDir = '';
  const later = new Set<string>();
  return {
    name: 'king-down-offline',
    apply: 'build',
    configResolved(config) { publicDir = config.publicDir; outDir = resolve(config.root, config.build.outDir); },
    transformIndexHtml() {
      // Only once the board is drawn (main.ts exposes `view` for the tools), so caching for offline
      // never competes with a first visit's downloads; it gives up waiting after 60 s.
      return [{ tag: 'script', injectTo: 'head', children: `if ('serviceWorker' in navigator) addEventListener('load', async () => {
  for (let t = 0; !window.view && t < 300; t++) await new Promise(r => setTimeout(r, 200));
  await Promise.race([window.view?.ready(), new Promise(r => setTimeout(r, 60000))]);
  navigator.serviceWorker.register('./sw.js').catch(() => {});
});` }];
    },
    generateBundle(_options, bundle) {
      // Chunks reachable without the clay look or an account are precached; the others are cached when first used.
      const chunks = Object.values(bundle).filter(f => f.type === 'chunk');
      const byName = new Map(chunks.map(c => [c.fileName, c]));
      const painted = new Set<string>();
      const visit = (name: string) => {
        const c = byName.get(name);
        if (!c || painted.has(name) || onDemand.test(c.facadeModuleId?.replaceAll('\\', '/') ?? '')) return;
        painted.add(name);
        for (const next of [...c.imports, ...c.dynamicImports]) visit(next);
      };
      for (const c of chunks) if (c.isEntry) visit(c.fileName);
      later.clear();
      for (const c of chunks) if (!painted.has(c.fileName)) later.add(c.fileName);
    },
    writeBundle() {
      cpSync(publicDir, outDir, { recursive: true, filter: src => published(relative(publicDir, src).split(sep).join('/')) });
      const files = walk(outDir).map(path => relative(outDir, path).split(sep).join('/')).filter(f => f !== 'sw.js').sort();
      const template = readFileSync(join(publicDir, 'sw.js'), 'utf8');
      const hash = createHash('sha256').update(template); // a change to the worker itself is a new version too
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const precache = ['./', ...files.filter(f => f !== 'index.html' && !later.has(f) && !/^(prototype|models)\//.test(f) && !f.endsWith('.map'))];
      const sw = template
        .replace("const VERSION = 'dev';", `const VERSION = '${hash.digest('hex').slice(0, 12)}';`)
        .replace('const PRECACHE = [];', `const PRECACHE = ${JSON.stringify(precache)};`);
      if (!sw.includes('const PRECACHE = [".')) throw new Error('sw.js template markers not found');
      writeFileSync(join(outDir, 'sw.js'), sw);
    },
  };
}

export default defineConfig({
  // Relative URLs: the same build works at a site root, on a sub-path such as GitHub Pages'
  // /king-down-chess/, and in `vite preview`.
  base: './',
  server: { port: +(process.env.PORT || 5173), strictPort: true },
  worker: { format: 'es' },
  build: { copyPublicDir: false },
  plugins: [offlineBuild()],
  // Vitest collects the source, tools and Claude hook tests. docs/2d-first-pieces uses node:test (npm test).
  test: { environment: 'node', include: ['src/**/*.test.ts', 'tools/**/*.test.ts', '.claude/hooks/**/*.test.ts'] },
});
