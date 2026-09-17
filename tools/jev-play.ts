#!/usr/bin/env -S npx tsx
/**
 * Jev session player — deliberate games where Jev steers the plan and the engine enforces legality
 * and tactics.
 *
 * Design (TASKS.md "Jev balancing review", validated before trusting):
 *   - The engine's own search plays every move unless a *plan* is available: at each turn the tool
 *     computes the engine's best move and up to three alternatives whose static evaluation is close
 *     and whose strategic theme differs. Jev chooses among **themes described in code**, never among
 *     raw chess, and only when at least two distinct themes exist.
 *   - Confidence gate: below `--minConf` the engine's move is played. Every Jev call is logged with
 *     its probabilities, so a session is auditable move by move.
 *   - `--white`/`--black` pick the policy per side (`jev` or `engine`). The default (White=jev,
 *     Black=engine) measures what plan steering costs or gains against the stock engine on paired
 *     openings; `--white engine` produces the paired control.
 *
 *   tsx tools/jev-play.ts --games 8 --depth 3 --seed 91
 *   tsx tools/jev-play.ts --games 8 --depth 3 --seed 91 --white engine   # paired control
 */
import { appendFileSync, writeFileSync } from 'node:fs';
import { Game } from '../src/game';
import { Move, Position, inCheck, isAttacked, makeMove, typeOf } from '../src/rules/engine';
import { randomBackRank, toLan } from '../src/rules/setup';
import { resetSearchState, search, positionKey } from '../src/ai/search';
import { VALUES } from '../src/ai/eval';
import { mulberry32 } from '../src/sim/rng';
import { ask, choice, conf } from './jev';

const flag = (name: string, dflt: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const GAMES = Number(flag('games', '8'));
const DEPTH = Number(flag('depth', '3'));
const SEED = Number(flag('seed', '91'));
const OPENING = Number(flag('opening', '4'));
const MAX_PLIES = Number(flag('maxPlies', '240'));
const MIN_CONF = Number(flag('minConf', '0.5'));
const WHITE = flag('white', 'jev') as 'jev' | 'engine';
const BLACK = flag('black', 'engine') as 'jev' | 'engine';
const STAMP = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); // seconds: two runs in one minute must not collide
const OUT_JSONL = `sim/out/jev-session-${STAMP}-${WHITE}-${BLACK}.jsonl`;

/** Strategic themes, in priority order; the first match is the move's primary theme. */
const THEME_TEXT: Record<string, string> = {
  win_material: 'win material: the move takes a piece worth 200 cp or more',
  promote: 'promote a pawn',
  archer_crossfire: 'archer crossfire: shoot an enemy without moving',
  beast_chain: 'beast chain: keep capturing from the landing square',
  paladin_trade: 'paladin trade: the paladin captures and removes itself',
  maester_reposition: 'maester reposition: swap with a friend or the king',
  shove: 'break a blockade: shove an adjacent piece out of the way',
  lob: 'catapult lob: fire over a screen at the first piece beyond',
  give_check: 'give check and force a reply',
  save_piece: 'save a piece that is currently attacked',
  improve_position: 'improve the position: develop, centralise, take space',
};
const themeOf = (pos: Position, m: Move): string => {
  const t = typeOf(pos.board[m.from]);
  const v = (sq: number): number => VALUES[typeOf(pos.board[sq])] ?? 0;
  if (m.captures.length && m.captures.reduce((a, s) => a + v(s), 0) >= 200) return 'win_material';
  if (m.promo) return 'promote';
  if (t === 7 && m.to === m.from) return 'archer_crossfire';
  if (t === 11 && m.captures.length > 1) return 'beast_chain';
  if (t === 8 && m.selfRemove) return 'paladin_trade';
  if (m.swap) return 'maester_reposition';
  if (m.shove) return 'shove';
  if (t === 13 && m.captures.length) return 'lob';
  const after = makeMove(pos, m);
  if (inCheck(after)) return 'give_check';
  const opp = (pos.turn ^ 1) as 0 | 1;
  if (isAttacked(pos.board, m.from, opp) && !isAttacked(after.board, m.to, opp)) return 'save_piece';
  return 'improve_position';
};

interface PlyLog { ply: number; engine: string; played: string; differed: boolean; themes: string[]; chosen?: string; conf?: number; probs?: Record<string, number>; gated?: boolean }

/** One Jev decision: pick a theme among the candidates. Returns the move to play. */
async function steer(pos: Position, candidates: { m: Move; lan: string; theme: string; score: number }[], bestMove: Move, bestLan: string): Promise<{ move: Move; log: Partial<PlyLog> }> {
  const byTheme = new Map<string, { lan: string; score: number }[]>();
  for (const c of candidates) (byTheme.get(c.theme) ?? byTheme.set(c.theme, []).get(c.theme)!).push({ lan: c.lan, score: c.score });
  const themes = [...byTheme.keys()];
  const q = {
    plan: {
      type: 'choice',
      instructions: 'Choose the plan for this move. Plans are described from the mover\'s point of view; the move list under each plan is what would be played. Prefer a plan that pursues a concrete feature (a capture, a promotion, a check, a piece under attack, a blockade) over vague improvement. All candidate moves are within a small evaluation margin of the best move, so none is a blunder.',
      criteria: Object.fromEntries(themes.map(t => [t, `${THEME_TEXT[t]} — candidates: ${byTheme.get(t)!.map(c => c.lan).join(', ')}`])),
    },
  };
  const got = await ask(
    {
      task: 'King Down chess, mid-game. The engine has narrowed the legal moves to a few plans that are all close in evaluation.',
      position: pos.board.join(','),
      side_to_move: pos.turn === 0 ? 'white' : 'black',
      engine_preference: bestLan,
    },
    q,
  );
  const a = got.plan;
  const c = conf(a);
  const chosenTheme = choice(a);
  if (!(c >= MIN_CONF) || !byTheme.has(chosenTheme)) {
    return { move: bestMove, log: { chosen: chosenTheme, conf: c, probs: a.probabilities, gated: true } };
  }
  const pool = byTheme.get(chosenTheme)!;
  const pick = pool.reduce((best, x) => (x.score > best.score ? x : best), pool[0]);
  const chosen = candidates.find(x => x.lan === pick.lan)!;
  return { move: chosen.m, log: { chosen: chosenTheme, conf: c, probs: a.probabilities, gated: false } };
}

const rand = mulberry32(SEED);
const rng = mulberry32(SEED);
let jevCalls = 0, jevDiffered = 0, movesTotal = 0;
const summary: { game: number; setup: string; result: string; reason: string; plies: number; themes: Record<string, number> }[] = [];

for (let g = 0; g < GAMES; g++) {
  const setup = randomBackRank(rng);
  const game = new Game(setup);
  resetSearchState();
  const history: number[] = [];
  const log: PlyLog[] = [];
  const themeCounts: Record<string, number> = {};
  const opening = Math.floor(OPENING * (0.5 + rand())); // deterministic per game, mild variety
  let reason = 'plyCap';

  while (game.status === 'playing' && game.history.length < MAX_PLIES) {
    const pos = game.pos;
    const policy = pos.turn === 0 ? WHITE : BLACK;
    history.push(positionKey(pos));
    const legal = game.legal;
    const r = search(pos, { maxDepth: DEPTH, history });
    const best = legal.find(m => toLan(pos, m) === toLan(pos, r.move)) ?? legal[0];
    const bestLan = toLan(pos, best);
    let move = best;
    let entry: Partial<PlyLog> = {};

    if (policy === 'jev' && game.history.length >= opening && legal.length > 1) {
      // Candidates: static reply score within a margin of the best move's, distinct themes first.
      const stat = (m: Move): number => { const a = makeMove(pos, m); return -(search(a, { maxDepth: 1 }).score ?? 0); };
      const bestStat = stat(best);
      const scored = legal.map(m => ({ m, lan: toLan(pos, m), theme: themeOf(pos, m), score: stat(m) }))
        .filter(c => c.lan === bestLan || c.score >= bestStat - 80);
      const seen = new Set<string>();
      const diverse: typeof scored = [];
      for (const c of [...scored].sort((a, b) => b.score - a.score)) {
        if (c.lan === bestLan || !seen.has(c.theme)) { diverse.push(c); seen.add(c.theme); }
        if (diverse.length >= 4) break;
      }
      // Feature-only ballot: the generic plan was the plan Jev chose on most overrides and the
      // search is strictly better at "improve position". Offer Jev only plans with a concrete hook.
      const ballot = diverse.filter(c => c.theme !== 'improve_position');
      if (new Set(ballot.map(c => c.theme)).size >= 2) {
        jevCalls++;
        const out = await steer(pos, ballot, best, bestLan);
        move = out.move;
        entry = out.log;
      }
    }
    const playedLan = toLan(pos, move);
    themeCounts[themeOf(pos, move)] = (themeCounts[themeOf(pos, move)] ?? 0) + 1;
    log.push({ ply: game.history.length + 1, engine: bestLan, played: playedLan, differed: playedLan !== bestLan, themes: [...new Set(legal.map(m => themeOf(pos, m)))], ...entry });
    if (playedLan !== bestLan) jevDiffered++;
    movesTotal++;
    game.play(move);
  }
  reason = game.status === 'playing' ? 'plyCap' : game.status;
  const result = game.status === 'checkmate' ? (game.pos.turn === 0 ? 'black' : 'white') : 'draw';
  summary.push({ game: g, setup, result, reason, plies: game.history.length, themes: themeCounts });
  appendFileSync(OUT_JSONL, JSON.stringify({ game: g, setup, seed: SEED, depth: DEPTH, white: WHITE, black: BLACK, result, reason, plies: game.history.length, log }) + '\n');
  console.log(`jev-play: game ${g + 1}/${GAMES} setup ${setup} — ${result} by ${reason} in ${game.history.length} plies (${Object.entries(themeCounts).map(([t, n]) => `${t}:${n}`).join(' ')})`);
}

const scored = summary.filter(s => s.result !== 'draw');
const whiteWins = summary.filter(s => s.result === 'white').length;
const decisive = scored.length;
writeFileSync(`sim/out/jev-session-${STAMP}-${WHITE}-${BLACK}.summary.json`, JSON.stringify({ white: WHITE, black: BLACK, games: GAMES, depth: DEPTH, seed: SEED, whiteWins, draws: GAMES - decisive, decisive, meanPlies: summary.reduce((a, s) => a + s.plies, 0) / GAMES, jevCalls, jevDiffered, movesTotal, summary }, null, 2) + '\n');
console.log(`\njev-play: ${GAMES} games — white(${WHITE}) wins ${whiteWins}, draws ${GAMES - decisive}, mean plies ${(summary.reduce((a, s) => a + s.plies, 0) / GAMES).toFixed(0)}`);
console.log(`jev-play: ${jevCalls} Jev decisions, ${jevDiffered} differed from the engine (${(100 * jevDiffered / Math.max(1, jevCalls)).toFixed(0)}%), moves ${movesTotal}`);
console.log(`jev-play: wrote ${OUT_JSONL}`);
