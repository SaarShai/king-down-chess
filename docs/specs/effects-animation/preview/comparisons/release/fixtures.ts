import { fixtures, at } from '../../signals/fixtures';
import { boardStates, StateEffects } from '../../../../../../src/render/effects/states';
import { toFen } from '../../../../../../src/rules/setup';
import type { Position } from '../../../../../../src/rules/engine';

function play(f: typeof fixtures.holyLight, pos: Position, lan: string) {
  const move = f.rules.legalMoves(pos).find(m => f.rules.toLan(pos, m) === lan);
  if (!move) throw new Error(`Release move is not legal: ${lan}`);
  return f.rules.makeMove(pos, move);
}
const holy = fixtures.holyLight;
const sheltered = play(holy, holy.after, 'Kh8-g8');
export const samples = [
  { id: 'freeze', title: 'Freeze', kind: 'freeze', f: fixtures.freeze, before: fixtures.freeze.after, after: fixtures.freeze.expired!, target: at('d5'), action: 'Ke8-f8', detail: 'Black ends its turn. The knight on d5 can move again.', proposal: 'Frost retreats in uneven patches. Loose grains fall.' },
  { id: 'wall', title: 'Ice Wall', kind: 'ward', f: fixtures.ward, before: fixtures.ward.after, after: fixtures.ward.expired!, target: at('a4'), action: 'Ke8-f8', detail: 'Black ends its turn. The rook on a4 can be captured again.', proposal: 'The ice plates become thin, move apart, and dissolve.' },
  { id: 'shelter', title: 'Holy Light', kind: 'holy-light', f: holy, before: sheltered, after: play(holy, sheltered, 'Ke2-d1'), target: at('e3'), source: at('e2'), action: 'Ke2-d1', detail: 'The king moves from e2 to d1. The knight on e3 loses shelter.', proposal: 'The mantle gathers, then lifts away from the knight.' },
];
export function controller(sample: typeof samples[number]) {
  const effects = new StateEffects();
  effects.sync(sample.f.rules, sample.before, 0, true);
  effects.sync(sample.f.rules, sample.after, 250, true);
  return effects;
}
export const proof = samples.map(s => {
  const legal = s.f.rules.legalMoves(s.before).find(m => s.f.rules.toLan(s.before, m) === s.action);
  if (!legal) throw new Error(`${s.id}: loss move is not legal`);
  const generated = s.f.rules.makeMove(s.before, legal);
  if (toFen(generated) !== toFen(s.after)) throw new Error(`${s.id}: wrong result`);
  const before = boardStates(s.f.rules, s.before), after = boardStates(s.f.rules, s.after);
  if (!before.some(x => x.kind === s.kind && x.sq === s.target) || after.some(x => x.kind === s.kind && x.sq === s.target)) throw new Error(`${s.id}: state does not end`);
  const effects = controller(s);
  return { sample: s.id, action: s.action, legal: true, beforeFen: toFen(s.before), afterFen: toFen(s.after), beforeStates: before, afterStates: after, releaseFrames: effects.frames, status: s.f.rules.status(s.after) };
});
