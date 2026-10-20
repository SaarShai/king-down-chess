import assert from 'node:assert/strict';
import sharp from 'sharp';

export async function checkTabletButtons(root, selector) {
  const buttons = await root.locator(selector).evaluateAll(buttons => buttons.filter(el => el.checkVisibility()).map(el => {
    const s = getComputedStyle(el), face = getComputedStyle(el, '::before');
    return { name: el.textContent, height: el.getBoundingClientRect().height, font: s.fontSize, weight: s.fontWeight,
      clip: s.clipPath, face: face.clipPath, pointer: face.pointerEvents, radius: s.borderRadius };
  }));
  assert(buttons.length, `The tablet sample is visible: ${selector}`);
  for (const s of buttons) {
    assert(s.height >= 48, `${s.name} keeps a 48 px face`);
    assert.equal(s.font, '18px', s.name); assert.equal(s.weight, '700', s.name);
    assert.equal(s.clip, 'none', 'The text and focus are not clipped');
    assert.match(s.face, /polygon\(4px 0px/); assert.equal(s.pointer, 'none'); assert.equal(s.radius, '0px');
  }
}

export async function checkButtonContent(root, selector) {
  const faults = await root.locator(selector).evaluateAll(buttons => buttons.filter(el => el.checkVisibility()).flatMap(button => {
    const b = button.getBoundingClientRect(), boxes = [...button.querySelectorAll('svg')].map(el => el.getBoundingClientRect());
    const text = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    for (let node; (node = text.nextNode());) if (node.textContent.trim()) {
      const range = document.createRange(); range.selectNodeContents(node); boxes.push(...range.getClientRects());
    }
    return boxes.filter(r => r.width && r.height && (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1)).map(() => button.id || button.textContent);
  }));
  assert.deepEqual(faults, [], 'The text and icons fit each button face');
}

export async function checkMenuContent(root, selector) {
  const gaps = await root.locator(selector).evaluateAll(rows => rows.filter(el => el.checkVisibility()).map(el => {
    const chevron = el.querySelector('i').getBoundingClientRect(), line = el.querySelector('.line');
    const range = document.createRange(); range.selectNodeContents(line);
    return { gap: Math.min(chevron.left - line.getBoundingClientRect().right, ...[...range.getClientRects()].filter(r => r.top < chevron.bottom && r.bottom > chevron.top).map(r => chevron.left - r.right)), padding: getComputedStyle(el).paddingRight };
  }));
  assert(gaps.length, 'The menu text sample is visible');
  assert(gaps.every(row => row.gap >= 0), `Menu words keep clear of the chevron: ${JSON.stringify(gaps)}`);
}

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
  await checkTabletButtons(frame, '#home-play, #home-games');
  assert.equal((await main.boundingBox()).height, 52, 'The main tablet is 52 px tall');
  assert.equal((await small.boundingBox()).height, 48, 'The small tablet is 48 px tall');
  const red = await main.evaluate(el => {
    const s = getComputedStyle(el), face = getComputedStyle(el, '::before');
    return { color: s.color, image: face.backgroundImage, face: face.backgroundColor, edge: face.borderTopColor, light: face.boxShadow, clip: face.clipPath, compact: innerWidth <= 360 };
  });
  assert.equal(red.image, red.compact ? 'none' : 'linear-gradient(90deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0) 18%, rgba(0, 0, 0, 0) 82%, rgba(0, 0, 0, 0.12))', 'The cloth face has a soft fold shade, with no grain; small screens use a plain face');
  assert.match(red.clip, /calc\(50% \+ 9px\) 100%, 50% calc\(100% - 6px\), calc\(50% - 9px\) 100%/, 'The banner has a short lower notch');
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

export async function checkFlatRows(frame, selector) {
  const rows = await frame.locator(selector).evaluateAll(rows => rows.filter(el => el.checkVisibility()).map(el => {
    const s = getComputedStyle(el), face = getComputedStyle(el, '::before');
    return { image: s.backgroundImage, shadow: s.boxShadow, face: face.content, border: s.borderBottomWidth, height: el.getBoundingClientRect().height, transform: s.transform };
  }));
  assert(rows.length, 'The reading-row sample is visible');
  for (const row of rows) {
    assert.equal(row.image, 'none'); assert.equal(row.shadow, 'none'); assert.equal(row.border, '1px');
    assert(['none', 'normal'].includes(row.face), 'A flat row has no raised face');
    assert(row.height >= 48, 'A reading row keeps its 48 px target'); assert.equal(row.transform, 'none');
  }
}

export async function checkSegments(page, frame) {
  const label = frame.locator('#online-visibility label:has(input:checked)');
  await frame.locator('#online-visibility input:checked').evaluate(el => el.blur());
  const before = await label.screenshot({ scale: 'css' });
  const style = await frame.locator('#online-visibility label:has(input:checked)').evaluate(el => {
    const s = getComputedStyle(el); return { color: s.color, face: s.backgroundColor, image: s.backgroundImage, ring: s.boxShadow };
  });
  assert.equal(style.face, 'rgb(77, 69, 60)'); assert.equal(style.color, 'rgb(251, 247, 238)');
  assert.equal(style.image, 'none'); assert.match(style.ring, /rgb\(233, 192, 113\).*2px/);
  const radio = frame.locator('#online-visibility input:checked');
  await page.keyboard.press('Tab'); await radio.focus();
  const focus = await radio.evaluate(el => { const s = getComputedStyle(el.closest('label')); return { keyboard: el.matches(':focus-visible'), ink: s.outlineColor, width: s.outlineWidth, gold: s.boxShadow }; });
  assert(focus.keyboard, 'The selected segment has keyboard focus'); assert.equal(focus.ink, 'rgb(43, 38, 33)'); assert.equal(focus.width, '2px');
  assert.match(focus.gold, /rgb\(233, 192, 113\).*4px/);
  const after = await label.screenshot({ scale: 'css' });
  const pixels = await Promise.all([before, after].map(buffer => sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
  const at = (image, y) => [...image.data.subarray((y * image.info.width + Math.floor(image.info.width / 2)) * 3, (y * image.info.width + Math.floor(image.info.width / 2)) * 3 + 3)];
  const light = rgb => rgb.map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
  const contrast = (a, b) => (Math.max(light(a), light(b)) + .05) / (Math.min(light(a), light(b)) + .05);
  const selected = at(pixels[0], 1), focused = at(pixels[1], 1);
  assert(contrast(selected, focused) >= contrast(selected, [28, 91, 176]), 'Focus changes the selected ring with at least the old blue contrast');
  assert(contrast(at(pixels[0], 3), at(pixels[1], 3)) >= 4.5, 'The inner focus band changes the dark face at 4.5:1 or more');
}

export async function checkFocus(page, frame) {
  const button = frame.locator('#home-play');
  await page.keyboard.press('Tab'); await button.focus();
  const ring = await button.evaluate(el => { const s = getComputedStyle(el); return { keyboard: el.matches(':focus-visible'), color: s.outlineColor, width: s.outlineWidth, shadow: s.boxShadow }; });
  assert(ring.keyboard, 'The main action has keyboard focus'); assert.equal(ring.color, 'rgb(43, 38, 33)'); assert.equal(ring.width, '2px');
  assert.match(ring.shadow, /rgb\(233, 192, 113\).*4px/);
}
