import { launch } from './lib/checks.mjs';

/** Fixed real games; each tap enters through the board. */
export async function fixture(url) {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const seed = async fen => {
    await page.addInitScript(fen => {
      sessionStorage.setItem('kingdown.title-seen', '1');
      localStorage.setItem('kingdown.save', JSON.stringify({ fen, back: '', moves: [], white: 'human', black: 'human', sound: false, pace: 'off' }));
    }, fen);
    await page.goto(url);
    await page.waitForFunction(() => window.view?.ready);
    await page.evaluate(() => window.view.ready());
  };
  const tap = async sq => {
    const p = await page.evaluate(s => window.view.screenOf(s), sq);
    await page.touchscreen.tap(p.x, p.y);
  };
  const marks = () => page.evaluate(() => window.view.marks);
  const close = () => browser.close();
  return { page, seed, tap, marks, close };
}
