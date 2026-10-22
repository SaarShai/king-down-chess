import { expect, it } from 'vitest';
import { chromium } from 'playwright';
import { checkFlatRows } from './lib/plugin-tablet-check.mjs';

it.each(['button', 'label'])('measures the resting %s row while keeping focus-ring checks separate', async kind => {
  const browser = await chromium.launch({ headless: true }), page = await browser.newPage();
  try {
    await page.setContent(`<style>.row { display:block; min-height:48px; background:none; box-shadow:none; border:0; border-bottom:1px solid; transform:none; }
      .row:focus, .row:has(:focus) { box-shadow:0 0 0 4px rgb(233,192,113); }</style>
      ${kind === 'button' ? '<button class="row">Row</button>' : '<label class="row"><input type="checkbox">Row</label>'}`);
    const control = page.locator(kind === 'button' ? 'button' : 'input');
    await control.focus();
    expect(await page.locator('.row').evaluate(row => getComputedStyle(row).boxShadow)).toBe('rgb(233, 192, 113) 0px 0px 0px 4px');
    await checkFlatRows(page, '.row');
    expect(await control.evaluate(control => control === document.activeElement)).toBe(false);
  } finally { await browser.close(); }
});
