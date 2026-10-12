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
    for (const component of ['--mark-swap', '.title-kings', '.new-game-head', '.coin', '#game-table', '.piece-card']) expect(css).toContain(component);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
