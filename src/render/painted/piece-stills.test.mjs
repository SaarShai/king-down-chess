// The still pictures are the runtime rest frames: after a change to a rest frame, run tools/build-piece-stills.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { restBankOf } from './character-runtime.mjs';
import { PIECE_STILLS } from './piece-stills.mjs';

const manifest = JSON.parse(readFileSync(new URL('../../../public/character-runtime/manifest.json', import.meta.url)));

test('each still picture is its rest frame, cut to its painted pixels', async () => {
  const kinds = [...new Set(manifest.banks.map(b => b.character))];
  assert.deepEqual(Object.keys(PIECE_STILLS).sort(), kinds.sort());
  for (const [kind, armies] of Object.entries(PIECE_STILLS)) for (const army of ['white', 'black']) {
    const still = armies[army], bank = restBankOf(manifest.banks.filter(b => b.character === kind && b.army === army));
    assert.equal(still.sourceSha256, bank.frames[0].sourceSha256, `${kind} ${army}: rest frame changed`);
    assert.equal(still.registrationHeightPx, bank.registrationHeightPx, `${kind} ${army}`);
    const { width, height } = await sharp(fileURLToPath(new URL(`../../../public/ui/pieces/${kind}-${army[0]}.webp`, import.meta.url))).metadata();
    assert.deepEqual([width, height], still.size, `${kind} ${army}: picture size`);
  }
});
