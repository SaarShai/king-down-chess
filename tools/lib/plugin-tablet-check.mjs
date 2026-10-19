import assert from 'node:assert/strict';

export async function checkTabletSelection(frame) {
  const selected = await frame.locator('.power-choice button[aria-pressed="true"]').evaluate(el => {
    const text = getComputedStyle(el), face = getComputedStyle(el, '::before');
    return { color: text.color, face: face.backgroundColor, blend: face.backgroundBlendMode, edge: face.borderColor };
  });
  assert.equal(selected.color, 'rgb(251, 247, 238)'); assert.equal(selected.face, 'rgb(77, 69, 60)');
  assert.equal(selected.blend, 'multiply'); assert.equal(selected.edge, 'rgb(233, 192, 113)');
  const heights = await frame.locator('.power-choice button').evaluateAll(buttons => buttons.filter(button => button.checkVisibility()).map(button => button.getBoundingClientRect().height));
  assert(heights.every(height => Math.abs(height - heights[0]) < 1), 'Power choices share one face height');
}


export async function checkTablet(page, frame) {
  const main = frame.locator('#home-play'), small = frame.locator('#home-games');
  const style = button => button.evaluate(el => {
    const s = getComputedStyle(el), face = getComputedStyle(el, '::before');
    return { height: el.getBoundingClientRect().height, font: s.fontSize, weight: s.fontWeight,
      clip: s.clipPath, face: face.clipPath, pointer: face.pointerEvents, radius: s.borderRadius };
  });
  const a = await style(main), b = await style(small);
  assert.equal(a.height, 52, 'The main tablet is 52 px tall');
  assert.equal(b.height, 48, 'The small tablet is 48 px tall');
  for (const s of [a, b]) {
    assert.equal(s.font, '18px'); assert.equal(s.weight, '700');
    assert.equal(s.clip, 'none', 'The text and focus are not clipped');
    assert.match(s.face, /polygon\(4px 0px/); assert.equal(s.pointer, 'none'); assert.equal(s.radius, '0px');
  }
  const red = await main.evaluate(el => {
    const s = getComputedStyle(el), face = getComputedStyle(el, '::before');
    return { color: s.color, image: face.backgroundImage, face: face.backgroundColor, edge: face.borderTopColor, light: face.boxShadow };
  });
  assert.equal(red.image, 'none', 'The red face has no stone grain');
  assert.equal(red.face, 'rgb(132, 44, 33)'); assert.equal(red.color, 'rgb(251, 247, 238)');
  assert.equal(red.edge, 'rgb(90, 28, 20)'); assert.match(red.light, /rgb\(156, 58, 45\).*0px 1px/);
  const box = await small.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  try {
    await small.evaluate(el => new Promise(resolve => {
      const end = performance.now() + 1000;
      const read = () => { if (getComputedStyle(el).transform === 'matrix(1, 0, 0, 1, 0, 2)') resolve(); else if (performance.now() < end) requestAnimationFrame(read); else resolve(); };
      requestAnimationFrame(read);
    }));
    assert.equal(await small.evaluate(el => getComputedStyle(el).transform), 'matrix(1, 0, 0, 1, 0, 2)');
    assert.equal(await small.evaluate(el => getComputedStyle(el, '::before').bottom), '2px', 'The face fits the 2 px press');
  } finally { await page.mouse.move(0, 0); await page.mouse.up(); }
}
