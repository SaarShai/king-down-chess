/** Bounded UCI comparison. Refuse any action the shared test cannot represent. */
import { spawn, type ChildProcessWithoutNullStreams, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Game } from '../src/game';
import { LETTERS, legalMoves, sqName, type Move } from '../src/rules/engine';
import { fromFen, toFen } from '../src/rules/setup';
import { DEFAULT_RULES, RULES, setRules } from '../src/rules/rules';
import { positionKey, resetSearchState, search, setEvaluator } from '../src/ai/search';
import { evalParams } from '../src/ai/eval';
import { sourceId } from '../src/sim/identity';

export function toUci(m: Move): string {
  if (m.from === m.to || m.swap || m.shove || m.selfRemove || m.power || m.pushes || m.via || m.pass
      || m.drop != null || m.drop2 != null || m.captures.length > 1 || m.captures.some(s => s !== m.to)) {
    throw new Error('Action is outside the shared UCI subset');
  }
  const promotion = m.promo == null ? '' : LETTERS[m.promo].toLowerCase();
  if (promotion && !'qrbn'.includes(promotion)) throw new Error('Unsupported promotion');
  return sqName(m.from) + sqName(m.to) + promotion;
}

export function sameMoves(expected: string[], actual: string[]): void {
  if (new Set(expected).size !== expected.length || new Set(actual).size !== actual.length) throw new Error('Duplicate move');
  const a = [...expected].sort(), b = [...actual].sort();
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(JSON.stringify({ missing: a.filter(m => !b.includes(m)), extra: b.filter(m => !a.includes(m)) }));
}

export class Uci {
  private child: ChildProcessWithoutNullStreams;
  private buffer = '';
  private pending: { lines: string[]; end: (s: string) => boolean; done: (lines: string[]) => void; fail: (e: Error) => void } | null = null;
  private dead = false;
  constructor(binary: string, config: string) {
    this.child = spawn(binary, ['load', config], { stdio: 'pipe' });
    this.child.stdout.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString();
      let i: number;
      while ((i = this.buffer.indexOf('\n')) >= 0) {
        const line = this.buffer.slice(0, i).trim();
        this.buffer = this.buffer.slice(i + 1);
        const p = this.pending;
        if (p) { p.lines.push(line); if (p.end(line)) p.done(p.lines); }
      }
    });
    this.child.stderr.on('data', (b: Buffer) => { appendFileSync(this.stderrPath, b); });
    this.child.on('error', e => { this.dead = true; this.pending?.fail(e); });
    this.child.on('exit', () => { this.dead = true; this.pending?.fail(new Error('Engine exited')); });
  }
  stderrPath = '/dev/null';
  async query(command: string, end: (s: string) => boolean, timeout = 5000): Promise<string[]> {
    if (this.pending || this.dead) throw new Error('Engine is busy or stopped');
    return new Promise((done, fail) => {
      const timer = setTimeout(() => { this.close(); fail(new Error(`UCI timeout: ${command}`)); }, timeout);
      const finish = (): void => { clearTimeout(timer); this.pending = null; };
      this.pending = { lines: [], end, done: lines => { finish(); done(lines); }, fail: e => { finish(); fail(e); } };
      this.child.stdin.write(command + '\n');
    });
  }
  async ready(command = ''): Promise<string[]> { return this.query(command + '\nisready', s => s === 'readyok'); }
  async moves(): Promise<string[]> {
    const lines = await this.query('go perft 1', s => s.startsWith('Nodes searched:'));
    return lines.flatMap(s => { const m = s.match(/^([a-h][1-8][a-h][1-8][qrbn]?):\s+1$/); return m ? [m[1]] : []; });
  }
  async fen(): Promise<string> {
    const lines = await this.ready('d');
    const line = lines.find(s => s.startsWith('Fen: '));
    if (!line) throw new Error('No engine FEN');
    return line.slice(5);
  }
  close(): void { if (!this.dead) { this.child.stdin.end('quit\n'); this.child.kill(); } }
}

const hash = (path: string): string => createHash('sha256').update(readFileSync(path)).digest('hex');
const json = (path: string, data: unknown): void => writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
const boardState = (fen: string): string => { const x = fen.split(' '); return [x[0].replace(/\[\]/g, ''), x[1], x[4], x[5]].join(' '); };
const initial = (beast: boolean): string => `${beast ? 'rsbqkbsr' : 'rnbqkbnr'}/pppppppp/8/8/8/8/PPPPPPPP/${beast ? 'RSBQKBSR' : 'RNBQKBNR'} w - - 0 1`;

async function run(binary: string, out: string): Promise<void> {
  if (existsSync(resolve(out, 'spec.json'))) throw new Error('Output already exists; never repeat a run');
  mkdirSync(out, { recursive: true });
  const config = resolve('tools/fairy-stockfish.ini');
  setEvaluator('residual'); // Same evaluator as src/ai/worker.ts, not the simulator default.
  const spec = {
    name: 'fairy-stockfish-smoke-20261011', games: 8, timeMs: 60, maxPlies: 300, threads: 1, hashMiB: 16,
    approval: { date: '2026-10-11', quote: 'i want us to test fairy stockfish ... and see how it fairs against what we currently have.' },
    source: sourceId(), git: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    fairyCommit: '9f778da667f6e07dae1e85d3e2ea204fc6dee94d', binarySha256: hash(binary), configSha256: hash(config),
    harnessSha256: hash('tools/fairy-stockfish-smoke.ts'), nnueSha256: hash('src/ai/nnue/weights.ts'),
    kdEvaluator: 'residual', fairyNnue: false, eval: evalParams(),
    rules: { ...DEFAULT_RULES },
    profiles: ['ordinary', 'beast-one-capture-lab'], openings: [['e2e4', 'e7e5', 'g1f3', 'b8c6'], ['d2d4', 'd7d5', 'c2c4', 'e7e6']],
    limits: 'Smoke only. Equal nominal wall time; native code versus TypeScript. No full-game compatibility or Elo claim. Caps are censored.'
  };
  json(resolve(out, 'spec.json'), spec);
  const fs = new Uci(binary, config); fs.stderrPath = resolve(out, 'stderr.log');
  try {
    const protocol = await fs.query('uci', s => s === 'uciok');
    if (!protocol.some(s => s.startsWith('id name Fairy-Stockfish'))) throw new Error('Wrong binary');
    json(resolve(out, 'uci.json'), protocol);
    await fs.ready('setoption name Threads value 1\nsetoption name Hash value 16\nsetoption name Use NNUE value false\nsetoption name Move Overhead value 0');
    const fixtures = [
      { name: 'start', beast: false, fen: initial(false) },
      { name: 'pin', beast: false, fen: '4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1' },
      { name: 'promotion', beast: false, fen: '4k3/P7/8/8/8/8/7p/4K3 w - - 0 1' },
      { name: 'beast-capture', beast: true, fen: '4k3/8/8/4p3/3S4/8/8/4K3 w - - 0 1' }
    ];
    const checks: unknown[] = [];
    for (const fixture of fixtures) {
      setRules({ ...spec.rules, beastChains: !fixture.beast });
      await fs.ready(`setoption name UCI_Variant value ${fixture.beast ? 'kdbeast' : 'kdshared'}\nposition fen ${fixture.fen}`);
      const moves = legalMoves(fromFen(fixture.fen)).map(toUci);
      sameMoves(moves, await fs.moves());
      checks.push({ ...fixture, count: moves.length, pass: true });
    }
    // Positive and negative controls: the bridge must reject genuine King Down actions.
    setRules({ ...spec.rules, beastChains: true });
    const chain = legalMoves(fromFen('4k3/8/8/8/3Spp2/8/8/4K3 w - - 0 1')).find(m => m.captures.length === 2);
    const shot = legalMoves(fromFen('4k3/8/3p4/8/3A4/8/8/4K3 w - - 0 1')).find(m => m.from === m.to && m.captures.length);
    for (const [name, move] of [['chain', chain], ['shot', shot]] as const) {
      if (!move) throw new Error(`Missing ${name} control`);
      let rejected = false; try { toUci(move); } catch { rejected = true; }
      if (!rejected) throw new Error('Unsupported action accepted');
      checks.push({ name, rejected, move });
    }
    json(resolve(out, 'preflight.json'), checks);
    let id = 0;
    for (const beast of [false, true]) {
      setRules({ ...spec.rules, beastChains: !beast });
      for (let opening = 0; opening < 2; opening++) for (const fairyWhite of [true, false]) {
        const fen = initial(beast), game = new Game(); game.load(fromFen(fen));
        const history = [positionKey(game.pos)], moves: string[] = [], trace: unknown[] = [];
        resetSearchState();
        await fs.ready(`setoption name UCI_Variant value ${beast ? 'kdbeast' : 'kdshared'}\nucinewgame`);
        const sync = async (): Promise<void> => {
          await fs.ready(`position fen ${fen}${moves.length ? ' moves ' + moves.join(' ') : ''}`);
          sameMoves(game.legal.map(toUci), await fs.moves());
          const actual = await fs.fen();
          if (boardState(toFen(game.pos)) !== boardState(actual)) throw new Error(`State mismatch ${toFen(game.pos)} <> ${actual}`);
        };
        await sync();
        const prefix = spec.openings[opening].slice(0, beast && opening === 0 ? 2 : 4);
        for (const uci of prefix) {
          const m = game.legal.find(m => toUci(m) === uci); if (!m) throw new Error('Illegal opening');
          game.play(m); moves.push(uci); history.push(positionKey(game.pos)); await sync();
        }
        while (game.status === 'playing' && moves.length < spec.maxPlies) {
          const fairy = (game.pos.turn === 0) === fairyWhite;
          const start = performance.now(); let chosen: string; let info: unknown;
          if (fairy) {
            const lines = await fs.query(`go movetime ${spec.timeMs}`, s => s.startsWith('bestmove '));
            chosen = lines[lines.length - 1].split(' ')[1]; info = lines.filter(s => s.startsWith('info depth ')).slice(-1);
          } else {
            const result = search(game.pos, { timeMs: spec.timeMs, maxDepth: 62, history, multiPv: 1, temperature: 0 });
            if (!result.move) throw new Error('No KD move');
            chosen = toUci(result.move); info = { depth: result.depth, nodes: result.nodes, score: result.score };
          }
          const elapsedMs = performance.now() - start;
          const move = game.legal.find(m => toUci(m) === chosen);
          if (!move) throw new Error(`Illegal engine move ${chosen}`);
          trace.push({ ply: moves.length, side: game.pos.turn, engine: fairy ? 'fairy' : 'kingdown', move: chosen, elapsedMs, info });
          game.play(move); moves.push(chosen); history.push(positionKey(game.pos)); await sync();
        }
        const capped = game.status === 'playing';
        const winner = game.status === 'checkmate' ? 1 - game.pos.turn : null;
        const record = { id: id++, profile: beast ? 'beast-one-capture-lab' : 'ordinary', opening, fairyWhite, fen, rules: RULES, moves, trace, terminalFen: toFen(game.pos), status: game.status, capped, winner, fairyScore: capped ? null : winner == null ? .5 : (winner === 0) === fairyWhite ? 1 : 0, legalSetChecks: moves.length + 1 };
        appendFileSync(resolve(out, 'games.jsonl'), JSON.stringify(record) + '\n');
        console.log(JSON.stringify({ id: record.id, profile: record.profile, fairyWhite, plies: moves.length, status: game.status, fairyScore: record.fairyScore }));
      }
    }
    json(resolve(out, 'complete.json'), { games: id, finishedAt: new Date().toISOString() });
  } finally { fs.close(); setRules(DEFAULT_RULES); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [binary, out] = process.argv.slice(2);
  if (!binary || !out) throw new Error('Usage: tsx tools/fairy-stockfish-smoke.ts <binary> <new-output-directory>');
  run(resolve(binary), resolve(out)).catch(e => { console.error(e); process.exitCode = 1; });
}
