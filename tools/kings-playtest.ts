/**
 * Playtest review of a kings' powers tournament: replays every game and says how each power was
 * actually used — what it touched, when, and the material swing over the next few plies — plus a
 * few example games per power to read. Run after `src/sim/tournament.ts`:
 *
 *   tsx tools/kings-playtest.ts --id kp2-base-d3 [--id ...] [--examples 2]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = pathToFileURL(process.cwd() + '/src/').href;
const { NAMES, legalMoves, makeMove, typeOf, colorOf } = await import(root + 'rules/engine.ts');
const { setRules } = await import(root + 'rules/rules.ts');
const { fromFen, toLan } = await import(root + 'rules/setup.ts');
const { VALUES } = await import(root + 'ai/eval.ts');
const { readRecords, gameSpec } = await import(root + 'sim/tournament.ts');

type Rec = {
  gameId: number; white: string; black: string; backRank: string; result: number; reason: string; plies: number;
  uses: [number, number]; lans: string[];
};

const argv = process.argv.slice(2);
const ids = argv.flatMap((a, i) => (a === '--id' ? [argv[i + 1]] : []));
const examples = Number(argv[argv.indexOf('--examples') + 1] || 2);
const HORIZON = 6; // plies after the use over which the material swing is read

/** Material from `c`'s side, pawns 1. */
const material = (board: Uint8Array, c: number): number => {
  let m = 0;
  for (const p of board) if (p && typeOf(p) !== 6) m += (colorOf(p) === c ? 1 : -1) * VALUES[typeOf(p)] / 100;
  return m;
};

interface Use { power: string; ply: number; lan: string; piece: string; target: string; swing: number; won: number }
const uses = new Map<string, Use[]>();
const games = new Map<string, Rec[]>();

for (const id of ids) {
  const spec = JSON.parse(readFileSync(`sim/out/${id}.tournament.json`, 'utf8'));
  for (const r of readRecords(id) as Rec[]) {
    // By entrant, so a rule variant (`Sacrifice~vbehind`) is reviewed apart from its base power.
    const sides = [r.white, r.black];
    // gameSpec, not gameRules: it adds a cards<k> round's dealt hands.
    setRules(gameSpec(spec, r).rules);
    let pos = fromFen(`${r.backRank.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/${r.backRank} w - - 0 1`);
    const boards: Uint8Array[] = [pos.board];
    const movers: number[] = [];
    const events: { ply: number; lan: string; side: number; piece: string; target: string }[] = [];
    for (let i = 0; i < r.lans.length; i++) {
      const m = legalMoves(pos).find((x: { power?: string }) => toLan(pos, x) === r.lans[i]);
      if (!m) { console.warn(`${id} game ${r.gameId}: ply ${i} (${r.lans[i]}) does not replay; the rest of that game is skipped`); break; }
      const side = pos.turn;
      if (m.power) {
        // A SkyLift's target is the piece it trades squares with; a Curse's piece is the enemy one it moved.
        const target = m.power === 'freeze' || m.power === 'ward' || m.power === 'skylift' ? NAMES[typeOf(pos.board[m.to])]
          : m.power === 'sacrifice' ? NAMES[m.promo] : m.captures.length ? m.captures.map((s: number) => NAMES[typeOf(pos.board[s])]).join('+') : '';
        events.push({ ply: i, lan: r.lans[i], side, piece: NAMES[typeOf(pos.board[m.from])], target });
      }
      movers.push(side);
      pos = makeMove(pos, m);
      boards.push(pos.board);
    }
    for (const e of events) {
      const power = sides[e.side];
      const before = material(boards[e.ply], e.side), after = material(boards[Math.min(boards.length - 1, e.ply + HORIZON)], e.side);
      const won = (e.side === 0 ? r.result : 1 - r.result);
      const list = uses.get(power) ?? [];
      list.push({ power, ply: e.ply, lan: e.lan, piece: e.piece, target: e.target, swing: after - before, won });
      uses.set(power, list);
    }
    for (const p of sides) { const g = games.get(p) ?? []; g.push(r); games.set(p, g); }
  }
}

const lines: string[] = [`# Playtest review: ${ids.join(' + ')}`, '',
  `For each power: how often it was used, when, on what, and the material swing for the user over the ${HORIZON} plies that followed (pawns). "Won" is the user's game score.`, ''];
const fmt = (x: number): string => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`;
const median = (a: number[]): number => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const tally = (xs: string[]): string => {
  const m = new Map<string, number>();
  for (const x of xs) if (x) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${v}`).join(', ') || '—';
};
for (const [power, list] of [...uses].sort((a, b) => a[0].localeCompare(b[0]))) {
  const g = games.get(power) ?? [];
  lines.push(`## ${power}`, '');
  lines.push(`- ${list.length} uses in ${g.length} games; first use median ply ${median(list.filter((u, i, all) => all.findIndex(v => v.lan === u.lan) === i).map(u => u.ply))}.`);
  lines.push(`- Moved or used: ${tally(list.map(u => u.piece))}. Touched: ${tally(list.map(u => u.target))}.`);
  lines.push(`- Material swing after a use: median ${fmt(median(list.map(u => u.swing)))}, mean ${fmt(list.reduce((a, u) => a + u.swing, 0) / list.length)}; uses that gained ≥ 2 pawns: ${list.filter(u => u.swing >= 2).length}.`);
  const sample = list.filter(u => u.swing >= 2).slice(0, examples).map(u => `\`${u.lan}\` at ply ${u.ply} (${fmt(u.swing)})`);
  if (sample.length) lines.push(`- Examples of a strong use: ${sample.join('; ')}.`);
  lines.push('');
}
const text = lines.join('\n') + '\n';
writeFileSync(`sim/out/${ids.join('+')}.playtest.md`, text);
console.log(text);
