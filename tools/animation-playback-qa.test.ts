import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { launch } from './lib/checks.mjs';

it('draws the selected body and effect frames, scales, and measures interrupted draws', async () => {
  const player = await readFile('docs/specs/character-animation-samples/preview/alpha-framebank-player.mjs');
  const board = await readFile('public/ui/pieces/pawn-w.webp');
  let bank = '';
  const html = '<div id="qa" data-alpha-bank="/bank.json" data-playback-qa data-board-scale="50" data-board-image="/board.webp"></div><div id="normal" data-alpha-bank="/bank.json"></div><script type="module" src="/player.mjs"></script>';
  const server = createServer((req, res) => {
    const routes: Record<string, [string, string | Buffer]> = { '/': ['text/html', html], '/player.mjs': ['text/javascript', player], '/bank.json': ['application/json', bank], '/board.webp': ['image/webp', board] };
    const route = routes[req.url ?? ''];
    if (!route) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': route[0] }).end(route[1]);
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const browser = await launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' });
  try {
    const page = await browser.newPage();
    const [redFrame, blueFrame, greenEffect] = await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = 2; canvas.height = 2;
      const ctx = canvas.getContext('2d')!;
      return [['red', 0, 0], ['blue', 1, 0], ['lime', 0, 1]].map(([color, x, y]) => {
        ctx.clearRect(0, 0, 2, 2); ctx.fillStyle = color as string; ctx.fillRect(x as number, y as number, 1, 1);
        return canvas.toDataURL('image/png');
      });
    });
    bank = JSON.stringify({ runtimeFormat: 'RGBA PNG framebank', durationMs: 1000, canvasSize: [2, 2], frames: [{ timeMs: 0, url: redFrame }, { timeMs: 250, url: blueFrame }, { timeMs: 750, url: redFrame }], effects: [{ timeMs: 500, url: greenEffect }] });
    await page.goto(`http://127.0.0.1:${(server.address() as { port: number }).port}/`);
    const qa = page.locator('#qa'), normal = page.locator('#normal');
    await expect.poll(() => qa.getAttribute('data-ready')).toBe('true');
    await expect.poll(() => normal.getAttribute('data-ready')).toBe('true');
    const pixels = (host: typeof qa) => host.locator('canvas').evaluate(canvas => Array.from((canvas as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, 2, 2).data));
    const red = [255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const blue = [0, 0, 0, 0, 0, 0, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0];
    const blueAndGreen = [0, 0, 0, 0, 0, 0, 255, 255, 0, 255, 0, 255, 0, 0, 0, 0];
    const redAndGreen = [255, 0, 0, 255, 0, 0, 0, 0, 0, 255, 0, 255, 0, 0, 0, 0];
    expect(await pixels(qa)).toEqual(red);
    expect(await qa.locator('canvas').evaluate(canvas => canvas.getBoundingClientRect().width)).toBe(2);
    await qa.locator('[data-size]').selectOption('board');
    expect(await qa.locator('canvas').evaluate(canvas => canvas.getBoundingClientRect().width)).toBe(100);
    for (const background of ['light', 'dark', 'checkerboard', 'board']) {
      await qa.locator('[data-background]').selectOption(background);
      expect(await qa.getAttribute('data-background')).toBe(background);
    }
    expect(await qa.getAttribute('data-qa-board')).toBe('true');
    await qa.locator('[data-step-next]').click();
    expect(await qa.locator('[data-seek]').inputValue()).toBe('250');
    expect(await pixels(qa)).toEqual(blue);
    await qa.locator('[data-step-next]').click();
    expect(await qa.locator('[data-seek]').inputValue()).toBe('500');
    expect(await pixels(qa)).toEqual(blueAndGreen);
    await qa.locator('[data-step-next]').click();
    expect(await pixels(qa)).toEqual(redAndGreen);
    await qa.locator('[data-step-back]').click();
    expect(await pixels(qa)).toEqual(blueAndGreen);
    await qa.locator('[data-step-back]').click();
    expect(await pixels(qa)).toEqual(blue);

    expect(await normal.locator('[data-size], [data-gap], [data-step-next], [data-step-back]').count()).toBe(0);
    expect(await pixels(normal)).toEqual(red);
    await normal.locator('[data-seek]').evaluate(element => { (element as HTMLInputElement).value = '500'; element.dispatchEvent(new Event('input')); });
    expect(await pixels(normal)).toEqual(blueAndGreen);
    await normal.locator('[data-background]').selectOption('dark');
    expect(await normal.getAttribute('data-background')).toBe('dark');
    await normal.locator('[data-play]').click();
    await expect.poll(() => pixels(normal)).toEqual(redAndGreen);
    await normal.locator('[data-play]').click();

    await qa.locator('[data-speed]').selectOption('.25');
    await qa.locator('[data-play]').click();
    await expect.poll(() => qa.locator('[data-gap]').textContent()).toContain('intervals');
    await page.evaluate(() => { const end = performance.now() + 180; while (performance.now() < end) {} });
    await expect.poll(async () => Number((await qa.locator('[data-gap]').textContent())?.match(/gap: ([\d.]+)/)?.[1])).toBeGreaterThan(150);
    await qa.locator('[data-play]').click();
  } finally {
    await browser.close();
    await new Promise<void>(done => server.close(() => done()));
  }
}, 30_000);
