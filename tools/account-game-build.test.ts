import { expect, it, vi } from 'vitest';
import { build } from 'vite';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pluginSymbols } from './lib/plugin-symbols.mjs';

vi.setConfig({ testTimeout: 60_000 });
const root = resolve('.');
const forbidden = /\/src\/(?:api\/http|plugin\/(?:settings|server|auth)|(?:match|account)\/(?:store|service)|main|account\/sync)\.[tm]s(?:\?|$)|\/node_modules\/pg\//;
function browserGuard() {
  return { name: 'account-browser-boundary', enforce: 'pre' as const,
    resolveId(source: string) { if (source.startsWith('node:') || source === 'pg') throw new Error(`Server import in browser: ${source}`); },
    transform(_code: string, id: string) {
      if (forbidden.test(id)) throw new Error(`Server import in browser: ${id}`);
    },
  };
}
async function compile(entry: string, folder: string) {
  return build({ configFile: false, envFile: false, root, publicDir: resolve('public'), logLevel: 'silent', plugins: [pluginSymbols(), browserGuard()],
    build: { outDir: folder, emptyOutDir: true, assetsInlineLimit: 0, rolldownOptions: { input: entry } } });
}
it('builds the shared hall and web adapters without a server or local controller', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'kingdown-account-build-')), entry = join(folder, 'entry.js');
  try {
    await writeFile(entry, [
      `import { createHall } from ${JSON.stringify(join(root, 'src/account-game/hall.ts'))};`,
      `import { art, symbols } from ${JSON.stringify(join(root, 'src/account-game/art.ts'))};`,
      `import { webGameClient } from ${JSON.stringify(join(root, 'src/online/game-client.ts'))};`,
      `import { createWebPageHost } from ${JSON.stringify(join(root, 'src/online/page-host.ts'))};`,
      `import ${JSON.stringify(join(root, 'src/online/page-host.css'))};`,
      'Object.assign(window, { createHall, art, symbols, webGameClient, createWebPageHost });',
    ].join('\n'));
    const out = join(folder, 'out'); await compile(entry, out);
    const files = await readdir(join(out, 'assets'));
    const source = (await Promise.all(files.filter(file => /\.(js|css)$/.test(file)).map(file => readFile(join(out, 'assets', file), 'utf8')))).join('\n');
    expect(source).not.toMatch(/KINGDOWN_PLUGIN_DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|service_role/);
    expect(source).not.toContain('kingdown.save');
    const images = await Promise.all(files.filter(file => file.endsWith('.webp')).map(file => readFile(join(out, 'assets', file))));
    for (const path of ['public/ui/kings/spirit.webp', 'public/ui/cards/freeze.webp', 'src/plugin/assets/stone-control.webp']) {
      const bytes = await readFile(path);
      expect(images.some(image => image.equals(bytes)), path).toBe(true);
    }
    const symbols = await Promise.all(files.filter(file => file.endsWith('.svg')).map(file => readFile(join(out, 'assets', file), 'utf8')));
    expect(symbols.some(svg => svg.includes('--pi-disc:#fffcf4'))).toBe(true);
    expect(symbols.some(svg => svg.includes('--pi-disc:#4a4850'))).toBe(true);
    expect(await readFile(join(out, 'fonts/cinzel-latin.woff2'))).toEqual(await readFile('public/fonts/cinzel-latin.woff2'));
    expect(source).toContain('/fonts/cinzel-latin.woff2');
    expect.soft(source).toContain('--focus:#2b2621;--focus-gold:#e9c071');
    expect.soft(source).toContain('#app-root #board:focus{outline-offset:-3px;outline-width:3px;box-shadow:none!important}');
    expect.soft(source).toContain('#app-root #game-table .table-back:focus{outline-offset:-2px;box-shadow:inset 0 0 0 4px var(--focus-gold)!important}');
    expect(source.indexOf('#app-root :is(button:focus,')).toBeGreaterThan(source.indexOf('--focus:#2b2621;--focus-gold:#e9c071'));
    expect(source).toContain('outline:2px solid var(--focus);outline-offset:0;scroll-margin:4px;box-shadow:0 0 0 4px var(--focus-gold)!important');
    expect(source).not.toContain('--focus-halo');
    expect(source).toContain('#app-root .seg-row label:has(input:focus){outline-offset:-2px;box-shadow:inset 0 0 0 4px var(--focus-gold)!important}');
    expect(source).toContain('#app-root label.mode:has(input:focus){outline-offset:-2px;box-shadow:inset 0 0 0 6px var(--focus-gold)!important}');
    expect(source).toContain('#app-root label:has(input:focus){opacity:1}');
    expect(source).toContain('@container table-screen (width<=319px){#app-root #game-table .coin-row{padding:4px}}');
    expect(source).toContain('#app-root #game-table .coin:focus{z-index:1}');
    expect(source).toContain('#app-root #game-table .coin[data-state=used]:focus{filter:none}');
    expect(source).toContain('#app-root #game-table .coin[data-state=used]:focus img{filter:grayscale()}');
    expect(source).toContain('#app-root #game-table .coin.card-coin[data-state=used]:focus img{filter:brightness(.4)grayscale()}');
    expect(source).toContain('filter:brightness(.4)');
    expect(source).toContain('.card-coin:is([data-state=used],:has(.cc-word)) img{filter:brightness(.4)}');
    for (const token of ['focus', 'focus-gold']) expect(source.match(new RegExp(`--${token}:`, 'g'))).toHaveLength(1);
    expect(source).toContain('@container table-screen (width<=319px){#app-root #game-table .player-strip:has(.card-coin){min-height:56px}}');
    const coin = source.match(/#app-root #game-table \.coin\{([^}]+)\}/)?.[1];
    for (const property of ['width', 'height', 'min-width', 'min-height']) expect(coin).toContain(`${property}:48px`);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
it('rejects a real server runtime import before it enters the browser output', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'kingdown-account-bad-')), entry = join(folder, 'entry.js');
  try {
    await writeFile(entry, `import * as server from ${JSON.stringify(join(root, 'src/api/http.ts'))}; window.server = server;`);
    await expect(compile(entry, join(folder, 'out'))).rejects.toThrow('Server import in browser');
  } finally { await rm(folder, { recursive: true, force: true }); }
});
