import assert from 'node:assert/strict';
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Compare both inset focus bands with the same pixels before focus, on all four sides.
export async function checkCoinFocus(page, frame, selector, output, name = 'coin') {
  const coin = frame.locator(selector);
  await coin.blur();
  const box = await coin.boundingBox();
  assert(box, 'The coin is visible');
  const clip = { x: Math.floor(box.x) - 5, y: Math.floor(box.y) - 5, width: Math.ceil(box.width) + 11, height: Math.ceil(box.height) + 11 };
  const before = await page.screenshot({ clip, scale: 'css' });
  await page.keyboard.press('Tab'); await coin.focus();
  const style = await coin.evaluate(el => {
    const s = getComputedStyle(el), paint = el.querySelector(':scope > .coin-paint'), p = getComputedStyle(paint);
    return { keyboard: el.matches(':focus-visible'), children: el.children.length, paint: el.querySelectorAll('.coin-paint').length,
      opacity: s.opacity, filter: s.filter, background: s.backgroundColor, border: s.borderColor,
      faceOpacity: p.opacity, faceFilter: p.filter, ink: s.outlineColor, width: s.outlineWidth, offset: s.outlineOffset, gold: s.boxShadow };
  });
  assert(style.keyboard, 'The coin has keyboard focus');
  assert.equal(style.children, 1); assert.equal(style.paint, 1, 'Each button has one paint span');
  assert.equal(style.opacity, '1'); assert.equal(style.filter, 'none');
  assert.equal(style.background, 'rgba(0, 0, 0, 0)'); assert.equal(style.border, 'rgba(0, 0, 0, 0)');
  assert.equal(style.faceOpacity, await coin.evaluate(el => el.classList.contains('card-coin') ? '0.85' : '0.7'));
  assert.equal(style.faceFilter, 'grayscale(1)');
  assert.equal(style.ink, 'rgb(43, 38, 33)'); assert.equal(style.width, '2px');
  assert.equal(style.offset, '-2px', 'The focus pair stays inside the coin at the frame edge');
  assert.match(style.gold, /rgb\(233, 192, 113\).*4px/);
  const after = await page.screenshot({ clip, scale: 'css' });
  const pixels = await Promise.all([before, after].map(buffer => sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
  const at = (image, x, y) => {
    const offset = (Math.floor(y) * image.info.width + Math.floor(x)) * 3;
    return [...image.data.subarray(offset, offset + 3)];
  };
  const light = rgb => rgb.map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((s, c, i) => s + c * [.2126, .7152, .0722][i], 0);
  const contrast = (a, b) => (Math.max(light(a), light(b)) + .05) / (Math.min(light(a), light(b)) + .05);
  const x = box.x - clip.x, y = box.y - clip.y, w = box.width, h = box.height;
  const sides = [
    [[x + w / 2, y + 1], [x + w / 2, y + 3]],
    [[x + w / 2, y + h - 1], [x + w / 2, y + h - 3]],
    [[x + 1, y + h / 2], [x + 3, y + h / 2]],
    [[x + w - 1, y + h / 2], [x + w - 3, y + h / 2]],
  ];
  const contrasts = sides.map(bands => Math.max(...bands.map(([x, y]) => contrast(at(pixels[0], x, y), at(pixels[1], x, y)))));
  if (output) {
    await writeFile(join(output, `${name}-before.png`), before);
    await writeFile(join(output, `${name}-focus.png`), after);
  }
  assert(contrasts.every(value => value >= 3), `${selector} focus has at least 3:1 on each side: ${JSON.stringify(contrasts)}`);
  await coin.blur();
  return { selector, minContrast: Number(Math.min(...contrasts).toFixed(2)) };
}
