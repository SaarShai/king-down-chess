/** Timed differential rules testing. Each worker owns one deterministic seed stream. */
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Game } from '../src/game';
import { inCheck, isAttacked, makeMove, status, TAG_POWER, type Position } from '../src/rules/engine';
import { ALL_CARDS, BUILT, DEFAULT_RULES, KINGS, POWERS_BALANCED, RULES, setRules, type CardName, type KingName, type Rules } from '../src/rules/rules';
import { fromFen, randomBackRank, startPosition, toFen } from '../src/rules/setup';
import { sourceId } from '../src/sim/identity';
import { configureFull, fullAction, fullActions, fullTurns } from './fairy-stockfish-full';
import { fullFixtures } from './fairy-stockfish-full-check';
import { sameMoves, Uci } from './fairy-stockfish-smoke';

const must = (ok: unknown, message: string): void => { if (!ok) throw Error(message); };
const hash = (data: string | Buffer): string => createHash('sha256').update(data).digest('hex');
const save = (path: string, value: unknown): void => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');

export function checkInspection(lines: string[], pos: Position, whole: boolean, historyDraw: boolean): number {
  must(lines.includes('fen ' + toFen(pos)), 'FEN differs');
  must(lines.includes('check ' + Number(inCheck(pos))), 'Check differs');
  const terminal = status(pos);
  must(lines.includes('status ' + ['playing', 'checkmate', 'stalemate', 'draw50', 'drawMaterial'].indexOf(terminal)), 'Status differs');
  must(lines.includes('historydraw 0') || lines.includes('historydraw 1'), 'History draw differs');
  // Stalemate is already a draw; optional claims do not decide its status name.
  if (terminal !== 'stalemate')
    must(lines.includes('historydraw ' + Number(historyDraw)), 'History draw differs');
  for (const side of [0, 1] as const) {
    let attacks = 0n;
    for (let sq = 0; sq < 64; sq++) if (isAttacked(pos.board, sq, side)) attacks |= 1n << BigInt(sq);
    must(lines.includes(`attack ${side} ${attacks.toString(16)}`), 'Attacks differ: ' + side);
  }
  const expected = whole ? fullTurns(pos) : new Map([...fullActions(pos)].map(([token, move]) => [token, makeMove(pos, move)]));
  const effects = lines.filter(line => line.startsWith('effect ')).map(line => {
    const end = line.indexOf(' ', 7); return [line.slice(7, end), line.slice(end + 1)] as const;
  });
  sameMoves([...expected.keys()], effects.map(([token]) => token));
  const actual = new Map(effects);
  for (const [token, child] of expected) {
    must(actual.get(token) === toFen(child), 'Child FEN differs: ' + token);
    must(lines.includes('childcheck ' + token + ' ' + Number(inCheck(child))), 'Child check differs: ' + token);
  }
  must(lines.at(-1) === 'kdinspectok ' + expected.size, 'Inspection count differs');
  return expected.size;
}

export async function stress(binary: string, out: string, seed: number, seconds: number): Promise<void> {
  must(Number.isSafeInteger(seed) && seed > 0 && Number.isFinite(seconds) && seconds > 0 && seconds <= 7200, 'Invalid seed or time budget');
  must(!existsSync(out), 'Output exists; preserve it'); mkdirSync(out, { recursive: true });
  const began = Date.now(), until = began + seconds * 1000;
  const identity = { sourceId: sourceId(), binarySha256: hash(readFileSync(binary)), patchSha256: hash(readFileSync('tools/fairy-stockfish/kingdown.patch')) };
  const fixtures = fullFixtures();
  let rng = seed >>> 0;
  const rand = (n: number): number => { rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return Math.floor(rng / 4294967296 * n); };
  const pick = <T>(items: readonly T[]): T => items[rand(items.length)];
  const king = (power: typeof BUILT[number]): NonNullable<Rules['kings'][0]> => ({ king: Object.keys(KINGS).find(k => KINGS[k as KingName].includes(power)) as KingName, power });
  const native = new Uci(binary, resolve('tools/fairy-stockfish.ini')); native.stderrPath = resolve(out, 'stderr.log');
  const coverage = new Set<string>(); let positions = 0, effects = 0, turns = 0, traces = 0, undos = 0;
  let current: unknown = null, chain = '', stopped = false;
  const stop = (): void => { stopped = true; }; process.on('SIGTERM', stop);
  const snapshot = (): object => ({ seed, seconds, ...identity, positions, effects, turns, traces, undos, coverage: [...coverage].sort(), chain, elapsedSeconds: (Date.now() - began) / 1000 });
  save(resolve(out, 'spec.json'), { seed, seconds, ...identity, maxTraceActions: 400, completeTurnEvery: 8, distribution: 'Half directed fixtures, half fresh armies; kings or cards; power-biased legal actions. Four distinct seeded streams, not statistical samples.' });
  try {
    await native.query('uci', line => line === 'uciok');
    await native.ready('setoption name Threads value 1\nsetoption name Hash value 16\nsetoption name Use NNUE value false');
    while (!stopped && Date.now() < until) {
      const trace = traces++, traceSeed = rng;
      const fixture = pick(fixtures);
      let rules = fixture.rules, start = toFen(fixture.pos), name = fixture.name;
      if (trace % 2) {
        rules = { ...DEFAULT_RULES, ...(rand(2) ? POWERS_BALANCED : {}) };
        if (rand(2)) rules.kings = [king(pick(BUILT)), king(pick(BUILT))];
        else {
          const hand = (): CardName[] => Array.from({ length: rand(2) ? 4 : 8 }, () => pick(ALL_CARDS));
          rules.hands = [hand(), hand()]; rules.piles = [Array.from({ length: 8 }, () => pick(ALL_CARDS)), Array.from({ length: 8 }, () => pick(ALL_CARDS))];
          rules.fromMove = { [pick(ALL_CARDS)]: 3 + rand(4) };
        }
        setRules(rules); start = toFen(startPosition(randomBackRank(() => rand(0x1000000) / 0x1000000))); name = 'fresh-army';
      }
      setRules(rules); await configureFull(native);
      for (const power of rules.kings) if (power) coverage.add('king:' + power.power);
      for (const card of [...rules.hands.flat(), ...rules.piles.flat()]) coverage.add('dealt:' + card);
      const game = new Game(); game.load(fromFen(start)); const tokens: string[] = [];
      for (let step = 0; step <= 400 && !stopped && Date.now() < until; step++) {
        current = { trace, traceSeed, name, step, start, rules: RULES, tokens: [...tokens], fen: toFen(game.pos), status: game.status };
        save(resolve(out, 'current.json'), current);
        await native.ready('position fen ' + start + (tokens.length ? ' moves ' + tokens.join(' ') : ''));
        const inspect = async (whole: boolean): Promise<void> => {
          const lines = await native.query(whole ? 'kdturninspect' : 'kdinspect', line => line.startsWith('kdinspectok'), 60000);
          writeFileSync(resolve(out, 'last-inspection.txt'), lines.join('\n') + '\n');
          const count = checkInspection(lines, game.pos, whole, game.status.startsWith('draw'));
          if (positions === 0 && !whole) {
            for (const corrupted of [lines.map(line => line.startsWith('fen ') ? 'fen wrong' : line), lines.map(line => line.startsWith('historydraw ') ? 'historydraw wrong' : line), lines.map(line => line.startsWith('kdinspectok ') ? 'kdinspectok -1' : line)]) {
              let rejected = false; try { checkInspection(corrupted, game.pos, false, game.status.startsWith('draw')); } catch { rejected = true; }
              must(rejected, 'Altered-output control was accepted');
            }
            save(resolve(out, 'instrument-controls.json'), { positive: true, alteredFen: true, alteredHistory: true, alteredCount: true });
          }
          if (whole) turns += count; else effects += count;
          chain = hash(chain + hash(lines.join('\n')));
        };
        await inspect(false); if (step % 8 === 0) await inspect(true);
        positions++;
        if (positions % 100 === 0) save(resolve(out, 'progress.json'), snapshot());
        if (game.status !== 'playing' || step === 400) break;
        const moves = game.legal;
        for (const move of moves) if (move.power) coverage.add('available:' + TAG_POWER[move.power] + (move.via ? ':' + move.via : ''));
        const powers = moves.filter(move => move.power), pool = powers.length && rand(3) !== 0 ? powers : moves;
        const move = pick(pool), token = fullAction(game.pos, move), before = toFen(game.pos), priorStatus = game.status;
        if (move.power) coverage.add('played:' + TAG_POWER[move.power] + (move.via ? ':' + move.via : ''));
        game.play(move);
        if (step % 7 === 0) {
          must(game.undo() && toFen(game.pos) === before && game.status === priorStatus, 'Reference undo differs'); undos++; game.play(move);
        }
        tokens.push(token);
      }
      appendFileSync(resolve(out, 'traces.jsonl'), JSON.stringify({ trace, traceSeed, name, start, rules, tokens, final: toFen(game.pos), status: game.status }) + '\n');
    }
    save(resolve(out, 'complete.json'), { ...snapshot(), pass: true, stopped });
  } catch (error) {
    save(resolve(out, 'failure.json'), { ...snapshot(), current, error: String(error), stack: error instanceof Error ? error.stack : null }); throw error;
  } finally { process.off('SIGTERM', stop); native.close(); setRules(DEFAULT_RULES); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) stress(resolve(process.argv[2]), resolve(process.argv[3]), Number(process.argv[4]), Number(process.argv[5])).catch(error => { console.error(error); process.exitCode = 1; });
