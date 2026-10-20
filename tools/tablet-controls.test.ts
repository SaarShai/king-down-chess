import { afterAll, beforeAll, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import type { Browser, Page } from 'playwright';
import { launch } from './lib/checks.mjs';
import { checkButtonContent, checkFlatRows, checkMenuContent, checkSegments, checkTabletButtons } from './lib/plugin-tablet-check.mjs';

let server: Awaited<ReturnType<typeof createServer>>, browser: Browser, web: string;
beforeAll(async () => {
  web = await readFile('index.html', 'utf8');
  server = await createServer({ configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 }, plugins: [{
    name: 'tablet-fixture', configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/tablet-fixture')) return next();
        const sheets = req.url.includes('plugin') ? ['src/plugin/app.css', 'src/plugin/screens/setup.css'] : ['src/style.css', 'src/ui/table.css', 'src/ceremony.css'];
        res.setHeader('Content-Type', 'text/html');
        res.end(`<!doctype html><html><head>${sheets.map(path => `<link rel="stylesheet" href="/${path}?direct">`).join('')}</head><body></body></html>`);
      });
    },
  }] });
  await server.listen(); browser = await launch({ headless: true, channel: 'chromium' });
});
afterAll(async () => { await browser?.close(); await server?.close(); });

async function fixture(plugin: boolean, html: string, width = 390) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 2 });
  await page.goto(`${server.resolvedUrls!.local[0]}tablet-fixture?${plugin ? 'plugin' : 'web'}`);
  await page.locator('body').evaluate((el, html) => { el.innerHTML = html; }, html);
  await page.evaluate(() => document.fonts.ready);
  return page;
}
async function webParts(page: Page, selectors: string[]) {
  await page.evaluate(({ web, selectors }) => {
    const doc = new DOMParser().parseFromString(web, 'text/html');
    document.body.replaceChildren(...selectors.map(selector => doc.querySelector(selector)!));
    for (const dialog of document.querySelectorAll('dialog')) dialog.open = true;
  }, { web, selectors });
  await page.evaluate(() => document.fonts.ready);
}

it('keeps lesson text and icons inside their faces and the bar at phone width', async () => {
  const page = await fixture(false, '');
  try {
    await webParts(page, ['#game-table']);
    await page.evaluate(() => {
      document.body.classList.add('in-lesson');
      for (const button of document.querySelectorAll<HTMLButtonElement>('#table-bar > button')) button.hidden = !['return-game', 'show-me', 'menu-btn'].includes(button.id);
    });
    for (const done of [false, true]) {
      await page.evaluate(done => {
        document.getElementById('show-me')!.hidden = done;
        document.getElementById('next-lesson')!.hidden = !done;
        document.querySelector('#next-lesson .label')!.textContent = 'Next lesson: Maester';
      }, done);
      await checkButtonContent(page, '#table-bar > button');
      const box = (await page.locator('#table-bar').boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(844);
      for (const face of await page.locator('#table-bar > button:visible').all()) {
        const bounds = (await face.boundingBox())!;
        expect(bounds.y).toBeGreaterThanOrEqual(box.y); expect(bounds.y + bounds.height).toBeLessThanOrEqual(box.y + box.height);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    }
  } finally { await page.close(); }
});

it('gives both setup choosers the shared tablet face', async () => {
  const page = await fixture(true, '<div id="app-root"><dialog open id="new-game" class="page-sheet"><label class="check toggle"><span class="grow">Fairy pieces</span><button id="setup-pieces" class="all">10 kinds ›</button></label><label class="check toggle"><span class="grow">Cards</span><button id="setup-cards" class="all">21 cards ›</button></label></dialog></div>');
  try { await checkTabletButtons(page, '#setup-pieces, #setup-cards'); }
  finally { await page.close(); }
});

it('keeps the normal game bar at 48 px and its main action at 52 px', async () => {
  const page = await fixture(false, '');
  try {
    await webParts(page, ['#game-table']);
    await page.evaluate(() => {
      for (const button of document.querySelectorAll<HTMLButtonElement>('#table-bar > button')) button.hidden = !['undo', 'end-turn', 'menu-btn'].includes(button.id);
      document.getElementById('end-turn')!.className = 'primary';
    });
    for (const id of ['undo', 'menu-btn']) expect((await page.locator(`#${id}`).boundingBox())!.height).toBe(48);
    expect((await page.locator('#end-turn').boundingBox())!.height).toBe(52);
    await checkButtonContent(page, '#table-bar > button');
  } finally { await page.close(); }
});

it('gives Keep playing and Review the shared tablet face on the web', async () => {
  const page = await fixture(false, '');
  try {
    await webParts(page, ['#menu-sheet', '#over']);
    await page.locator('[data-menu-page="resign"]').evaluate(el => { el.hidden = false; });
    await checkTabletButtons(page, '#menu-sheet [data-go="menu"], #over-review');
  } finally { await page.close(); }
});

it('keeps the shared tablet size and type for All rules and Cancel on the web', async () => {
  const page = await fixture(false, '<div id="game-table"><div id="context-line"><div id="context-actions"><button>All rules</button><button>Cancel</button></div></div></div>');
  try { await checkTabletButtons(page, '#context-actions button'); }
  finally { await page.close(); }
});

it('removes the raised face from the Seat Menu rows', async () => {
  const page = await fixture(true, '<div id="app-root"><dialog open id="seat-menu-sheet" class="over-sheet"><div class="sheet-body"><button id="seat-abort" class="menu-row">Abort</button><button id="seat-settings" class="menu-row">Settings</button></div></dialog></div>');
  try { await checkFlatRows(page, '#seat-menu-sheet .menu-row'); }
  finally { await page.close(); }
});

it('keeps Settings words clear of the chevron at 336 px', async () => {
  const page = await fixture(true, '<div id="app-root"><dialog open class="page-sheet"><div class="new-game-body"><button class="menu-row" data-nav="settings"><span class="row-title">Settings</span><span class="line">Symbols only, Show threats, Who sees when you are online.</span><i>›</i></button></div></dialog></div>', 336);
  try {
    await checkMenuContent(page, '[data-nav="settings"]');
  } finally { await page.close(); }
});

it.each([false, true])('changes the selected segment pixels on keyboard focus (plugin: %s)', async plugin => {
  const page = await fixture(plugin, '<fieldset id="online-visibility"><div class="seg-row"><label><input type="radio" name="visibility"><span>Everyone</span></label><label><input type="radio" name="visibility" checked><span>Friends only</span></label><label><input type="radio" name="visibility"><span>Nobody</span></label></div></fieldset>');
  try { await checkSegments(page, page); }
  finally { await page.close(); }
});
