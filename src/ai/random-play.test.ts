import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { afterEach, expect, it } from 'vitest';
import { ALWAYS_ON, DEFAULT_OPTIONS, draw } from '../match/setup';
import { TAG_POWER, legalMoves, makeMove, status, type Move, type Position } from '../rules/engine';
import { positionKey } from '../rules/position-key';
import { KINGS, POWERS_BALANCED, RULES, TIER1, setRules, type KingChoice, type KingName, type Rules } from '../rules/rules';
import { startPosition, toFen, toLan } from '../rules/setup';
import { mulberry32 } from '../sim/rng';
import { probeApply, probeLegalAfter, searchLegal } from './search';

afterEach(() => setRules());

const POWERS = (Object.entries(KINGS) as [KingName, readonly KingChoice['power'][]][])
  .flatMap(([king, powers]) => powers.map(power => ({ king, power })));
const PASSIVE = POWERS.filter(k => ALWAYS_ON.includes(k.power));
const MODES = [
  { name: 'default', kings: [null, null], cards: false },
  ...POWERS.map((king, i) => ({ name: king.power, kings: [king, POWERS[(i + 5) % POWERS.length]] as const, cards: false })),
  { name: 'cards', kings: [null, null], cards: true },
  ...PASSIVE.map((king, i) => ({ name: `cards/${king.power}`, kings: [king, PASSIVE[(i + 2) % PASSIVE.length]] as const, cards: true })),
] satisfies { name: string; kings: Rules['kings']; cards: boolean }[];

// Raise the game count for a local hunt. Each game has its own seed, independent of the count.
const GAMES = Number(process.env.KINGDOWN_FUZZ_GAMES ?? MODES.length * 3);
const MAX_PLIES = 320;
const list = (pos: Position, moves: Move[]) => moves.map(m => [toLan(pos, m), m] as const).sort(([a], [b]) => a.localeCompare(b));

function agree(pos: Position, moves: Move[], seed: number): number {
  const before = structuredClone(pos), key = positionKey(pos);
  const where = (m?: Move) => `seed=${seed} ply=${pos.ply} FEN=${toFen(pos)} rules=${JSON.stringify(RULES)} move=${m ? JSON.stringify(m) : '(legal list)'}`;
  const actualRoot = list(pos, searchLegal(pos)), wantedRoot = list(pos, moves);
  if (!isDeepStrictEqual(actualRoot, wantedRoot)) {
    const different = actualRoot.find((row, i) => !isDeepStrictEqual(row, wantedRoot[i])) ?? wantedRoot[actualRoot.length];
    expect(actualRoot, where(different?.[1])).toEqual(wantedRoot);
  }
  for (const m of moves) {
    const next = makeMove(pos, m), keys = probeApply(pos, m);
    if (keys.after !== positionKey(next) || keys.back !== key) {
      expect(keys, where(m)).toEqual({ after: positionKey(next), back: key });
    }
    const actual = list(next, probeLegalAfter(pos, m)), wanted = list(next, legalMoves(next));
    if (!isDeepStrictEqual(actual, wanted)) expect(actual, where(m)).toEqual(wanted);
  }
  // The probes return keys and legal moves. They do not expose the full scratch position after undo.
  expect(pos, where()).toEqual(before);
  return moves.length;
}

it('agrees with the engine through seeded random games', () => {
  expect(Number.isSafeInteger(GAMES) && GAMES >= MODES.length, 'KINGDOWN_FUZZ_GAMES must cover every mode').toBe(true);
  const counts = {
    games: 0, plies: 0, positions: 0, edges: 0, promotions: 0, marksEnded: 0, repeats: 0, followUps: 0,
    modes: {} as Record<string, number>, powers: {} as Record<string, number>, cards: {} as Record<string, number>,
    dealt: {} as Record<string, number>, cardEffects: {} as Record<string, number>,
    passiveChanges: {} as Record<string, number>, ends: {} as Record<string, number>,
  };
  const trace = createHash('sha256');
  const add = (table: Record<string, number>, name: string) => { table[name] = (table[name] ?? 0) + 1; };
  for (let game = 0; game < GAMES; game++) {
    const seed = (0x5eed2026 + Math.imul(game, 7919)) >>> 0, rng = mulberry32(seed);
    const mode = MODES[game % MODES.length];
    // The shipped setup draws one army and a shared four-card hand from RELEASED_CARDS.
    const deal = draw({ ...DEFAULT_OPTIONS, cards: mode.cards }, rng);
    for (const card of deal.hand) { add(counts.dealt, card); add(counts.dealt, card); }
    setRules({ ...(mode.kings.some(Boolean) ? POWERS_BALANCED : {}), kings: mode.kings, hands: [deal.hand, deal.hand] });
    let pos = startPosition(deal.army);
    const seen = new Map<number, number>();
    add(counts.modes, mode.name);
    for (let ply = 0; ; ply++) {
      const key = positionKey(pos), visits = (seen.get(key) ?? 0) + 1;
      trace.update(`${seed}:${ply}:${key};`);
      seen.set(key, visits);
      if (visits > 1) counts.repeats++;
      const moves = legalMoves(pos);
      // Check every sixteenth position and every state that uses more than one action in a turn.
      if (ply % 16 === 0 || pos.free || pos.haste !== undefined) {
        counts.positions++;
        counts.edges += agree(pos, moves, seed);
        // These powers can change ordinary moves. Count sampled legal lists that each power changes.
        const rules = { ...RULES }, full = list(pos, moves);
        for (const side of [0, 1] as const) {
          const king = rules.kings[side];
          if (!king || !TIER1.includes(king.power)) continue;
          const kings: [KingChoice | null, KingChoice | null] = [...rules.kings];
          kings[side] = null;
          try {
            setRules({ ...rules, kings });
            if (!isDeepStrictEqual(list(pos, legalMoves(pos)), full)) add(counts.passiveChanges, king.power);
          } finally { setRules(rules); }
        }
      }
      const end = status(pos);
      if (end !== 'playing' || (RULES.threefold && visits >= 3) || ply === MAX_PLIES) {
        add(counts.ends, end !== 'playing' ? end : visits >= 3 ? 'drawRepetition' : 'plyCap');
        break;
      }
      const m = moves[Math.floor(rng() * moves.length)], next = makeMove(pos, m);
      if (m.power) {
        if (mode.cards) {
          add(counts.cards, m.via === 'mirrorb' ? 'MirrorB' : TAG_POWER[m.power]);
          add(counts.cardEffects, TAG_POWER[m.power]);
        }
        else add(counts.powers, TAG_POWER[m.power]);
      }
      if (m.promo && !m.power) counts.promotions++;
      for (const side of [0, 1] as const) if (pos.marks?.[side] && !next.marks?.[side]) counts.marksEnded++;
      if (pos.haste !== undefined || pos.free) counts.followUps++;
      counts.plies++;
      pos = next;
    }
    counts.games++;
    if (counts.games % 100 === 0) process.stdout.write(`random-play progress games=${counts.games} plies=${counts.plies}\n`);
  }
  process.stdout.write(`random-play coverage ${JSON.stringify({ ...counts, trace: trace.digest('hex') })}\n`);
  expect(counts.positions).toBeGreaterThan(GAMES);
  expect(counts.plies).toBeGreaterThan(GAMES * 20);
  // 57 games: 6 s idle on a 16-core Mac, 12-34 s on a shared 4-vCPU CI runner (up to 590 ms a game), so allow 1500 ms a game.
}, Math.max(60_000, GAMES * 1500));
