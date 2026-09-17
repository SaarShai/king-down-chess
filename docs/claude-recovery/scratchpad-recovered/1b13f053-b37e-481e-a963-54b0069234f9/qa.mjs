// v0.7.0 QA: paladin nonPawn rule through the real UI (dist served by vite preview).
import { createRequire } from 'node:module';
const require = createRequire('/Users/za/Documents/king down chess/package.json');
const { chromium } = require('playwright');

const BASE = 'http://localhost:5223/';
const PAWN_FEN = '7k/7p/8/3p4/3L4/8/8/K6R w - - 0 1';
const KNIGHT_FEN = '7k/7p/8/3n4/3L4/8/8/K6R w - - 0 1';
const sqOf = n => (('abcdefgh'.indexOf(n[0])) | ((+n[1] - 1) << 3));
const results = [];
const pass = (id, ok, detail) => { results.push({ id, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${id} — ${detail}`); };

const browser = await chromium.launch();

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  return { ctx, page, errors };
}

async function boot(page, query) {
  await page.goto(BASE + query);
  await page.waitForFunction(() => window.view && document.getElementById('setup').title.length > 5, null, { timeout: 30000 });
  // Both sides human: full control, no AI in the way.
  await page.evaluate(() => {
    document.getElementById('white').value = 'human';
    document.getElementById('black').value = 'human';
    document.getElementById('black').dispatchEvent(new Event('change'));
  });
}

/**
 * Real mouse click on a square. A tall piece can cover the tile centre of the square behind it
 * (the paladin on d4 hides d5's centre from this camera), so hover first — `#hover` names the
 * square the renderer's raycaster picks — and only click once the pick is the intended square.
 */
async function clickSq(page, name) {
  const pt = await page.evaluate(s => window.view.screenOf(s), sqOf(name));
  for (const dy of [0, -18, -34, -8, -26]) {
    await page.mouse.move(pt.x, pt.y + dy);
    await page.waitForTimeout(60);
    if (await page.evaluate(() => document.getElementById('hover').textContent) === name) {
      await page.mouse.click(pt.x, pt.y + dy);
      return;
    }
  }
  throw new Error(`no pixel over ${name} picks it`);
}

const snap = page => page.evaluate(() => ({
  fen: document.getElementById('setup').title,
  moves: document.getElementById('moves').textContent.trim(),
  tookW: document.getElementById('took-w').textContent,
  tookB: document.getElementById('took-b').textContent,
  info: document.getElementById('info').textContent,
  status: document.getElementById('status').textContent,
  // live scene: square -> piece code, straight off the renderer's mesh map
  scene: Object.fromEntries([...window.view.pieces].map(([sq, g]) => [sq, g.userData.code])),
  bursts: window.__bursts,
}));

// Count debris bursts (one per removed piece) for this move.
const armBursts = page => page.evaluate(() => {
  const d = window.view.debris;
  if (!d.__wrapped) { const orig = d.burst.bind(d); d.burst = (...a) => { window.__bursts++; return orig(...a); }; d.__wrapped = true; }
  window.__bursts = 0;
});

const waitPly = (page, n) => page.waitForFunction(n => {
  try { return (JSON.parse(localStorage.getItem('kingdown.save') || '{}').moves || []).length === n; } catch { return false; }
}, n, { timeout: 30000 });

const CODE = { L: 8, l: 24, p: 17, n: 18 }; // type | colour<<4

/** a/b/c/e all play Ld4xd5 from a fen; `survives` says whether the paladin is still there. */
async function paladinCase(id, query, fen, victimCode, survives) {
  const { ctx, page, errors } = await newPage();
  try {
    await boot(page, query);
    const before = await snap(page);
    if (before.fen !== fen) return pass(id, false, `start fen ${before.fen}`);
    await armBursts(page);
    await clickSq(page, 'd4');
    const sel = await page.evaluate(() => document.getElementById('info').textContent);
    if (!/White paladin/.test(sel)) return pass(id, false, `click d4 selected "${sel}"`);
    await clickSq(page, 'd5');
    await waitPly(page, 1);
    await page.waitForTimeout(900); // let the self-removal burst and the shake finish
    const s = await snap(page);
    const d4 = sqOf('d4'), d5 = sqOf('d5');
    const checks = [
      ['lan', s.moves.includes('Ld4xd5'), s.moves],
      ['paladin on d5', (s.scene[d5] === CODE.L) === survives, `scene d5=${s.scene[d5] ?? 'empty'}`],
      ['d4 empty', s.scene[d4] === undefined, `scene d4=${s.scene[d4] ?? 'empty'}`],
      ['fen', s.fen.startsWith(survives ? '7k/7p/8/3L4/8' : '7k/7p/8/8/8'), s.fen],
      ['white took victim', s.tookW === (victimCode === CODE.p ? 'p' : 'n'), `tookW="${s.tookW}"`],
      ['black took paladin', s.tookB === (survives ? '' : 'L'), `tookB="${s.tookB}"`],
      ['bursts', s.bursts === (survives ? 1 : 2), `bursts=${s.bursts}`],
      ['no console errors', errors.length === 0, errors.join(' | ')],
    ];
    const bad = checks.filter(c => !c[1]);
    pass(id, bad.length === 0, bad.length ? bad.map(c => `${c[0]}: ${c[2]}`).join('; ') : checks.map(c => c[0]).join(', '));
    return { page, ctx, errors };
  } finally {
    if (id !== 'e') await ctx.close();
  }
}

// ---- (a) paladin takes a pawn, default rules: it survives
await paladinCase('a  paladin x pawn (default)', `?fen=${encodeURIComponent(PAWN_FEN)}`, PAWN_FEN, CODE.p, true);
// ---- (b) paladin takes a knight: both vanish, two bursts
await paladinCase('b  paladin x knight (default)', `?fen=${encodeURIComponent(KNIGHT_FEN)}`, KNIGHT_FEN, CODE.n, false);
// ---- (c) ?rules=2017: the pawn capture still removes the paladin
await paladinCase('c  paladin x pawn (?rules=2017)', `?rules=2017&fen=${encodeURIComponent(PAWN_FEN)}`, PAWN_FEN, CODE.p, false);

// ---- (e) undo across the surviving-paladin pawn capture
{
  const { ctx, page, errors } = await newPage();
  try {
    await boot(page, `?fen=${encodeURIComponent(PAWN_FEN)}`);
    await armBursts(page);
    await clickSq(page, 'd4');
    await clickSq(page, 'd5');
    await waitPly(page, 1);
    await page.waitForTimeout(600);
    await page.click('#undo');
    await waitPly(page, 0);
    await page.waitForTimeout(400);
    const s = await snap(page);
    const checks = [
      ['fen restored', s.fen === PAWN_FEN, s.fen],
      ['paladin back on d4', s.scene[sqOf('d4')] === CODE.L, `d4=${s.scene[sqOf('d4')] ?? 'empty'}`],
      ['pawn back on d5', s.scene[sqOf('d5')] === CODE.p, `d5=${s.scene[sqOf('d5')] ?? 'empty'}`],
      ['took lists empty', s.tookW === '' && s.tookB === '', `w="${s.tookW}" b="${s.tookB}"`],
      ['move list empty', s.moves === '', s.moves],
      ['no console errors', errors.length === 0, errors.join(' | ')],
    ];
    const bad = checks.filter(c => !c[1]);
    pass('e  undo across the pawn capture', bad.length === 0, bad.length ? bad.map(c => `${c[0]}: ${c[2]}`).join('; ') : checks.map(c => c[0]).join(', '));
  } finally { await ctx.close(); }
}

// ---- (d) one full AI vs AI game
{
  const { ctx, page, errors } = await newPage();
  try {
    await boot(page, '');
    await page.evaluate(() => {
      localStorage.removeItem('kingdown.save');
      const think = document.getElementById('think');
      think.value = '200'; think.dispatchEvent(new Event('change'));
      document.getElementById('white').value = 'ai';
      document.getElementById('black').value = 'ai';
      document.getElementById('black').dispatchEvent(new Event('change'));
    });
    await page.click('#new-random');
    const t0 = Date.now();
    let last = -1, stalls = 0;
    for (;;) {
      await page.waitForTimeout(3000);
      const st = await page.evaluate(() => ({
        open: document.getElementById('over').open,
        title: document.getElementById('over-title').textContent,
        plies: (JSON.parse(localStorage.getItem('kingdown.save') || '{}').moves || []).length,
        setup: document.getElementById('setup').textContent,
      }));
      if (st.open) { pass('d  full AI vs AI game', errors.length === 0, `${st.title} · ${st.plies} plies · setup ${st.setup} · ${((Date.now() - t0) / 1000).toFixed(0)}s · console errors: ${errors.length ? errors.join(' | ') : 'none'}`); break; }
      stalls = st.plies === last ? stalls + 1 : 0;
      last = st.plies;
      if (stalls >= 20 || Date.now() - t0 > 900000) { pass('d  full AI vs AI game', false, `stalled at ${st.plies} plies after ${((Date.now() - t0) / 1000).toFixed(0)}s; errors: ${errors.join(' | ') || 'none'}`); break; }
      if (st.plies % 40 === 0) console.log(`   … ${st.plies} plies`);
    }
  } finally { await ctx.close(); }
}

await browser.close();
console.log('\n' + results.map(r => `${r.ok ? 'PASS' : 'FAIL'} ${r.id}`).join('\n'));
process.exit(results.every(r => r.ok) ? 0 : 1);
