// The three approved motion concepts (ticket 86) through the production board: the gold promotion reveal, the check onset
// with its withdrawal, and the Freeze local release. Part 1 drives PaintedView on a paused page clock and saves frames at
// fixed times, for the comparison with the concept previews. Part 2 plays the same moves in the real web game.
// The plugin card coin and the plugin board are in tools/plugin-motion.test.ts and tools/plugin-motion-concepts.test.ts.
// Run: npm run check:browser motion-concepts (frames and browser-checks.json go to PLAYABLE_OUT).
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createServer } from 'vite';
import { endTurn, readyBoard } from './app-ui.mjs';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';

const out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const PROMOTION = 'r1b2rk1/pp1P1ppp/2n1pn2/2p5/2P1P3/2N2N2/PP3PPP/R1B1R1K1 w - - 0 24';
const CHECK = 'rnbq3k/pppp1ppp/5n2/8/8/3r4/PPPP1PPP/RNBQK1NR b - - 0 12';
const viewports = { phone: { width: 390, height: 844 }, desktop: { width: 1100, height: 900 } };
const checks = [];

const serveHarness = (_req, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#191b19}#board{width:min(100vw,720px);margin:0 auto}canvas{display:block;width:100%}</style><div id="board"></div><script type="module">
    import { PaintedView } from '/src/render/PaintedView';
    import { GameRules } from '/src/game-rules';
    import { POWERS_BALANCED, parseKings } from '/src/rules/rules';
    import { K, typeOf, colorOf } from '/src/rules/engine';
    import { checkersOf } from '/src/move-text';
    import { loadAscension } from '/src/render/effects/promotion';
    import fixtures from '/docs/specs/effects-animation/preview/cards/fixtures.json';
    const view = window.view = new PaintedView(document.querySelector('#board')), scene = view.scene, play = scene.play.bind(scene);
    // Each scene effect the view starts, with its start time on the page clock.
    window.effects = [];
    scene.play = (move, options = {}) => {
      if (options.effect) { window.effect = options.effect; effects.push({ at: performance.now(), duration: options.effect.duration, speed: options.speed, local: !!options.effect.local }); }
      return play(move, options);
    };
    // The board that the promotion reveal shows now (scene.position holds the end position).
    window.revealed = () => { const e = effects.at(-1); return [...window.effect.position(Math.min(1, (performance.now() - e.at) / (e.duration * e.speed))).board]; };
    const marks = pos => {
      if (!rules.inCheck(pos)) return {};
      return { check: [...pos.board].findIndex(v => v && typeOf(v) === K && colorOf(v) === pos.turn), checkers: checkersOf(rules, pos) };
    };
    window.load = (fen, flip, card) => {
      const f = card && fixtures.find(f => f.item === card), kings = f?.setup.kings ? parseKings(f.setup.kings) : undefined;
      window.rules = new GameRules(f ? { ...(kings?.some(Boolean) ? POWERS_BALANCED : {}), ...(kings ? { kings } : {}), hands: [f.setup.hand, f.setup.hand] } : {});
      window.pos = rules.fromFen(f ? f.setup.fen : fen); view.setRules(rules); view.sync(pos); view.flip(flip); view.highlight(marks(pos));
      effects.length = 0; window.finished = true;
      return f?.actions[0];
    };
    window.move = lan => {
      const move = rules.legalMoves(pos).find(m => rules.toLan(pos, m) === lan);
      if (!move) throw Error('Illegal test move: ' + lan);
      const after = rules.makeMove(pos, move);
      window.finished = false; window.started = performance.now();
      view.animateMove(pos, move).then(() => { window.pos = after; view.sync(after); view.highlight(marks(after)); window.finished = true; });
    };
    window.state = () => ({ finished, animating: scene.animating, board: [...scene.position.board], withdrawn: !!view.stateEffects.withdrawn, check: view.stateEffects.age('check', performance.now(), true), effects });
    await loadAscension(); await view.ready(); window.ready = true;
  </script>`);
};

const server = await createServer({ root: resolve('.'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false }, plugins: [{ name: 'motion-concepts-check', configureServer(server) { server.middlewares.use('/__motion_concepts_check', serveHarness); } }] });
await server.listen();
const browser = await launch();
try {
  // Part 1: the production view on a paused clock. A frame is the last animation frame at or before each time (±16 ms).
  for (const [size, viewport] of Object.entries(viewports)) for (const reduced of [false, true]) {
    const page = await browser.newPage({ viewport, reducedMotion: reduced ? 'reduce' : 'no-preference' }), errors = trapErrors(page);
    await page.clock.install();
    await page.goto(`${server.resolvedUrls.local[0]}__motion_concepts_check`);
    await page.waitForFunction(() => window.ready).catch(error => { assertNoErrors(errors); throw error; });
    await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 1000);
    const state = () => page.evaluate(() => window.state());
    const step = async (until, limit = 4000) => { for (let t = 0; t < limit; t += 16) { if (await page.evaluate(until)) return; await page.clock.runFor(16); } throw new Error(`${size}: no ${until}`); };
    // Runs the clock to `ms` after the last effect (or after the move when no effect started), then saves the board.
    const frame = async (name, ms, from = 'effect') => {
      const since = await page.evaluate(from => from === 'effect' ? performance.now() - effects.at(-1).at : from === 'signal' ? view.stateEffects.age('check', performance.now(), true) : performance.now() - started, from);
      if (ms > since) await page.clock.runFor(Math.round(ms - since));
      if (!name) return;
      const file = `${name}-${size}${reduced ? '-reduced' : ''}.png`;
      await page.locator('canvas').screenshot({ path: join(out, file) });
      return file;
    };
    for (const flip of [false, true]) {
      const turn = `${flip ? 'flipped' : 'normal'}`;
      // Promotion: the scene move, then the 740 ms reveal (0.13 to 0.42 the queen resolves; the pawn is gone by 0.45).
      await page.evaluate(([fen, flip]) => { load(fen, flip); move('d7-d8=Q'); }, [PROMOTION, flip]);
      if (reduced) {
        await step(() => window.finished);
        assert.deepEqual((await state()).effects, [], `${size}/${turn}: reduced motion has no reveal`);
        await frame(`promotion-${turn}-end`, 0, 'move');
      } else {
        await step(() => window.effects.length > 0);
        const [reveal] = (await state()).effects;
        assert.deepEqual([reveal.duration, reveal.speed], [740, 1], `${size}/${turn}: the reveal plays after the move at the move speed`);
        for (const ms of [96, 210, 310, 370, 560]) {
          await frame(`promotion-${turn}-${ms}`, ms);
          const [s, shown] = await Promise.all([state(), page.evaluate(() => window.revealed())]);
          assert.ok(s.animating && shown[59] === 0 && shown[51] === 0, `${size}/${turn}/${ms}: the reveal draws d8 itself (${JSON.stringify({ animating: s.animating, shown: [shown[51], shown[59]] })})`);
        }
        await step(() => window.finished);
        await frame(`promotion-${turn}-end`, 900);
      }
      assert.equal((await state()).board[59], 5, `${size}/${turn}: the queen stands on d8`);

      // Check: the onset (440 ms), the held result, then the evasion and its 220 ms withdrawal.
      await page.evaluate(([fen, flip]) => { load(fen, flip); move('Rd3-e3'); }, [CHECK, flip]);
      await step(() => window.finished);
      const onset = (await state()).check;
      assert.equal(onset === Infinity, reduced, `${size}/${turn}: a live check starts its onset; reduced motion holds it still`);
      if (!reduced) for (const ms of [60, 200, 330]) await frame(`check-${turn}-${ms}`, ms, 'signal');
      await page.clock.runFor(1500);
      await frame(`check-${turn}-held`, 0, 'move');
      await page.evaluate(() => move('Ke1-f1'));
      await step(() => window.finished);
      assert.equal((await state()).withdrawn, !reduced, `${size}/${turn}: the evasion withdraws the wash only with motion`);
      if (!reduced) { await page.clock.runFor(110); await page.locator('canvas').screenshot({ path: join(out, `check-${turn}-withdraw-${size}.png`) }); }
      await page.clock.runFor(400);
      assert.equal((await state()).withdrawn, false, `${size}/${turn}: the withdrawal ends`);
      await frame(`check-${turn}-resolved`, 0, 'move');

      // Freeze: 125 ms at the card, then the ice grows on the frozen knight. No travel across the board.
      const lan = await page.evaluate(flip => load('', flip, 'Freeze'), flip);
      await page.evaluate(lan => move(lan), lan);
      if (reduced) {
        await step(() => window.finished);
        assert.deepEqual((await state()).effects, [], `${size}/${turn}: reduced motion has no cast`);
      } else {
        await step(() => window.effects.length > 0);
        const [cast] = (await state()).effects;
        assert.deepEqual([cast.duration, cast.local], [1600, true], `${size}/${turn}: Freeze uses the local release`);
        for (const ms of [60, 300, 700]) await frame(`freeze-${turn}-${ms}`, ms);
        await step(() => window.finished);
      }
      await page.clock.runFor(800);
      await frame(`freeze-${turn}-end`, 0, 'move');
    }
    assertNoErrors(errors);
    checks.push(`${size}${reduced ? ' reduced' : ''}: promotion, check and Freeze frames in both orientations`);
    await page.close();
  }

  // Part 2: the real web game. Two people play at this device; the second check case plays Black against the computer.
  const url = env('PLAYABLE_URL');
  for (const [size, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 1000 }]]) for (const reduced of [false, true]) {
    if (reduced && size === 'desktop') continue;
    const page = await browser.newPage({ viewport, hasTouch: size === 'phone', reducedMotion: reduced ? 'reduce' : 'no-preference' }), errors = trapErrors(page);
    await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
    await page.goto(url); await readyBoard(page); await page.waitForFunction(() => localStorage.getItem('kingdown.save'));
    const seed = async (fen, players = { white: 'human', black: 'human' }) => {
      await page.evaluate(([fen, players]) => localStorage.setItem('kingdown.save', JSON.stringify({ fen, back: '', moves: [], ...players, sound: false })), [fen, players]);
      await page.goto(url); await readyBoard(page);
      await page.waitForFunction(() => window.view.pos && !window.view.scene.animating);
      // Note each scene effect and each frame with a withdrawing check.
      await page.evaluate(() => {
        const scene = window.view.scene, play = scene.play.bind(scene);
        window.seen = { effects: [], withdrawn: 0 };
        scene.play = (move, options = {}) => { if (options.effect) seen.effects.push(options.effect.duration); return play(move, options); };
        const tick = () => { if (window.view.stateEffects.withdrawn) seen.withdrawn++; requestAnimationFrame(tick); };
        tick();
      });
    };
    const tap = async sq => {
      const p = await page.evaluate(s => window.view.screenOf(s), sq);
      if (size === 'phone') await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    };
    const shot = name => page.locator('#board').screenshot({ path: join(out, `game-${name}-${size}${reduced ? '-reduced' : ''}.png`) });
    const seen = () => page.evaluate(() => window.seen);
    const settled = () => page.waitForFunction(() => !window.view.scene.animating && !window.view.stateEffects.withdrawn);

    await seed(PROMOTION);
    await tap(51); await tap(59);
    await page.locator('#promo button').first().click();
    if (!reduced) { await page.waitForFunction(() => window.seen.effects.length > 0); await shot('promotion-reveal'); }
    await settled();
    assert.deepEqual((await seen()).effects, reduced ? [] : [740], `game ${size}: the promotion reveal plays once, never under reduced motion`);
    assert.equal(await page.evaluate(() => window.view.pos.board[59]), 5);
    await shot('promotion-end');

    await seed(CHECK);
    await tap(19); await tap(20);
    await page.waitForFunction(() => window.view.marks.check != null && !window.view.scene.animating);
    const onset = await page.evaluate(() => window.view.stateEffects.age('check', performance.now(), true));
    assert.equal(Number.isFinite(onset), !reduced, `game ${size}: a live check starts its onset; reduced motion holds it still`);
    await shot('check');
    await endTurn(page);
    await tap(4); await tap(5);
    await settled();
    assert.equal((await seen()).withdrawn > 0, !reduced, `game ${size}: the evasion withdraws the check wash only with motion`);
    await shot('check-resolved');

    if (!reduced) {
      // Black's view is turned over. The computer answers the check; any legal answer ends it.
      await seed(CHECK, { white: 'ai', black: 'human' });
      assert.equal(await page.evaluate(() => window.view.screenOf(0).y < window.view.screenOf(63).y), true, `game ${size}: Black's board is turned over`);
      await tap(19); await tap(20); await endTurn(page);
      await page.waitForFunction(() => window.seen.withdrawn > 0, null, { timeout: 20_000 });
      await settled();
      await shot('check-flipped-resolved');
    }
    assertNoErrors(errors);
    checks.push(`web game ${size}${reduced ? ' reduced' : ''}: promotion and check`);
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
writeFileSync(join(out, 'browser-checks.json'), JSON.stringify({ checks }, null, 2));
console.log('ok');
