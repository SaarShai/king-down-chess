import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createMatch, createPinnedMatch, loadMatch, type MatchSave } from './index';

it('keeps the archived material draw and lets a new match play the mate', async () => {
  const save = readFileSync(new URL('./fixtures/material-draw-e97592e3.save.json', import.meta.url), 'utf8').trimEnd();
  const saved: MatchSave = JSON.parse(save);
  const old = await loadMatch(save);
  try {
    const before = await old.snapshot();
    expect(before).toMatchObject({ fen: 'k7/n1K5/B7/8/8/8/8/8 w - - 0 2', status: 'drawMaterial', history: ['Nc8xa7'], legal: [] });
    expect(await old.exportSave()).toBe(save);
    const mate = { id: 'bishop-mate', expectedRevision: 1, lan: 'Ba6-b7' };
    await expect(old.apply(mate)).rejects.toThrow('Match terminal');

    const fresh = await createMatch(saved.setup);
    try {
      const audit = await fresh.apply({ id: 'knight-capture', expectedRevision: 0, lan: 'Nc8xa7' });
      expect(audit).toMatchObject({ fen: before.fen, status: 'playing' });
      expect((await fresh.apply(mate)).status).toBe('checkmate');
      expect(JSON.parse(await fresh.exportSave()).engine).not.toBe(saved.engine);
    } finally { await fresh.close(); }
  } finally { await old.close(); }
}, 20_000);

it('lets the computer play a position that its archived engine keeps open', async () => {
  const engine = 'sha256:e97592e3982641cacfe591e70ec2aacd7736ef3863172b34d59d2a18452efcd2';
  const original = await createPinnedMatch({ fen: '7k/8/8/8/8/8/2B5/KB6 w - - 0 1', classic: true }, engine);
  try {
    const restored = await loadMatch(await original.exportSave());
    try {
      const before = await restored.snapshot();
      expect(before.status).toBe('playing');
      const lan = await restored.chooseMove({ maxDepth: 1 });
      expect(before.legal).toContain(lan);
      expect((await restored.apply({ id: 'archived-computer', expectedRevision: 0, lan })).status).toBe('playing');
      expect(JSON.parse(await restored.exportSave()).engine).toBe(engine);
    } finally { await restored.close(); }
  } finally { await original.close(); }
}, 20_000);
