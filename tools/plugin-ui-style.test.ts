import { expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
vi.setConfig({ testTimeout: 60_000 });
it('imports game tokens and components without lesson, account or title lineup rules', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'kingdown-plugin-style-'));
  try {
    execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe' });
    const html = await readFile(join(folder, 'board.html'), 'utf8'), css = html.match(/<style>(.*?)<\/style>/s)![1];
    expect(/lesson-progress|account-body|account-who|delete-account|title-lineup/.test(css)).toBe(false);
    expect(html).toContain('id="i-sword"');
    expect(css).toContain('.menu-row .game-detail');
    expect(await readFile('src/plugin/app.ts', 'utf8')).toContain("import '../account-game/content.css'");
    expect(await readFile('src/plugin/app.css', 'utf8')).not.toContain('.menu-row .game-detail');
    expect(await readFile('public/support.html', 'utf8')).toContain('Sword by Studio Danro from Noun Project (CC BY 3.0)');
    for (const component of ['--mark-swap', '.title-kings', '.new-game-head', '.coin', '#game-table', '.piece-card']) expect(css).toContain(component);
    // G2 a: a spent card coin keeps a lighter dim (0.85), in the settled state and at the end of its spend pulse.
    const flat = css.replaceAll('"', '').replaceAll("'", '');
    expect(flat).toMatch(/#app-root :is\(#game-table,\[data-seat-id=game-table\]\) \.coin\.card-coin\[data-state=used\]\{[^}]*opacity:\.85(?:;|})/);
    expect(flat).toMatch(/@keyframes card-spend\{to\{opacity:\.85\}/);
    expect.soft(flat).toContain('#app-root{--focus:#173b6b;--focus-halo:var(--vellum)}');
    expect.soft(flat).toContain('#app-root #board:focus{outline-offset:-3px;box-shadow:0 0 0 3px var(--focus-halo)}');
    expect.soft(flat).toContain('#app-root :is(#game-table,[data-seat-id=game-table]) .table-back:focus{outline-offset:-7px;box-shadow:inset 0 0 0 8px var(--focus-halo)}');
    expect(flat).toMatch(/#app-root :is\(#game-table,\[data-seat-id=game-table\]\) \.coin\.card-coin\[data-state=used\]\{[^}]*border-color:var\(--stone-700\);--card-ring:var\(--stone-700\)/);
    expect(flat).toMatch(/#app-root :is\(#game-table,\[data-seat-id=game-table\]\) \.card-coin:is\(\[data-state=used\],:has\(\.cc-word\)\) img\{filter:brightness\(\.4\)\}/);
    expect(flat).toContain('#app-root :is(button:focus,a[href]:focus,input:focus,select:focus,label:focus,#board:focus,dialog:focus,[tabindex]:focus,label:has(input:focus)){outline:3px solid var(--focus);outline-offset:2px;box-shadow:0 0 0 6px var(--focus-halo)}');
    const shared = await readFile('src/account-game/content.css', 'utf8');
    const plugin = await readFile('src/plugin/app.css', 'utf8');
    const entry = await readFile('src/plugin/app.ts', 'utf8');
    expect(shared).toContain('--focus: #173b6b');
    expect(shared.match(/outline: 3px solid var\(--focus\)/g)).toHaveLength(1);
    expect(plugin).not.toMatch(/:focus|--focus:|data-state=['"]used['"]/);
    expect(entry.indexOf("import '../account-game/content.css'")).toBeGreaterThan(entry.indexOf("import './app.css'"));
    expect(flat.indexOf('#app-root{--focus:#173b6b;--focus-halo:var(--vellum)}')).toBeGreaterThan(flat.lastIndexOf('@keyframes card-spend'));
    expect(flat.indexOf('#app-root{--focus:#173b6b;--focus-halo:var(--vellum)}')).toBeGreaterThan(flat.indexOf('--focus:#1c5bb0'));
    expect(flat.match(/--focus:#173b6b/g)).toHaveLength(1);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
