import { expect, it, vi } from 'vitest';
import { fixtures } from '../../docs/specs/effects-animation/preview/signals/fixtures';
import { boardSounds } from './sounds';
import { snd } from './sfx';

it('silences Freeze when the web board requests it', () => {
  const { rules, before } = fixtures.freeze, action = rules.legalMoves(before).find(move => move.power === 'freeze')!;
  const cue = vi.spyOn(snd, 'move').mockImplementation(() => {});
  try {
    const sound = boardSounds();
    const run = (silent?: boolean) => {
      const { start, contact, finish } = sound.move(before, action, rules, true, () => true, true, silent);
      start(); contact(); finish();
    };
    run(true);
    expect(cue).not.toHaveBeenCalled();
    run();
    expect(cue).toHaveBeenCalledOnce();
  } finally { cue.mockRestore(); }
});
