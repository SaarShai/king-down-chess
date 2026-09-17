// Static results dashboard: reads sim/out/* and writes docs/dashboard/index.html (one self-contained page).
// Usage: npm run dashboard
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, createReadStream } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const OUT = join(root, 'sim/out');
const DEST = join(root, 'docs/dashboard');
const PRIORS = { A: 3.5, L: 4.0, G: 2.0, M: 3.5, S: 2.2 };          // fairy-values.md §9
const PIECE_NAME = { A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast' };

// ---------------------------------------------------------------- load
const files = readdirSync(OUT);
const jread = f => JSON.parse(readFileSync(join(OUT, f), 'utf8'));
const mtime = f => statSync(join(OUT, f)).mtime;

const summaries = files.filter(f => f.endsWith('.summary.json'))
  .map(f => ({ id: f.slice(0, -13), date: mtime(f), ...jread(f) }))
  .sort((a, b) => a.date - b.date);
const reports = files.filter(f => f.endsWith('.report.json'))
  .map(f => ({ id: f.slice(0, -12), date: mtime(f), ...jread(f) }))
  .sort((a, b) => a.id.localeCompare(b.id));
const experiments = files.filter(f => f.endsWith('.experiment.md'))
  .map(f => ({ id: f.slice(0, -14), date: mtime(f), md: readFileSync(join(OUT, f), 'utf8') }))
  .sort((a, b) => a.id.localeCompare(b.id));

const kindOf = id => /^values/.test(id) ? 'piece values' : /^sweep/.test(id) ? 'sweep round'
  : /^ab-/.test(id) ? 'rule A/B' : 'baseline';

/** Markdown pipe tables, keyed by the heading above them. */
const mdTables = md => {
  const out = []; let cur = null, heading = '';
  for (const ln of md.split('\n')) {
    if (ln.startsWith('#')) { heading = ln.replace(/^#+\s*/, ''); cur = null; continue; }
    if (/^\s*\|/.test(ln)) {
      const cells = ln.trim().split('|').slice(1, -1).map(s => s.trim());
      if (cells.every(c => /^:?-{2,}:?$/.test(c))) continue;
      if (!cur) { cur = { heading, head: cells, rows: [] }; out.push(cur); } else cur.rows.push(cells);
    } else cur = null;
  }
  return out;
};
/** "+0.037 ± 0.029" -> {v, e}; "< 1.70 **" -> {bound}; plain number -> {v}. */
const pm = s => {
  const b = /^<\s*([\d.]+)/.exec(s); if (b) return { bound: +b[1], capped: true };
  const m = /^([+-]?[\d.]+)\s*(?:±|\+\/-)\s*([\d.]+)/.exec(s); if (m) return { v: +m[1], e: +m[2] };
  const n = /^([+-]?[\d.]+)/.exec(s); return n ? { v: +n[1] } : {};
};

// Current engine values, straight out of the eval source (read-only).
const evalSrc = readFileSync(join(root, 'src/ai/eval.ts'), 'utf8');
const seedCp = k => +(new RegExp(`${k}_V\\s*=\\s*(\\d+)`).exec(evalSrc)?.[1] ?? NaN);
const SEEDS = { A: seedCp('ARCHER'), L: seedCp('PALADIN'), G: seedCp('GUARD'), M: seedCp('MAESTER'), S: seedCp('BEAST') };
const PAWN_CP = seedCp('PAWN') || 100;

// Game lengths: the JSONL is the only per-game source, so stream it and pull one field.
const BIN = 20, BINS = 15;
const hist = new Array(BINS).fill(0); let histGames = 0;
for (const f of files.filter(f => f.endsWith('.jsonl'))) {
  let carry = '';
  for await (const chunk of createReadStream(join(OUT, f), { encoding: 'latin1' })) {
    const s = carry + chunk;
    for (const m of s.matchAll(/"plies":(\d+)/g)) { hist[Math.min(BINS - 1, Math.floor(+m[1] / BIN))]++; histGames++; }
    carry = s.slice(-16);
  }
}

// ---------------------------------------------------------------- format
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const f2 = n => Number.isFinite(n) ? n.toFixed(2) : '—';
const f3 = n => Number.isFinite(n) ? n.toFixed(3) : '—';
const f0 = n => Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—';
const sgn = (n, d = 0) => Number.isFinite(n) ? (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(d) : '—';
const pc = n => Number.isFinite(n) ? (n * 100).toFixed(1) + '%' : '—';
const day = d => d.toISOString().slice(0, 16).replace('T', ' ');

// ---------------------------------------------------------------- svg
const SW = 900, PAD = { l: 238, r: 26, t: 30, b: 10 };
const px = (v, lo, hi) => PAD.l + (v - lo) / (hi - lo) * (SW - PAD.l - PAD.r);
const ticksOf = (lo, hi, n = 5) => Array.from({ length: n + 1 }, (_, i) => lo + (hi - lo) * i / n);
/** Round a span up to 1 / 2 / 2.5 / 5 x 10^k, so every tick label is a round number. */
const niceCeil = v => {
  if (!(v > 0)) return 1;
  const e = 10 ** Math.floor(Math.log10(v)), m = v / e;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e;
};
/** Zero-based axis: round ticks with the least empty space, at 4 or 5 intervals. */
const zeroDomain = top => [4, 5].map(n => [0, niceCeil(top * 1.02 / n) * n, n]).reduce((a, b) => b[1] < a[1] ? b : a);
/** [lo, hi, tick intervals]. Counts and shares start at 0; deviations sit symmetric on `center`. */
const spanDomain = (vals, center) => {
  const lo = Math.min(...vals), hi = Math.max(...vals);
  if (center != null) { const s = niceCeil(Math.max(hi - center, center - lo, 1e-9) * 0.51); return [center - 2 * s, center + 2 * s, 4]; }
  if (lo >= 0) return zeroDomain(hi);
  const s = niceCeil(Math.max(hi, -lo) * 0.51); return [-2 * s, 2 * s, 4];
};
const svg = (h, inner) => `<svg class="chart" viewBox="0 0 ${SW} ${h}" width="${SW}" height="${h}" role="img">${inner}</svg>`;
const grid = (lo, hi, h, fmt, n = 5) => ticksOf(lo, hi, n).map(t => {
  const x = px(t, lo, hi).toFixed(1);
  return `<line class="grid" x1="${x}" y1="22" x2="${x}" y2="${h - PAD.b}"/>` +
    `<text class="tick" x="${x}" y="14" text-anchor="middle">${fmt(t)}</text>`;
}).join('');

/**
 * One horizontal scale, one row per entry: bar from `center` (or 0) plus an optional 95% whisker.
 * rows: {label, value, lo, hi, note, cls, bound}
 */
function hbars(rows, { center = null, fmtT = f2, fmtV = f3, refs = [], domain = null } = {}) {
  const vals = rows.flatMap(r => [r.value, r.lo, r.hi, r.bound]).filter(Number.isFinite)
    .concat(refs.flatMap(r => r.at));
  if (!vals.length) return '';
  const [lo, hi, nT] = domain ?? spanDomain(vals, center);
  const rh = 30, h = PAD.t + rows.length * rh + PAD.b;
  const base = center == null ? Math.max(lo, 0) : center;
  const body = rows.map((r, i) => {
    const y = PAD.t + i * rh, mid = y + rh / 2;
    let mark = '';
    if (Number.isFinite(r.value)) {
      const a = px(base, lo, hi), b = px(r.value, lo, hi);
      mark += `<rect class="bar ${r.cls || ''}" x="${Math.min(a, b).toFixed(1)}" y="${mid - 7}" width="${Math.max(1.5, Math.abs(b - a)).toFixed(1)}" height="14"/>`;
      if (Number.isFinite(r.lo) && Number.isFinite(r.hi)) {
        const x1 = px(r.lo, lo, hi).toFixed(1), x2 = px(r.hi, lo, hi).toFixed(1);
        mark += `<line class="whisk" x1="${x1}" y1="${mid}" x2="${x2}" y2="${mid}"/>` +
          `<line class="whisk" x1="${x1}" y1="${mid - 6}" x2="${x1}" y2="${mid + 6}"/>` +
          `<line class="whisk" x1="${x2}" y1="${mid - 6}" x2="${x2}" y2="${mid + 6}"/>`;
      }
    } else if (Number.isFinite(r.bound)) {           // "< 1.70": an upper bound, drawn as an arrow
      const b = px(r.bound, lo, hi), a = px(base, lo, hi);
      mark += `<line class="whisk" x1="${a.toFixed(1)}" y1="${mid}" x2="${b.toFixed(1)}" y2="${mid}"/>` +
        `<path class="whisk" d="M${b.toFixed(1)} ${mid} l8 -5 v10 z" fill="currentColor"/>`;
    }
    return `<g><title>${esc(r.label)} ${esc(r.note || fmtV(r.value))}</title>` +
      `<text class="lbl" x="0" y="${mid + 5}">${esc(r.label)}</text>` +
      `<text class="num" x="${PAD.l - 12}" y="${mid + 5}" text-anchor="end">${esc(r.note ?? fmtV(r.value))}</text>${mark}</g>`;
  }).join('');
  const refLines = refs.map(r => r.at.map(v =>
    `<line class="ref ${r.cls || ''}" x1="${px(v, lo, hi).toFixed(1)}" y1="22" x2="${px(v, lo, hi).toFixed(1)}" y2="${h - PAD.b}"/>`).join('')).join('');
  const zero = center == null ? '' : `<line class="zero" x1="${px(center, lo, hi).toFixed(1)}" y1="22" x2="${px(center, lo, hi).toFixed(1)}" y2="${h - PAD.b}"/>`;
  return svg(h, grid(lo, hi, h, fmtT, nT) + refLines + zero + body);
}

/** Shares that sum to 1, one row per run. parts: [{v, cls, name}] */
function stacked(rows) {
  const rh = 30, h = PAD.t + rows.length * rh + PAD.b;
  const body = rows.map((r, i) => {
    const y = PAD.t + i * rh, mid = y + rh / 2; let x = px(0, 0, 1);
    const segs = r.parts.map(p => {
      const w = Math.max(0, (px(p.v, 0, 1) - px(0, 0, 1)));
      const s = `<g><title>${esc(r.label)} — ${esc(p.name)} ${pc(p.v)}</title><rect class="bar ${p.cls}" x="${x.toFixed(1)}" y="${mid - 9}" width="${w.toFixed(1)}" height="18"/></g>`;
      x += w; return s;
    }).join('');
    return `<text class="lbl" x="0" y="${mid + 5}">${esc(r.label)}</text>` +
      `<text class="num" x="${PAD.l - 12}" y="${mid + 5}" text-anchor="end">${pc(r.parts[0].v)}</text>${segs}`;
  }).join('');
  return svg(h, grid(0, 1, h, t => Math.round(t * 100) + '%') + body);
}

/** points: {x, y, title, flagged} */
function scatter(points, { xlab, ylab, center = 0.5 }) {
  const h = 430, L = 78, R = 26, T = 24, B = 52;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const [x0, x1] = spanDomain(xs, center);
  const [y0, y1] = [Math.min(...ys) - 0.02, Math.max(...ys) + 0.02];
  const X = v => (L + (v - x0) / (x1 - x0) * (SW - L - R));
  const Y = v => (h - B - (v - y0) / (y1 - y0) * (h - T - B));
  const gx = ticksOf(x0, x1, 4).map(t => `<line class="grid" x1="${X(t).toFixed(1)}" y1="${T}" x2="${X(t).toFixed(1)}" y2="${h - B}"/>` +
    `<text class="tick" x="${X(t).toFixed(1)}" y="${h - B + 18}" text-anchor="middle">${t.toFixed(2)}</text>`).join('');
  const gy = ticksOf(y0, y1, 5).map(t => `<line class="grid" x1="${L}" y1="${Y(t).toFixed(1)}" x2="${SW - R}" y2="${Y(t).toFixed(1)}"/>` +
    `<text class="tick" x="${L - 10}" y="${Y(t).toFixed(1) - -4}" text-anchor="end">${t.toFixed(2)}</text>`).join('');
  const dots = points.map(p => `<g class="${p.flagged ? 'flag' : ''}"><title>${esc(p.title)}</title>` +
    `<circle class="dot" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p.flagged ? 6 : 4.5}"/></g>`).join('');
  return svg(h, gx + gy +
    `<line class="zero" x1="${X(center).toFixed(1)}" y1="${T}" x2="${X(center).toFixed(1)}" y2="${h - B}"/>` +
    dots +
    `<text class="tick" x="${SW - R}" y="${h - 8}" text-anchor="end">${esc(xlab)}</text>` +
    `<text class="tick" x="${L - 10}" y="${T - 8}" text-anchor="end">${esc(ylab)}</text>`);
}

/** Vertical bars over a labelled numeric axis (game length). */
function vbars(rows, { xlab }) {
  const h = 300, L = 60, R = 26, T = 22, B = 50;
  const [, max, nT] = zeroDomain(Math.max(...rows.map(r => r.value), 1));
  const bw = (SW - L - R) / rows.length;
  const Y = v => h - B - v / max * (h - T - B);
  const gy = ticksOf(0, max, nT).map(t => `<line class="grid" x1="${L}" y1="${Y(t).toFixed(1)}" x2="${SW - R}" y2="${Y(t).toFixed(1)}"/>` +
    `<text class="tick" x="${L - 10}" y="${(Y(t) + 4).toFixed(1)}" text-anchor="end">${f0(t)}</text>`).join('');
  const bars = rows.map((r, i) => `<g><title>${esc(r.label)} — ${f0(r.value)} games</title>` +
    `<rect class="bar" x="${(L + i * bw + 2).toFixed(1)}" y="${Y(r.value).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${(h - B - Y(r.value)).toFixed(1)}"/></g>` +
    (i % 2 === 0 ? `<text class="tick" x="${(L + i * bw + bw / 2).toFixed(1)}" y="${h - B + 18}" text-anchor="middle">${esc(r.label)}</text>` : '')).join('');
  return svg(h, gy + bars + `<text class="tick" x="${SW - R}" y="${h - 8}" text-anchor="end">${esc(xlab)}</text>`);
}

const table = (head, rows) => `<div class="scroll"><table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>` +
  `<tbody>${rows.map(r => `<tr${r.flagged ? ' class="flag"' : ''}>${(r.cells || r).map((c, i) => `<td${i ? ' class="n"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const empty = what => `<p class="none">no run yet — ${esc(what)}</p>`;
const section = (n, title, body) => `<h2><span class="n">${n}</span> ${esc(title)}</h2>${body}`;

// ---------------------------------------------------------------- 1. inventory
const hasVersion = summaries.some(s => s.spec?.searchVersion ?? s.searchVersion);
const invHead = ['run', 'kind', 'games', 'depth', 'pairs', 'mean plies', 'games/s', 'finished']
  .concat(hasVersion ? ['search'] : []);
const inventory = summaries.length ? table(invHead, summaries.map(s => [
  `<code>${esc(s.id)}</code>`, kindOf(s.id), f0(s.games), s.spec?.ai?.depth ?? '—',
  s.spec?.pairs ? 'yes' : '—', f0(s.meanPlies), s.seconds ? (s.games / s.seconds).toFixed(1) : '—', day(s.date),
].concat(hasVersion ? [esc(s.spec?.searchVersion ?? s.searchVersion ?? '—')] : []))) : empty('sim/out holds no summary');

const totals = {
  games: summaries.reduce((a, s) => a + (s.games || 0), 0),
  seconds: summaries.reduce((a, s) => a + (s.seconds || 0), 0),
};

// ---------------------------------------------------------------- 2. balance
const balance = reports.length ? [
  '<h3>White score, 95% interval</h3>',
  hbars(reports.map(r => ({
    label: r.id, value: r.overall.score, lo: r.overall.ci[0], hi: r.overall.ci[1],
    note: f3(r.overall.score),
  })), { center: 0.5, fmtT: f2 }),
  '<p class="cap">Bars run from the 0.500 null. Whiskers are the 95% normal interval on the per-game score (a score with draws is trinomial, so this is not a Wilson interval).</p>',
  '<h3>White Elo ± 95%</h3>',
  hbars(reports.map(r => ({
    label: r.id, value: r.overall.elo, lo: r.overall.eloLo, hi: r.overall.eloHi,
    note: `${sgn(r.overall.elo)} ± ${f0(r.overall.match?.err95)}`,
  })), { center: 0, fmtT: t => sgn(t) }),
  '<h3>Decisive / draw / capped</h3>',
  stacked(reports.map(r => ({
    label: r.id, parts: [
      { v: r.overall.decisiveness, cls: 'c1', name: 'decisive' },
      { v: r.overall.drawRate, cls: 'c2', name: 'draw' },
      { v: r.overall.timeouts, cls: 'c3', name: 'capped' },
    ],
  }))),
  '<p class="cap"><span class="key c1"></span>decisive <span class="key c2"></span>draw <span class="key c3"></span>capped at the 300-ply cap. A capped game is its own class and is never scored as a draw.</p>',
].join('') : empty('no .report.json in sim/out');

// ---------------------------------------------------------------- 3. piece values
const valueRuns = experiments.filter(e => /^values/.test(e.id)).map(e => {
  const t = mdTables(e.md).find(t => t.head[0] === 'piece');
  const pawn = /One pawn = ([\d.]+) ± ([\d.]+) Elo/.exec(e.md);
  const setup = /Depth (\d+), ([\d\s,]+) games per arm/.exec(e.md);
  return t && {
    id: e.id, date: e.date, pawnElo: pawn && { v: +pawn[1], e: +pawn[2] },
    depth: setup && +setup[1], games: setup && +setup[2].replace(/[\s,]/g, ''),
    unresolved: /calibration arm did not resolve/i.test(e.md),
    rows: t.rows.map(r => {
      const code = /^([A-Z])/.exec(r[0])?.[1];
      return { code, elo: pm(r[1]), pawns: pm(r[3]), seed: pm(r[4]).v, prior: pm(r[5]).v, next: pm(r[6]).v };
    }),
  };
}).filter(Boolean);

const pawnCell = p => p.capped ? `&lt; ${f2(p.bound)}` : p.v == null ? 'n/a' : `${f2(p.v)} ± ${f2(p.e)}`;
const label = r => `${r.code} ${PIECE_NAME[r.code] || ''}`;
/** In pawns against the knight when the calibration arm resolved; in Elo when it did not. */
const valueChart = run => run.rows.some(r => r.pawns.v != null || r.pawns.capped)
  ? hbars(run.rows.map(r => ({
    label: label(r), value: r.pawns.v, lo: r.pawns.v - r.pawns.e, hi: r.pawns.v + r.pawns.e,
    bound: r.pawns.bound, note: r.pawns.capped ? `< ${f2(r.pawns.bound)}` : r.pawns.v == null ? 'n/a' : `${f2(r.pawns.v)} ± ${f2(r.pawns.e)}`,
  })), { fmtT: f2, refs: [{ at: [3.2] }] })
  : hbars(run.rows.map(r => ({
    label: label(r), value: r.elo.v, lo: r.elo.v - r.elo.e, hi: r.elo.v + r.elo.e,
    note: `${sgn(r.elo.v)} ± ${f0(r.elo.e)}`,
  })), { center: 0, fmtT: t => sgn(t) });

const pieceValues = valueRuns.length ? valueRuns.map(run => [
  `<h3>${esc(run.id)} <span class="sub">${run.games ? f0(run.games) + ' games per arm, ' : ''}${run.depth ? 'depth ' + run.depth + ', ' : ''}${day(run.date)}</span></h3>`,
  run.pawnElo ? `<p class="cap">Calibration arm: one pawn = <b>${f0(run.pawnElo.v)} ± ${f0(run.pawnElo.e)} Elo</b>. Every value below carries that error on top of its own.</p>` : '',
  valueChart(run),
  run.unresolved
    ? `<p class="cap"><b>The calibration arm did not resolve</b> — the pawn is worth less than its own error bar, so this pass has no pawn scale and the chart is in Elo against a knight. Whiskers are 95%.</p>`
    : `<p class="cap">Dot and whisker in pawns against a knight held at 3.20 (dashed). An arrow is an upper bound: the swap left Muller's ±1.5-pawn linear band, so the score saturates and the number under-reads the gap.</p>`,
  table(['piece', 'Elo vs knight', 'implied value (pawns)', 'research prior', 'engine seed at run', 'eval.ts now', 'next seed'],
    run.rows.map(r => [
      `<code>${esc(r.code)}</code> ${esc(PIECE_NAME[r.code] || '')}`,
      r.elo.v == null ? '—' : `${sgn(r.elo.v)} ± ${f0(r.elo.e)}`,
      pawnCell(r.pawns),
      f2(PRIORS[r.code] ?? r.prior), f2(r.seed), f2(SEEDS[r.code] / PAWN_CP), r.next == null ? 'n/a' : f0(r.next),
    ])),
].join('')).join('') : empty('no values experiment in sim/out');

// ---------------------------------------------------------------- 4. sweep
const sweepRuns = reports.filter(r => /^sweep/.test(r.id) && r.byConfig?.length);
const sdOf = c => (c.ci[1] - c.ci[0]) / 2 / 1.95996;
const sweep = sweepRuns.length ? sweepRuns.map(r => {
  const rows = r.byConfig.map(c => ({ ...c, sd: sdOf(c), flagged: Math.abs(c.score - 0.5) > 2 * sdOf(c) }))
    .sort((a, b) => Math.abs(b.score - 0.5) - Math.abs(a.score - 0.5));
  const flagged = rows.filter(x => x.flagged).length;
  return [
    `<h3>${esc(r.id)} <span class="sub">${rows.length} back ranks, ${f0(rows[0].games)} games each, ${flagged} flagged</span></h3>`,
    scatter(rows.map(c => ({
      x: c.score, y: c.interest, flagged: c.flagged,
      title: `${c.key} — score ${f3(c.score)} ± ${f3(c.sd)}, interest ${f3(c.interest)}, ${f0(c.games)} games${c.gatesFailed?.length ? `, gates: ${c.gatesFailed.join(', ')}` : ''}`,
    })), { xlab: 'White score →', ylab: '↑ interest' }),
    `<p class="cap">Balance (x) against interest (y); the line is the 0.500 null. Hover a dot for the rank. Filled-dark dots are flagged: |score − 0.5| &gt; 2 sd.</p>`,
    table(['back rank', 'games', 'White score', '± sd', 'interest', 'flag'], rows.map(c => ({
      flagged: c.flagged,
      cells: [`<code>${esc(c.key)}</code>`, f0(c.games), f3(c.score), f3(c.sd), f3(c.interest),
        c.flagged ? '<b>&gt; 2 sd</b>' : '—'],
    }))),
  ].join('');
}).join('') : empty('no sweep report in sim/out');

// ---------------------------------------------------------------- 5. rule A/B
const abRuns = experiments.filter(e => /^ab-/.test(e.id)).map(e => {
  const t = mdTables(e.md).find(t => t.head[0] === 'metric');
  return t && {
    id: e.id, date: e.date, rule: /`([^`]+)`/.exec(e.md)?.[1] ?? e.id,
    rows: t.rows.map(r => ({ metric: r[0], base: r[1], var: r[2], d: pm(r[3]), sig: /yes/i.test(r[4]) })),
  };
}).filter(Boolean);

const ab = abRuns.length ? abRuns.map(run => [
  `<h3><code>${esc(run.rule)}</code> <span class="sub">${esc(run.id)}, ${day(run.date)}</span></h3>`,
  hbars(run.rows.filter(r => r.d.e).map(r => ({
    label: r.metric, value: r.d.v / r.d.e, lo: -1, hi: 1, cls: r.sig ? '' : 'faint',
    note: `${sgn(r.d.v, 3)} ± ${f3(r.d.e)}`,
  })), { center: 0, fmtT: f2 }),
  `<p class="cap">One scale: each delta divided by its own 95% half-width, so the whisker is ±1 everywhere and a bar past it is significant. Raw numbers on the left; faint bars are the metrics that did not clear their interval. The delta is the mean paired difference over the shared arrangements (rule − defaults), not a match score.</p>`,
  table(['metric', 'defaults (pooled)', 'with the rule (pooled)', 'mean paired difference ±95%', 'significant'],
    run.rows.map(r => ({
      flagged: r.sig,
      cells: [esc(r.metric), esc(r.base), esc(r.var), `${sgn(r.d.v, 3)} ± ${f3(r.d.e)}`, r.sig ? '<b>yes</b>' : 'no'],
    }))),
].join('')).join('') : empty('no A/B experiment in sim/out');

// ---------------------------------------------------------------- 6. activity
const pool = new Map(); const events = new Map();
for (const r of reports) {
  for (const p of r.pieces || []) {
    const a = pool.get(p.piece) || { piece: p.piece, moves: 0, captures: 0, taken: 0, started: 0, survived: 0 };
    for (const k of ['moves', 'captures', 'taken', 'started', 'survived']) a[k] += p[k] || 0;
    pool.set(p.piece, a);
  }
  for (const [k, v] of Object.entries(r.events || {})) events.set(k, (events.get(k) || 0) + v);
}
const pieces = [...pool.values()].sort((a, b) => b.moves - a.moves);
const spaced = s => s.replace(/([A-Z]|\d+)/g, ' $1').toLowerCase();
const activity = pieces.length ? [
  `<p class="cap">Pooled over ${reports.length} report${reports.length > 1 ? 's' : ''} (${f0(pieces.reduce((a, p) => a + p.moves, 0))} moves). Piece codes: P pawn, N knight, B bishop, R rook, Q queen, K king, A archer, L paladin, G guard, M maester, S beast, O ogre, C catapult (the last two are lab pieces, not in the shipped pool).</p>`,
  '<h3>Moves</h3>', hbars(pieces.map(p => ({ label: p.piece, value: p.moves, note: f0(p.moves) })), { fmtT: f0 }),
  '<h3>Captures made / taken</h3>',
  hbars(pieces.flatMap(p => [
    { label: `${p.piece} made`, value: p.captures, note: f0(p.captures) },
    { label: `${p.piece} taken`, value: p.taken, cls: 'c2', note: f0(p.taken) },
  ]), { fmtT: f0 }),
  '<h3>Survival (share of starters alive at the end)</h3>',
  hbars(pieces.map(p => ({ label: p.piece, value: p.survived / (p.started || 1), note: pc(p.survived / (p.started || 1)) })), { fmtT: pc, domain: [0, 1, 5] }),
  '<h3>Fairy event counters</h3>',
  hbars([...events].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: spaced(k), value: v, note: f0(v) })), { fmtT: f0 }),
].join('') : empty('no .report.json in sim/out');

// ---------------------------------------------------------------- 7. lengths and end reasons
const reasons = new Map();
for (const s of summaries) for (const [k, v] of Object.entries(s.reasons || {})) reasons.set(k, (reasons.get(k) || 0) + v);
const lengths = histGames ? [
  vbars(hist.map((v, i) => ({ label: `${i * BIN}`, value: v })), { xlab: 'plies →' }),
  `<p class="cap">${f0(histGames)} games over every JSONL in <code>sim/out</code>, in ${BIN}-ply bins; the last bin holds the 300-ply cap.</p>`,
].join('') : empty('no .jsonl in sim/out');
const endReasons = reasons.size ? [
  hbars([...reasons].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({
    label: spaced(k), value: v, cls: /adjudicated|plyCap/.test(k) ? 'c3' : '', note: f0(v),
  })), { fmtT: f0 }),
  `<p class="cap">Pooled over ${summaries.length} runs (${f0(totals.games)} games). Shaded bars are the two engine-external outcomes: adjudication and the ply cap.</p>`,
].join('') : empty('no summary in sim/out');

// ---------------------------------------------------------------- page
const page = `<title>King Down Balance Lab</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&family=Press+Start+2P&display=swap" rel="stylesheet" />
<style>
  :root {
    --paper: #f7f5f0; --ink: #151515; --mid: #8a8680; --hairline: #d9d5cd; --white: #ffffff;
    --dash: repeating-linear-gradient(90deg, var(--ink) 0 4px, transparent 4px 8px);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 28px 20px 64px; background: var(--paper); color: var(--ink);
    font-family: 'DotGothic16', 'Courier New', monospace; font-size: 15px; line-height: 1.7;
    font-variant-numeric: tabular-nums;
  }
  .wrap { max-width: 1180px; margin: 0 auto; }
  h1 { margin: 0 0 14px; font-family: 'Press Start 2P', 'DotGothic16', monospace; font-size: 20px; font-weight: 400; line-height: 1.6; letter-spacing: 1px; }
  h2 { margin: 52px 0 14px; padding-bottom: 10px; font-family: 'Press Start 2P', 'DotGothic16', monospace;
       font-size: 13px; font-weight: 400; line-height: 1.8; letter-spacing: 1px;
       background-image: var(--dash); background-size: 100% 2px; background-position: left bottom; background-repeat: no-repeat; }
  h2 .n { display: inline-block; margin-right: 10px; padding: 3px 7px; background: var(--ink); color: var(--paper); }
  h3 { margin: 26px 0 8px; font-size: 16px; font-weight: 400; letter-spacing: 1px; }
  h3:first-child { margin-top: 0; }
  p { margin: 0 0 14px; max-width: 86ch; }
  .lede { padding: 14px 16px; background: var(--white); border: 2px solid var(--ink); box-shadow: 4px 4px 0 var(--ink); }
  .lede p:last-child { margin: 0; }
  .sub, .cap { color: var(--mid); }
  .cap { margin: 8px 0 0; font-size: 13px; line-height: 1.6; }
  .none { padding: 12px 14px; background: var(--white); border: 2px dashed var(--mid); color: var(--mid); }
  code { font-family: inherit; letter-spacing: 1px; padding: 1px 5px; background: var(--paper); border: 1px solid var(--hairline); overflow-wrap: anywhere; }
  .card { margin: 0 0 22px; padding: 16px; background: var(--white); border: 2px solid var(--ink); box-shadow: 5px 5px 0 var(--ink); }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin: 18px 0 0; }
  .stat { padding: 10px 12px; background: var(--white); border: 2px solid var(--ink); box-shadow: 4px 4px 0 var(--hairline); }
  .stat b { display: block; font-family: 'Press Start 2P', 'DotGothic16', monospace; font-size: 15px; font-weight: 400; line-height: 1.6; }
  .stat span { color: var(--mid); font-size: 13px; }
  .scroll { overflow: auto; max-height: 560px; border: 1px solid var(--hairline); background: var(--white); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 5px 10px; text-align: left; border-bottom: 1px solid var(--hairline); white-space: nowrap; }
  td.n, th + th { text-align: right; }
  thead th { position: sticky; top: 0; background: var(--ink); color: var(--paper); border-bottom: 2px solid var(--ink); letter-spacing: 1px; }
  tbody tr.flag { background: #efe9db; }
  tbody tr.flag td:first-child { box-shadow: inset 3px 0 0 var(--ink); }
  svg.chart { display: block; width: 100%; height: auto; max-width: 940px; margin: 4px 0 2px; color: var(--ink); }
  .grid { stroke: var(--hairline); stroke-width: 1; }
  .zero { stroke: var(--ink); stroke-width: 2; }
  .ref { stroke: var(--mid); stroke-width: 2; stroke-dasharray: 4 4; }
  .bar { fill: var(--ink); }
  .bar.c1 { fill: var(--ink); } .bar.c2 { fill: var(--mid); } .bar.c3 { fill: var(--hairline); stroke: var(--ink); stroke-width: 1; }
  .bar.faint { fill: var(--hairline); stroke: var(--ink); stroke-width: 1; }
  .whisk { stroke: var(--ink); stroke-width: 2; }
  .dot { fill: var(--white); stroke: var(--ink); stroke-width: 2; }
  .flag .dot { fill: var(--ink); }
  text { font-family: 'DotGothic16', 'Courier New', monospace; fill: var(--ink); }
  .tick { font-size: 12px; fill: var(--mid); }
  .lbl { font-size: 13px; } .num { font-size: 13px; fill: var(--mid); }
  .key { display: inline-block; width: 11px; height: 11px; margin: 0 4px 0 10px; border: 1px solid var(--ink); vertical-align: -1px; }
  .key.c1 { background: var(--ink); } .key.c2 { background: var(--mid); } .key.c3 { background: var(--hairline); }
  .foot { margin-top: 48px; padding: 16px 18px; background: var(--ink); color: var(--paper); box-shadow: 6px 6px 0 var(--hairline); }
  .foot h2 { margin-top: 0; color: var(--paper); background-image: repeating-linear-gradient(90deg, var(--paper) 0 4px, transparent 4px 8px); }
  .foot h2 .n { background: var(--paper); color: var(--ink); }
  .foot code { background: transparent; border-color: var(--mid); color: var(--paper); }
  .foot ol { margin: 0; padding-left: 20px; max-width: 90ch; }
  .foot li { margin-bottom: 10px; }
  @media (max-width: 720px) { th, td { white-space: normal; } }
</style>

<div class="wrap">
  <h1>KING DOWN — BALANCE LAB</h1>
  <div class="lede">
    <p>Every simulation run in <code>sim/out</code>, on two axes that never merge: <b>balance</b> (is the
    start fair?) and <b>interest</b> (is the game worth playing?). Read the error bars before the numbers —
    at these budgets most of the spread is sampling noise. Section 8 says how to read each chart.</p>
    <div class="stats">
      <div class="stat"><b>${f0(summaries.length)}</b><span>runs</span></div>
      <div class="stat"><b>${f0(totals.games)}</b><span>games</span></div>
      <div class="stat"><b>${(totals.seconds / 60).toFixed(0)} min</b><span>engine time</span></div>
      <div class="stat"><b>${f0(reports.length)}</b><span>full reports</span></div>
      <div class="stat"><b>${f0(experiments.length)}</b><span>experiments</span></div>
      <div class="stat"><b>${summaries.length ? day(summaries[summaries.length - 1].date).slice(0, 10) : '—'}</b><span>last run</span></div>
    </div>
  </div>

  ${section(1, 'Run inventory', `<div class="card">${inventory}${hasVersion ? '' : '<p class="cap">No run records a search version; the date column is the file time of its summary.</p>'}</div>`)}
  ${section(2, 'Balance', `<div class="card">${balance}</div>`)}
  ${section(3, 'Piece values — odds matches', `<div class="card">${pieceValues}</div>`)}
  ${section(4, 'Arrangement sweep', `<div class="card">${sweep}</div>`)}
  ${section(5, 'Rule A/B', `<div class="card">${ab}</div>`)}
  ${section(6, 'Per-piece activity', `<div class="card">${activity}</div>`)}
  ${section(7, 'Game length and end reasons', `<div class="card"><h3>Game length</h3>${lengths}<h3>End reasons</h3>${endReasons}</div>`)}

  <div class="foot">
    ${section(8, 'How to read this', `<ol>
      <li><b>Noise first.</b> The per-game score sd is 0.41, so 20 games carry ±0.18 on a score and 40 games
      ±0.13. In the first sweep the measured spread between back ranks (0.085) was <i>smaller</i> than the
      sampling noise alone (0.092): the extremes were noise, not arrangements. A rank is only tellable from
      its neighbour at about 320 games (±17 Elo), and certifiable at about 4 000 (±5 Elo).</li>
      <li><b>0.5 is the wrong null.</b> The pool's own White edge is about 0.522, so a rank flagged against
      0.500 may only be showing the game's White edge. Flags here use the 0.500 null because that is what
      the report files carry; check a flag against 0.522 before acting on it.</li>
      <li><b>Selection.</b> Sweep round 2 keeps the half that looked most balanced in round 1 — selected on
      the same statistic, at a budget where that statistic was noise. Round 2 ranks regress to the mean and
      its across-rank sd understates the pool.</li>
      <li><b>Depth 3 is a screen, not a verdict.</b> A short-range piece needs depth to show its worth, and
      balance is a property of the player as much as of the position. Every headline wants a second depth;
      a metric that changes sign between two budgets is unresolved. Our draw rate is far below Chess960's
      79% because the engine is weak, not because the variant is sharp.</li>
      <li><b>Piece values are a fixed point, not a measurement.</b> Each arm swaps one knight for one fairy
      piece, so a value is quoted against a knight at 3.20 pawns, and an arm outside ±1.5 pawns saturates —
      those rows are bounds ("&lt; 1.70"), not numbers. The engine's own seeds bias the search that produced
      them, which is why the iteration repeats until no piece moves by more than its error bar.</li>
      <li><b>Adjudication flags.</b> Games are adjudicated: resign at |eval| ≥ 600 cp held 3 moves, draw at
      |eval| ≤ 20 cp held 8 moves after move 34. Our eval is not calibrated, so those two classes carry the
      most doubt of any end reason. The 300-ply cap is its own class and is never scored as a draw — capped
      games run 5–6%, over Browne's 5% ceiling, so the cap and the draw adjudication both want a look
      before a full-size sweep.</li>
      <li><b>Interest is currently a draw-rate axis.</b> Excess decisiveness and late uncertainty dominate
      the weighted sum at our engine's draw rate, so "interesting" now means "gets decided". The weights are
      Browne's, fitted on human rankings of other games; never refit them on our own output.</li>
      <li><b>Charts.</b> One scale per chart, ticks labelled. Whiskers are 95%. Hover any bar or dot for its
      numbers. Generated by <code>npm run dashboard</code> from <code>sim/out</code>; sections with no data
      print "no run yet".</li>
    </ol>`)}
  </div>
</div>
`;

mkdirSync(DEST, { recursive: true });
writeFileSync(join(DEST, 'index.html'), page);
writeFileSync(join(DEST, 'files.json'), '{}\n');
console.log(`docs/dashboard/index.html  ${(page.length / 1024).toFixed(0)} kB — ` +
  `${summaries.length} runs, ${reports.length} reports, ${experiments.length} experiments, ${f0(histGames)} games binned`);
