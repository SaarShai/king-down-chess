// Exercise the production BoardView with legal engine moves. The workshop supplies test inputs only.
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createServer } from 'vite';
import { launch, trapErrors, assertNoErrors, env } from '../../../tools/lib/checks.mjs';

const out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const serveHarness = (_req, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#191b19}#board{width:min(92vw,720px);margin:12px auto}canvas{display:block;width:100%}</style><div id="board"></div><script type="module">
    import { PaintedView } from '/src/render/PaintedView';
    import { GameRules } from '/src/game-rules';
    import { POWERS_BALANCED, parseKings } from '/src/rules/rules';
    import fixtures from '/docs/specs/effects-animation/preview/cards/fixtures.json';
    window.view = new PaintedView(document.querySelector('#board'));
    window.fixtures = fixtures;
    window.load = id => {
      const f = fixtures.find(f => f.item === id), kings = f.setup.kings ? parseKings(f.setup.kings) : undefined;
      window.rules = new GameRules({ ...(kings?.some(Boolean) ? POWERS_BALANCED : {}), ...(kings ? { kings } : {}), hands: [f.setup.hand, f.setup.hand] });
      window.pos = rules.fromFen(f.setup.fen); view.setRules(rules); view.sync(pos); view.highlight({});
      return f.actions;
    };
    window.play = (lan, speed) => {
      const move = rules.legalMoves(pos).find(m => rules.toLan(pos, m) === lan);
      if (!move) throw Error('Illegal test move: ' + lan);
      const before = pos, after = rules.makeMove(before, move), start = performance.now();
      window.finished = false;
      window.done = view.animateMove(before, move, undefined, speed).then(() => { window.elapsed = performance.now() - start; window.finished = true; window.pos = after; view.sync(after); });
    };
    await view.ready(); window.ready = true;
  </script>`);
};
const server = await createServer({ root: resolve('.'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false }, plugins: [{ name: 'effects-game-check', configureServer(server) { server.middlewares.use('/__effects_game_check', serveHarness); } }] });
await server.listen();
const browser = await launch(), page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const errors = trapErrors(page), report = { cards: [], cancellation: [], static: false };
try {
  await page.goto(`${server.resolvedUrls.local[0]}__effects_game_check`);
  await page.waitForFunction(() => window.ready).catch(error => { assertNoErrors(errors); throw error; });
  const cards = await page.evaluate(() => fixtures.map(f => f.item));
  assert.equal(cards.length, 21);
  for (const id of cards) {
    const actions = await page.evaluate(id => load(id), id);
    await page.evaluate(() => view.flip(false));
    const before = await page.locator('canvas').screenshot();
    const timings = [];
    for (const [index, action] of actions.entries()) {
      await page.evaluate(action => play(action), action);
      if (index === 0) {
        await page.waitForTimeout(180);
        assert.equal(await page.evaluate(() => finished), false, `${id}: first card action has a live effect`);
        const during = await page.locator('canvas').screenshot({ path: join(out, `${id}.png`) });
        assert(!before.equals(during), `${id}: effect changes the rendered board`);
      }
      await page.waitForFunction(() => finished, null, { timeout: 8000 });
      timings.push(await page.evaluate(() => elapsed));
    }
    const result = await page.evaluate(id => {
      const f = fixtures.find(f => f.item === id), letters = ' PNBRQKALGMSOCVT';
      return Object.entries(f.expected.board ?? {}).map(([name, expected]) => {
        const code = pos.board[name.charCodeAt(0) - 97 + (Number(name[1]) - 1) * 8];
        return { name, expected, actual: code ? (code & 16 ? letters[code & 15].toLowerCase() : letters[code & 15]) : null };
      });
    }, id);
    for (const { name, expected, actual } of result) assert.equal(actual, expected, `${id}: legal outcome on ${name}`);
    report.cards.push({ id, actions: actions.length, timings });
  }

  for (const cancel of ['skip', 'off', 'reduced', 'hidden', 'sync']) {
    await page.evaluate(() => { view.setPace('normal'); load('Freeze'); play('!F:d5'); });
    await page.waitForTimeout(100);
    if (cancel === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
    else await page.evaluate(cancel => {
      if (cancel === 'skip') view.skip();
      if (cancel === 'off') view.setPace('off');
      if (cancel === 'sync') view.sync(rules.fromFen('7k/8/8/8/8/8/P7/K7 w - - 0 1'));
      if (cancel === 'hidden') { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); }
    }, cancel);
    await page.waitForFunction(() => finished, null, { timeout: 500 });
    report.cancellation.push(cancel);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  }
  for (const setting of ['off', 'reduced']) {
    if (setting === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(setting => { view.setPace(setting === 'off' ? 'off' : 'normal'); const actions = load('Flight'); play(actions[0]); }, setting);
    await page.waitForFunction(() => finished, null, { timeout: 500 });
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => { view.setPace('fast'); load('Freeze'); play('!F:d5'); });
  await page.waitForFunction(() => finished, null, { timeout: 3000 });
  const fast = await page.evaluate(() => elapsed), normal = report.cards.find(card => card.id === 'Freeze').timings[0];
  assert(fast < normal * .75, `Fast shortens the card effect: ${fast}/${normal} ms`);
  report.fast = { normal, fast };
  // Freeze must stay visible while an unrelated piece makes its ordinary move.
  await page.evaluate(() => { view.setPace('normal'); load('Freeze'); play('!F:d5'); });
  await page.waitForFunction(() => finished);
  const clip = await page.evaluate(() => {
    const canvas = document.querySelector('canvas'), rect = canvas.getBoundingClientRect(), foot = view.scene.foot(35), scale = rect.width / 960;
    return { x: rect.x + (foot.x - 78) * scale, y: rect.y + (foot.y + 64 - 142) * scale, width: 156 * scale, height: 173 * scale };
  });
  const held = await page.screenshot({ clip, path: join(out, 'freeze-before-move.png') });
  await page.evaluate(() => play(rules.toLan(pos, rules.legalMoves(pos).find(m => m.from === 48 && m.to === 40 && !m.power)), .25));
  await page.waitForTimeout(80);
  assert.equal(await page.evaluate(() => view.scene.animating), true);
  const duringMove = await page.screenshot({ clip, path: join(out, 'freeze-during-move.png') });
  assert.equal(await page.evaluate(() => view.scene.animating), true, 'the comparison stays within the move');
  const beforePixels = await sharp(held).ensureAlpha().raw().toBuffer(), duringPixels = await sharp(duringMove).ensureAlpha().raw().toBuffer();
  let changed = 0;
  for (let i = 0; i < beforePixels.length; i += 4) if ([0, 1, 2].some(c => Math.abs(beforePixels[i + c] - duringPixels[i + c]) > 16)) changed++;
  // Row sorting changes a few antialiased shadow pixels; losing the ice changes thousands.
  assert(changed / (beforePixels.length / 4) < .005, 'unrelated movement preserves the frozen-piece material');
  await page.waitForFunction(() => finished);
  report.persistentDuringMove = true;
  await page.evaluate(() => { view.setPace('normal'); view.flip(true); load('Firewall'); play('!P'); });
  await page.waitForTimeout(500);
  await page.locator('canvas').screenshot({ path: join(out, 'Firewall-flipped.png') });
  await page.waitForFunction(() => finished);

  // Draw the excluded marks alone, so character idles cannot hide a mark regression.
  report.static = await page.evaluate(async () => {
    const { drawMarks } = await import('/src/render/marks');
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 800;
    const ctx = canvas.getContext('2d');
    const scene = { PAD: 0, TILE: 100, cell: sq => ({ col: sq % 8, row: 7 - (sq >> 3) }), foot: sq => ({ x: sq % 8 * 100 + 50, y: (7 - (sq >> 3)) * 100 + 80 }) };
    const s = { marks: { selected: 0, moves: [8, 16], captures: [9], powers: [10], bites: [9, 18], last: [3, 11], threats: [{ from: 20, to: 12 }], rails: [{ to: 16, end: 'arrow' }] }, piece: 4, preview: null, k: 1, px: 1, motion: true, since: performance.now(), board: Array(64).fill(1) };
    const draw = () => { ctx.clearRect(0, 0, 800, 800); drawMarks(ctx, scene, 'under', s); drawMarks(ctx, scene, 'over', s); return canvas.toDataURL(); };
    const first = draw(); await new Promise(resolve => setTimeout(resolve, 450)); return first === draw();
  });
  assert(report.static, 'excluded indications have identical pixels over time');
  await page.evaluate(() => { view.setPace('normal'); load('Freeze'); play('!F:d5'); });
  await page.waitForTimeout(100);
  await page.evaluate(() => view.dispose());
  await page.waitForFunction(() => finished, null, { timeout: 500 });
  report.cancellation.push('dispose');
  assertNoErrors(errors);
  writeFileSync(join(out, 'effects-game-report.json'), JSON.stringify(report, null, 2));
  console.log(`Production effects: ${report.cards.length} legal card cases; ${report.cancellation.length} interruption paths; static indications unchanged.`);
} finally {
  await browser.close();
  await server.close();
}
// The same production renderer at phone sizes, with both armies at the bottom.
await import('./issues/15-card-integration/capture.mjs');
