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
    expect(html).toMatch(/id="end-turn"[^>]*aria-label="End turn"[^>]*><svg[^>]*>.*?<\/svg><\/button>/);
    expect(await readFile('public/support.html', 'utf8')).toContain('Sword by Studio Danro from Noun Project (CC BY 3.0)');
    for (const component of ['--mark-swap', '.title-kings', '.new-game-head', '.coin', '#game-table', '.piece-card']) expect(css).toContain(component);
    // G2 a: a spent card coin keeps a lighter dim (0.85), in the settled state and at the end of its spend pulse.
    const flat = css.replaceAll('"', '').replaceAll("'", '');
    expect(flat).toContain('.coin.card-coin[data-state=used]>.coin-paint{opacity:.85}');
    expect(flat).toMatch(/@keyframes card-spend\{to\{opacity:\.85\}/);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
