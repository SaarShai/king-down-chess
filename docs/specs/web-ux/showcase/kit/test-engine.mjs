// Smoke test of kit/kd-engine.js in Node: no exception in many games.
// node docs/specs/web-ux/showcase/kit/test-engine.mjs
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

await import(fileURLToPath(new URL('./kd-engine.js', import.meta.url)));
const KD = globalThis.KD;
assert.ok(KD, 'kd-engine.js sets globalThis.KD');

let seed = 7;
const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

function checkState(s) {
  const cells = KD.board(s);
  assert.equal(cells.length, 64);
  const st = KD.status(s);
  assert.ok(['w', 'b'].includes(st.turn));
  if (!st.over) {
    const moves = KD.legal(s);
    assert.ok(moves.length > 0, 'a game in play has a legal move');
    for (const m of moves) assert.ok(m.lan && m.from && m.to && m.kind, 'each move has lan, from, to, kind');
  }
  KD.threats(s);
  assert.equal(KD.toFen(KD.fromFen(KD.toFen(s), { powers: s.kings, cards: s.hands })), KD.toFen(s));
}

function game(label, opts, pick, plies = 60) {
  let s = KD.newGame(opts);
  const kinds = new Set();
  let n = 0;
  for (; n < plies; n++) {
    checkState(s);
    if (KD.status(s).over) break;
    const m = pick(s);
    assert.ok(m, 'a move');
    const story = KD.describe(s, m);
    assert.ok(story.text.endsWith('.'), 'describe gives a sentence');
    kinds.add(story.kind);
    const before = KD.toFen(s);
    const next = KD.play(s, m);
    assert.equal(KD.toFen(s), before, 'play does not change the old state');
    assert.equal(KD.toFen(story.next), KD.toFen(next), 'describe().next equals play()');
    assert.equal(KD.toFen(KD.undo(next)), before, 'undo returns the old position');
    s = next;
  }
  const st = KD.status(s);
  console.log(`${label}: ${n} plies, ${st.text}; kinds: ${[...kinds].join(', ')}`);
  return s;
}

const ai = level => s => KD.ai(s, { level, ms: 60, random });
const randomMove = s => { const ms = KD.legal(s); return ms[Math.floor(random() * ms.length)]; };

const t0 = Date.now();
for (let g = 0; g < 3; g++) {
  game(`normal  ai-beginner #${g + 1}`, { army: 'random', seed: 100 + g }, ai('beginner'));
  game(`normal  random      #${g + 1}`, { army: 'random', seed: 200 + g }, randomMove);
  const powers = [['Flame:Haste', 'Frost:Freeze'], ['Stratus:Flight', 'Shadow:DeathTouch'], ['Mud:Leap', 'Spirit:Mercy']][g];
  game(`powers  ai-beginner #${g + 1}`, { army: 'random', seed: 300 + g, powers }, ai('beginner'));
  game(`powers  random      #${g + 1}`, { army: 'random', seed: 400 + g, powers: [['Frost:IceWall', 'Flame:Strike'], ['Stratus:Sacrifice', 'Mud:March'], ['Spirit:HolyLight', 'Shadow:Darkness']][g] }, randomMove);
}
game('chess   ai-casual       ', { army: 'chess' }, ai('casual'), 20);
game('cards   random          ', { army: 'random', seed: 9, cards: [['Freeze', 'Haste', 'Strike'], ['Flight', 'Leap', 'IceWall']] }, randomMove);

// Scripted positions and the special move kinds.
const shot = KD.fromFen('7k/8/8/4p3/3A4/8/8/K7 w - - 0 1');
const shots = KD.legal(shot, 'd4').filter(m => m.shot);
assert.ok(shots.length >= 1, 'the archer lesson has a shot');
const story = KD.describe(shot, shots[0]);
assert.equal(story.kind, 'shoot');
assert.deepEqual(story.captured, ['pawn']);
console.log('shot story:', story.text, '|', story.moment);

const chain = KD.fromFen('7k/8/3n4/3n4/3S4/8/8/K7 w - - 0 1');
const chains = KD.legal(chain, 'd4').filter(m => m.chain);
assert.ok(chains.length >= 1, 'the beast lesson has a chain');
console.log('chain story:', KD.describe(chain, chains[0]).text);

const mate = KD.fromFen('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');
const mateStory = KD.describe(mate, 'Ra1-a8');
assert.ok(mateStory.mate && mateStory.check, 'back-rank mate');
assert.equal(KD.status(mateStory.next).result, '1-0');
console.log('mate story:', mateStory.text, KD.status(mateStory.next).text);

// Rules follow each state: a powers game and a normal game side by side.
const plain = KD.newGame({ army: 'chess' });
const flame = KD.newGame({ army: 'chess', powers: ['Flame:Strike', null] });
const open = st => KD.play(KD.play(st, 'e2-e4'), 'd7-d5');
const strikeMoves = KD.legal(open(flame)).filter(m => m.power === 'strike');
assert.ok(KD.legal(open(plain)).every(m => !m.power), 'no power moves in a normal game');
assert.ok(strikeMoves.length > 0, 'Strike moves in a Flame game');
assert.equal(KD.serialize(KD.deserialize(KD.serialize(flame))).fen, KD.toFen(flame));
console.log(`kings: ${KD.kings().map(k => k.king).join(', ')}; lessons: ${KD.lessons.map(l => l.name).join(', ')}`);
console.log(`all checks passed in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
