// Shared page set-up for the ux-defects probes.
//   const { page, tap, ready, close } = await open({ size, save, query, title, pace })
//   size   'desktop' (1280×900, mouse) or 'phone' (390×844, touch). Default 'desktop'.
//   save   an object for localStorage 'kingdown.save' (the Save shape in src/main.ts), or null for none.
//   query  a search string such as '?fen=...' or '?labels=1'.
//   title  true keeps the title screen; default false skips it.
//   pace   the Settings → Animations value; default 'off', so a check waits for no motion.
// tap(sq) taps (phone) or clicks (desktop) the centre of square sq (0 = a1 ... 63 = h8).
// The probes reach the app's controls and readouts through tools/app-ui.mjs.
import { setPace } from '../app-ui.mjs';

export const SIZES = {
  desktop: { viewport: { width: 1280, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
};

export const opener = (browser, base, trapErrors) => async ({ size = 'desktop', save = null, query = '', title = false, pace = 'off' } = {}) => {
  const context = await browser.newContext(SIZES[size]);
  await context.addInitScript(([saved, keepTitle]) => {
    if (sessionStorage.getItem('ux-defects.seeded')) return;
    sessionStorage.setItem('ux-defects.seeded', '1');
    if (!keepTitle) sessionStorage.setItem('kingdown.title-seen', '1');
    if (saved) localStorage.setItem('kingdown.save', JSON.stringify(saved));
  }, [save, title]);
  const page = await context.newPage();
  trapErrors(page);
  await page.goto(new URL(query, base).href);
  const ready = async () => {
    await page.waitForFunction(() => window.view?.ready);
    await page.evaluate(() => window.view.ready());
  };
  if (!title) {
    await ready();
    if (pace) await setPace(page, pace);
  }
  const tap = async sq => {
    const p = await page.evaluate(s => window.view.screenOf(s), sq);
    if (size === 'phone') await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
  };
  return { page, tap, ready, close: () => context.close() };
};
