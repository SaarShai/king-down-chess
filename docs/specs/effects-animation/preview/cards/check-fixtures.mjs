// Run: node --import tsx docs/specs/effects-animation/preview/cards/check-fixtures.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SHARED_MECHANICS, assertMechanicExpected } from '../../../../../tools/fixtures/shared-mechanics.ts';
import { GameRules } from '../../../../../src/game-rules.ts';
import { POWERS_BALANCED, parseKings } from '../../../../../src/rules/rules.ts';
import { toFen } from '../../../../../src/rules/setup.ts';
import { RELEASED_CARDS } from '../../../../../src/content/cards.ts';
const source = SHARED_MECHANICS.filter(f => f.family === 'card');
const fixtureData = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'));
assert.deepEqual(fixtureData, JSON.parse(JSON.stringify(source)), 'The preview data must match the shared fixtures');
assert.equal(RELEASED_CARDS.length, 21);
let actions = 0;
for (const card of RELEASED_CARDS) {
  const f = fixtureData.find(f => f.id === card.fixtureId);
  assert(f, `${card.id} has a shared fixture`);
  const kings = f.setup.kings ? parseKings(f.setup.kings) : undefined;
  const context = new GameRules({ ...(kings?.some(Boolean) ? POWERS_BALANCED : {}), ...(kings ? { kings } : {}), hands: [f.setup.hand, f.setup.hand] });
  let pos = context.fromFen(f.setup.fen);
  const check = expected => assertMechanicExpected({ fen: toFen(pos), rules: context.rules, turn: pos.turn, legal: context.legalMoves(pos).map(m => context.toLan(pos, m)) }, expected, card.id);
  f.actions.forEach((action, index) => {
    const moves = context.legalMoves(pos).filter(m => context.toLan(pos, m) === action);
    assert.equal(moves.length, 1, `${card.id}: ${action}`);
    pos = context.makeMove(pos, moves[0]); actions++;
    for (const checkpoint of f.checkpoints ?? []) if (checkpoint.after === index + 1) check(checkpoint.expected);
  });
  check(f.expected);
}
console.log(`PASS: ${RELEASED_CARDS.length} released cards; ${actions} legal actions; source data, checkpoints and final expectations match.`);
