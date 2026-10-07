#!/usr/bin/env -S npx tsx
/**
 * Guard strategies (docs/research/guard-strategies-2026-10-06.md): the probe files and the reports.
 *
 *   npx tsx tools/guard-probes.ts make
 *       writes sim/probes/E<k>-<w>.json (the shipped eval plus one term: E1–E6 at 30 and 80 cp, and
 *       E7, the flat Guard table) and the start files guard-b1.fens (RGBQKBNR) and guard-king.fens
 *       (RNBQKGNR: the Guard next to the king).
 *   npx tsx tools/guard-probes.ts probes --id gs-probe [--id ...]
 *       per probe entrant (`none@E1-30`, ...) against the plain engine: score, Elo, pawns, draws,
 *       length, and the pattern rate (share of positions in which the probe side's Guard shows the
 *       probe's pattern; the plain side's rate on the same games beside it).
 *   npx tsx tools/guard-probes.ts kd --id kd-rand [--id ...]
 *       king defence: the defender's score per arm (gin, gout, pawn, none), length, the plies a lost
 *       king survives, and the paired differences gin − none, gin − gout, gin − pawn.
 *
 *   npx tsx tools/guard-probes.ts gk --id guard-king
 *       asymmetric starts (tagged `--fens` lines, `none` mirror round): army A's score per tag, and
 *       each army's Guard activity.
 *
 * Elo from a score s: 400·log10(s / (1 − s)); pawns at 64 Elo a pawn (the depth-3 calibration, itself
 * ±25%). Intervals: ±1.96 standard errors over colour-swapped pairs (probes) or over positions (kd).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLACK, Color, G, WHITE, setRules, typeOf } from '../src/rules/engine';
import { fromFen } from '../src/rules/setup';
import { GP, evalParams, guardPatterns, setEvalParams } from '../src/ai/eval';
import { replayRecord } from '../src/sim/replay';
import { type TRecord, type TournamentSpec, readRecords } from '../src/sim/tournament';
import { OUT_DIR } from '../src/sim/spec';
import { fromTournament } from './piece-activity';
import { readFileSync } from 'node:fs';

const ELO_PER_PAWN = 64;
const PROBE_DIR = 'sim/probes';
const elo = (s: number): number => { const x = Math.min(0.999, Math.max(0.001, s)); return 400 * Math.log10(x / (1 - x)); };
const mean = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const se = (xs: readonly number[]): number => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1) / Math.max(1, xs.length));
};
const pct = (x: number): string => `${(100 * x).toFixed(1)}%`;
const sgn = (x: number, d = 0): string => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;

// ---------------------------------------------------------------------------------------------

export function make(dir = PROBE_DIR): string[] {
  setEvalParams();
  const shipped = evalParams();
  delete shipped.evaluator; // the linear eval, as shipped; absent means linear
  mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  const put = (name: string, guard: NonNullable<ReturnType<typeof evalParams>['guard']>): void => {
    const f = `${dir}/${name}.json`;
    writeFileSync(f, JSON.stringify({ ...shipped, guard }) + '\n');
    written.push(f);
  };
  for (let k = 1; k <= 6; k++) for (const w of [30, 80]) put(`E${k}-${w}`, { [`e${k}`]: w });
  put('E7', { e7: true });
  writeFileSync(`${dir}/guard-b1.fens`, '# The worth runs\' army: the Guard on b1 (RGBQKBNR), both sides.\nrgbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RGBQKBNR w - - 0 1\n');
  writeFileSync(`${dir}/guard-king.fens`, '# The Guard next to the king (f1/f8 in place of a bishop), both sides.\nrnbqkgnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKGNR w - - 0 1\n');
  written.push(`${dir}/guard-b1.fens`, `${dir}/guard-king.fens`);
  return written;
}

// ---------------------------------------------------------------------------------------------

function load(ids: readonly string[]): { t: TournamentSpec; recs: TRecord[] }[] {
  return ids.map(id => {
    const t = JSON.parse(readFileSync(`${OUT_DIR}/${id}.tournament.json`, 'utf8')) as TournamentSpec;
    return { t, recs: readRecords(id) };
  });
}

/** The probe's bit in `guardPatterns`, from an entrant such as `none@E3-80` or `none@E7`. */
const probeBit = (e: string): number => {
  const m = /@E(\d)/.exec(e);
  return m ? GP[`E${m[1]}` as keyof typeof GP] : 0;
};

/** Share of positions (after each ply) in which `c`'s Guards show pattern `bit`. */
function patternRate(t: TournamentSpec, r: TRecord, bit: number, c: Color): [number, number] {
  const g = fromTournament(r, t, '');
  setRules(g.rules);
  let hit = 0, n = 0;
  replayRecord({ gameId: g.gameId, startFen: g.startFen, moves: g.lans.map(lan => ({ lan })) }, (_p, _m, next) => {
    n++;
    if (guardPatterns(next.board, c) & bit) hit++;
  });
  return [hit, n];
}

export function probesReport(ids: readonly string[]): string {
  const out = [`# Guard probes: ${ids.join(' + ')}`, '',
    `Each probe side (\`<entrant>@<probe>\`) against the plain engine, colour-swapped pairs. Elo from the score; pawns at ${ELO_PER_PAWN} Elo a pawn. Pattern rate: share of positions where the side's Guard shows the probe's pattern (E7: the Guard beyond its second rank); "plain" is the other side's rate in the same games.`, '',
    '| run | probe | score | ±95% | Elo | pawns | ±95% | draws | plies | pattern rate | plain | pairs |', '|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const { t, recs } of load(ids)) {
    const probes = t.entrants.filter(e => e.includes('@'));
    for (const e of probes) {
      const bit = probeBit(e);
      const games = recs.filter(r => (r.white === e) !== (r.black === e) && !(r.white.includes('@') && r.black.includes('@')));
      const byPair = new Map<number, number[]>();
      let draws = 0, plies = 0, hit = 0, n = 0, hitO = 0, nO = 0;
      for (const r of games) {
        const c: Color = r.white === e ? WHITE : BLACK;
        const s = c === WHITE ? r.result : 1 - r.result;
        (byPair.get(r.pairId) ?? byPair.set(r.pairId, []).get(r.pairId)!).push(s);
        if (r.result === 0.5) draws++;
        plies += r.plies;
        if (bit) {
          const [h, k] = patternRate(t, r, bit, c), [ho, ko] = patternRate(t, r, bit, (c ^ 1) as Color);
          hit += h; n += k; hitO += ho; nO += ko;
        }
      }
      const pm = [...byPair.values()].map(mean), m = mean(pm), w = 1.96 * se(pm);
      const pw = (elo(Math.min(0.999, m + w)) - elo(Math.max(0.001, m - w))) / 2 / ELO_PER_PAWN;
      out.push(`| ${t.id} | ${e} | ${pct(m)} | ${(100 * w).toFixed(1)} | ${sgn(elo(m))} | ${sgn(elo(m) / ELO_PER_PAWN, 2)} | ${pw.toFixed(2)} | ${pct(draws / Math.max(1, games.length))} | ${(plies / Math.max(1, games.length)).toFixed(0)} | ${n ? pct(hit / n) : '-'} | ${nO ? pct(hitO / nO) : '-'} | ${pm.length} |`);
    }
  }
  setRules();
  return out.join('\n') + '\n';
}

// ---------------------------------------------------------------------------------------------

/** `p<i>:<arm>:<variant>` → its parts. */
const parseTag = (tag: string | undefined): { pos: string; arm: string; variant: string } | null => {
  const m = /^(p\d+):(\w+):(\w*)$/.exec(tag ?? '');
  return m ? { pos: m[1], arm: m[2], variant: m[3] } : null;
};

export function kdReport(ids: readonly string[]): string {
  const arms = ['gin', 'gout', 'pawn', 'none'];
  const out = [`# King defence: ${ids.join(' + ')}`, '',
    `The defender's score from each start position (the attacker to move), each played with the defender as White and, mirrored, as Black. Elo from the score; pawns at ${ELO_PER_PAWN} Elo a pawn. "Lost at" is the mean game length of the defender's losses (how long the king survives).`, ''];
  for (const { t, recs } of load(ids)) {
    // Per position and arm, the defender's scores; and lengths.
    const by = new Map<string, Map<string, number[]>>();
    const len = new Map<string, number[]>(), lost = new Map<string, number[]>(), draws = new Map<string, number>(), n = new Map<string, number>();
    const variants = new Map<string, string>();
    for (const r of recs) {
      const tag = parseTag(r.tag);
      if (!tag || !r.fen) continue;
      const def: Color = fromFen(r.fen).turn === WHITE ? BLACK : WHITE;
      const s = def === WHITE ? r.result : 1 - r.result;
      const m = by.get(tag.pos) ?? by.set(tag.pos, new Map()).get(tag.pos)!;
      (m.get(tag.arm) ?? m.set(tag.arm, []).get(tag.arm)!).push(s);
      variants.set(tag.pos, tag.variant);
      (len.get(tag.arm) ?? len.set(tag.arm, []).get(tag.arm)!).push(r.plies);
      if (s === 0) (lost.get(tag.arm) ?? lost.set(tag.arm, []).get(tag.arm)!).push(r.plies);
      if (r.result === 0.5) draws.set(tag.arm, (draws.get(tag.arm) ?? 0) + 1);
      n.set(tag.arm, (n.get(tag.arm) ?? 0) + 1);
    }
    out.push(`## ${t.id} (${by.size} positions, ${recs.length} games)`, '',
      '| arm | defender score | ±95% | Elo | draws | plies | lost at (plies) | games |', '|---|---|---|---|---|---|---|---|');
    for (const a of arms) {
      const xs = [...by.values()].flatMap(m => (m.has(a) ? [mean(m.get(a)!)] : []));
      if (!xs.length) continue;
      const m = mean(xs);
      out.push(`| ${a} | ${pct(m)} | ${(196 * se(xs)).toFixed(1)} | ${sgn(elo(m))} | ${pct((draws.get(a) ?? 0) / n.get(a)!)} | ${mean(len.get(a)!).toFixed(0)} | ${lost.has(a) ? mean(lost.get(a)!).toFixed(0) : '-'} | ${n.get(a)} |`);
    }
    out.push('', '| difference | score | ±95% | Elo | pawns | ±95% (pawns) | positions |', '|---|---|---|---|---|---|---|');
    const diff = (x: string, label: string, only?: string): void => {
      const pairs = [...by.entries()].filter(([p, m]) => m.has('gin') && m.has(x) && (!only || variants.get(p) === only)).map(([, m]) => [mean(m.get('gin')!), mean(m.get(x)!)]);
      if (!pairs.length) return;
      const d = pairs.map(([g, o]) => g - o), dm = mean(d), w = 1.96 * se(d);
      const sg = mean(pairs.map(p => p[0])), so = mean(pairs.map(p => p[1]));
      // The difference in Elo, and its interval through the slope of the Elo curve at the gin score.
      const de = elo(sg) - elo(so), slope = (elo(Math.min(0.999, sg + 0.01)) - elo(Math.max(0.001, sg - 0.01))) / 0.02;
      const dw = (w * slope) / ELO_PER_PAWN;
      out.push(`| ${label} | ${sgn(100 * dm, 1)} pts | ${(100 * w).toFixed(1)} | ${sgn(de)} | ${sgn(de / ELO_PER_PAWN, 2)} | ${dw.toFixed(2)} | ${pairs.length} |`);
    };
    diff('none', 'gin − none (the Guard\'s defensive worth)');
    diff('gout', 'gin − gout (the share from the square)');
    diff('pawn', 'gin − pawn (against the cheapest blocker)');
    for (const v of ['front', 'beside', 'interpose']) diff('none', `gin − none, ${v} only`, v);
  }
  return out.join('\n') + '\n';
}

// ---------------------------------------------------------------------------------------------

/**
 * Asymmetric starts (`--fens` lines with tags, `none` mirror round): per tag, the score of the army
 * that is White on the line (Black in the mirrored game), folded over each colour-swapped pair, in
 * Elo and pawns; and each army's Guard activity: share of games in which its Guard moves, and its
 * Guard moves per game.
 */
export function gkReport(ids: readonly string[]): string {
  const out = [`# Asymmetric starts: ${ids.join(' + ')}`, '',
    `Score of army A (White on the start line) against army B, folded over colour-swapped pairs (the second game starts from the mirrored board). Pawns at ${ELO_PER_PAWN} Elo a pawn. Guard moves: share of games in which that army's Guard moves at least once (random opening plies included), and Guard moves per game.`, '',
    '| run | tag | A | B | score A | ±95% | Elo | pawns | ±95% (pawns) | draws | plies | A Guard moved | A Guard moves/game | B Guard moved | B Guard moves/game | pairs |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const { t, recs } of load(ids)) {
    const by = new Map<string, TRecord[]>();
    for (const r of recs) if (r.fen) (by.get(r.tag ?? '-') ?? by.set(r.tag ?? '-', []).get(r.tag ?? '-')!).push(r);
    for (const [tag, rs] of by) {
      const byPair = new Map<number, number[]>();
      const moved = [0, 0], moves = [0, 0];
      let draws = 0, plies = 0, aRank = '', bRank = '';
      for (const r of rs) {
        // A pair's first game (even id) starts from the line itself; its second from the mirror.
        const aWhite = r.gameId % 2 === 0;
        const ranks = r.fen!.split(' ')[0].split('/');
        if (aWhite) { aRank = ranks[7]; bRank = ranks[0].toUpperCase(); }
        const a: Color = aWhite ? WHITE : BLACK;
        (byPair.get(r.pairId) ?? byPair.set(r.pairId, []).get(r.pairId)!).push(a === WHITE ? r.result : 1 - r.result);
        if (r.result === 0.5) draws++;
        plies += r.plies;
        const g = fromTournament(r, t, '');
        setRules(g.rules);
        const n = [0, 0];
        replayRecord({ gameId: g.gameId, startFen: g.startFen, moves: g.lans.map(lan => ({ lan })) }, (pos, m) => {
          if (typeOf(pos.board[m.from]) === G) n[pos.turn]++;
        });
        for (const side of [0, 1]) {
          const army = side === a ? 0 : 1;
          moves[army] += n[side];
          if (n[side]) moved[army]++;
        }
      }
      const pm = [...byPair.values()].map(mean), m = mean(pm), w = 1.96 * se(pm);
      const pw = (elo(Math.min(0.999, m + w)) - elo(Math.max(0.001, m - w))) / 2 / ELO_PER_PAWN;
      const k = rs.length || 1;
      out.push(`| ${t.id} | ${tag} | ${aRank} | ${bRank} | ${pct(m)} | ${(100 * w).toFixed(1)} | ${sgn(elo(m))} | ${sgn(elo(m) / ELO_PER_PAWN, 2)} | ${pw.toFixed(2)} | ${pct(draws / k)} | ${(plies / k).toFixed(0)} | ${pct(moved[0] / k)} | ${(moves[0] / k).toFixed(1)} | ${pct(moved[1] / k)} | ${(moves[1] / k).toFixed(1)} | ${pm.length} |`);
    }
  }
  setRules();
  return out.join('\n') + '\n';
}

// ---------------------------------------------------------------------------------------------

if (process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  const [cmd, ...rest] = process.argv.slice(2);
  const ids = rest.flatMap((a, i) => (a === '--id' ? [rest[i + 1]] : []));
  if (cmd === 'make') console.log(make().join('\n'));
  else if ((cmd === 'probes' || cmd === 'kd' || cmd === 'gk') && ids.length) {
    const text = cmd === 'probes' ? probesReport(ids) : cmd === 'kd' ? kdReport(ids) : gkReport(ids);
    writeFileSync(`${OUT_DIR}/${ids.join('+')}.${cmd}.report.md`, text);
    process.stdout.write(text);
  } else {
    console.error('usage: guard-probes.ts make | probes --id <id> ... | kd --id <id> ... | gk --id <id> ...');
    process.exitCode = 1;
  }
}

