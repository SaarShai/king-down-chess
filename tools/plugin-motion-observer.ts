import type { Page } from 'playwright';

/** Record short motion states before a slow browser call can miss them. */
export async function watchMotion(page: Page, selector: string) {
  const watch = (selector: string) => {
    const state = ((window as any).motionWatch ??= {})[selector] = { count: 0, running: 0 };
    new MutationObserver(() => {
      const elements = [...document.querySelectorAll(selector)];
      state.count = Math.max(state.count, elements.length);
      state.running = Math.max(state.running, elements.flatMap(e => e.getAnimations({ subtree: true })).filter(a => a.playState === 'running').length);
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  };
  // A fresh widget has a new document. Install the watch before its app starts.
  await page.addInitScript(watch, selector);
  const frame = page.frameLocator('iframe');
  // Frame.evaluate passes the selector directly, as addInitScript does.
  await page.frames().find(f => f.parentFrame() === page.mainFrame())!.evaluate(watch, selector);
  return () => frame.locator('html').evaluate((_, selector) => (window as any).motionWatch[selector] as { count: number; running: number }, selector);
}
