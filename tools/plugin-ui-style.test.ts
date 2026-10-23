import { expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
vi.setConfig({ testTimeout: 60_000 });
it('imports game tokens and components without lesson, account or title lineup rules', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'kingdown-plugin-style-'));
  try {
    // Normal shared build: at most 601 ms in the M1 style test.
    execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe', timeout: 30_000 });
    const html = await readFile(join(folder, 'board.html'), 'utf8'), css = html.match(/<style>(.*?)<\/style>/s)![1];
    expect(/lesson-progress|account-body|account-who|delete-account|title-lineup/.test(css)).toBe(false);
    expect(html).toContain('id="i-sword"');
    expect(css).toContain('.menu-row .game-detail');
    expect(await readFile('src/account-game/runtime.ts', 'utf8')).toContain("import '../account-game/content.css'");
    expect(await readFile('src/plugin/app.css', 'utf8')).not.toContain('.menu-row .game-detail');
    expect(html).toMatch(/id="end-turn"[^>]*aria-label="End turn"[^>]*><svg[^>]*>.*?<\/svg><\/button>/);
    expect(await readFile('public/support.html', 'utf8')).toContain('Sword by Studio Danro from Noun Project (CC BY 3.0)');
    for (const component of ['--mark-swap', '.title-kings', '.new-game-head', '.coin', '#game-table', '.piece-card']) expect(css).toContain(component);
    // G2 a: the spend press settles into the lighter dim (0.85) and grey ring.
    const flat = css.replaceAll('"', '').replaceAll("'", '');
    expect(flat).toMatch(/\.coin\.card-coin\[data-state=used\]>.coin-paint\{[^}]*opacity:\.85(?:;|})/);
    expect(flat).not.toContain('@keyframes card-spend');
    expect(flat).toContain(':is(#game-table,[data-seat-id=game-table]) .card-coin[data-state=used]{transform:scale(.96)}');
    expect.soft(flat).toContain('--focus:#2b2621;--focus-gold:#e9c071');
    expect.soft(flat).toContain('#app-root #board:focus{outline-offset:-3px;outline-width:3px;box-shadow:none!important}');
    expect.soft(flat).toContain('#app-root :is(#game-table,[data-seat-id=game-table]) .table-back:focus{outline-offset:-2px;box-shadow:inset 0 0 0 4px var(--focus-gold)!important}');
    expect(flat).toMatch(/#app-root :is\(#game-table,\[data-seat-id=game-table\]\) \.coin\.card-coin\[data-state=used\]>.coin-paint\{[^}]*border-color:var\(--stone-500\);--card-ring:var\(--stone-500\)/);
    expect(flat).toContain('#app-root :is(button:focus,a[href]:focus,input:focus,select:focus,label:focus,dialog:focus,[tabindex]:focus,label:not(.card-face):has(input:focus)),#app-root #board:focus{outline:2px solid var(--focus);outline-offset:0;scroll-margin:5px;box-shadow:0 0 0 4px var(--focus-gold)!important}');
    expect(flat).toContain('#app-root button.emblem{transition:transform 80ms ease-out,background-color .12s}');
    const shared = await readFile('src/account-game/content.css', 'utf8');
    const plugin = await readFile('src/plugin/app.css', 'utf8');
    const entry = await readFile('src/account-game/runtime.ts', 'utf8');
    const base = await readFile('src/style.css', 'utf8');
    expect(base).toMatch(/:root\s*\{[^}]*--focus: #2b2621;[^}]*--focus-gold: #e9c071;/s);
    for (const token of ['focus', 'focus-gold']) expect(base.match(new RegExp(`--${token}:`, 'g'))).toHaveLength(1);
    expect(shared).not.toMatch(/--focus(?:-gold|-halo)?\s*:|--focus-halo/);
    const focusRules = shared.slice(shared.indexOf('#app-root :is(button:focus,'));
    expect(focusRules).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
    expect(shared.match(/outline: 2px solid var\(--focus\)/g)).toHaveLength(1);
    expect(plugin).not.toMatch(/:focus|--focus:|data-state=['"]used['"]/);
    expect(entry.indexOf("import '../account-game/content.css'")).toBeGreaterThan(entry.indexOf("import '../plugin/app.css'"));
    expect(flat.indexOf('#app-root :is(button:focus,')).toBeGreaterThan(flat.indexOf('--focus:#2b2621'));
    for (const token of ['focus', 'focus-gold']) expect(flat.match(new RegExp(`--${token}:`, 'g'))).toHaveLength(1);
    expect(flat).toContain('#app-root #board:focus:after{content:"";z-index:5;pointer-events:none;border:2px solid var(--focus-gold);position:absolute;inset:3px}'.replaceAll('"', ''));
    expect(flat).toContain('#app-root .seg-row label:has(input:focus){outline-offset:-2px;box-shadow:inset 0 0 0 4px var(--focus-gold)!important}');
    expect(flat).toContain('#app-root label.mode:has(input:focus){outline-offset:-2px;box-shadow:inset 0 0 0 6px var(--focus-gold)!important}');
    expect(flat).toContain('#app-root label:has(input:focus){opacity:1}');
    expect(flat).toContain('@container table-screen (width<=319px){#app-root :is(#game-table,[data-seat-id=game-table]) .coin-row{padding:4px}}');
    expect(flat).toContain('#app-root :is(#game-table,[data-seat-id=game-table]) .coin:focus{z-index:1;outline-offset:-2px;box-shadow:inset 0 0 0 4px var(--focus-gold)!important}');
  } finally { await rm(folder, { recursive: true, force: true }); }
});
