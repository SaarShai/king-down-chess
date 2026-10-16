import assert from 'node:assert/strict';
import { shot } from './checks.mjs';

export async function checkCardChoices(page, frame, mount, setup, cards) {
  await mount(setup);
  const grid = frame.locator('#setup-card-grid'), sheet = frame.locator('#menu-sheet');
  assert.equal(await grid.locator('.card-face').count(), 4);
  for (const width of [197, 393, 1000]) {
    await page.setViewportSize({ width, height: 900 });
    const boxes = await grid.locator('.card-face').evaluateAll(faces => faces.map(f => { const r = f.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right }; }));
    assert.equal(boxes[0].y, boxes[1].y); assert.equal(boxes[2].y, boxes[3].y);
    assert(boxes[2].y > boxes[0].y && boxes[1].x > boxes[0].x, 'The four faces form two rows and two columns');
    assert(boxes.every(b => b.x >= 0 && b.right <= width), 'The grid fits the frame');
  }
  await page.setViewportSize({ width: 393, height: 900 });
  await grid.locator('button').first().click();
  assert.equal(await grid.locator('[aria-pressed="true"]').count(), 1);
  assert.equal(await grid.locator('button').first().evaluate(el => getComputedStyle(el).transitionDuration), '0.14s');
  for (const face of await grid.locator('.card-face').all()) {
    assert(await face.locator('b').innerText()); assert(await face.locator('small').innerText()); assert(await face.locator('.cf-cost').innerText());
  }
  await frame.locator('#setup-cards').click();
  await sheet.getByRole('radio', { name: 'Pick four', exact: true }).locator('..').click();
  assert.equal(await sheet.locator('.card-grid input:checked').count(), 0);
  await frame.locator('#setup-done').click();
  assert.equal(await sheet.locator('.foot-count').innerText(), 'Choose exactly 4 cards.');
  const picked = ['MirrorB','MorphP','Haste','Flight'];
  for (const card of picked) await sheet.locator(`input[value="${card}"]`).check();
  assert.equal(await sheet.locator('.card-grid input:checked:disabled').count(), 0);
  assert.equal(await sheet.locator('.card-grid input:not(:checked):disabled').count(), cards.length - 4);
  await sheet.locator('input[value="MirrorB"]').uncheck();
  assert(!await sheet.locator('input[value="Freeze"]').isDisabled());
  await sheet.locator('input[value="MirrorB"]').check();
  await frame.locator('#setup-done').click();
  const shown = () => grid.locator('[data-card]').evaluateAll(faces => faces.map(f => f.dataset.card));
  assert.deepEqual(await shown(), picked.filter(c => c !== 'MirrorB').concat('MirrorB'));
  assert.equal(await grid.locator('[data-card="MirrorB"] b').innerText(), 'Mirror');
  assert.equal(await grid.locator('[data-card="MorphP"] b').innerText(), 'Morph');
  const saved = await shown();
  await grid.scrollIntoViewIfNeeded(); await shot(page, 'cards-picked-four');
  for (const exit of ['Close','Escape','scrim']) {
    await frame.locator('#setup-cards').click(); await sheet.locator('input[value="MorphP"]').uncheck();
    if (exit === 'Close') await frame.locator('#menu-close').click();
    else if (exit === 'Escape') await page.keyboard.press('Escape');
    else await frame.locator('.scrim').click({ position: { x: 2, y: 2 } });
    assert.equal(await sheet.count(), 0); assert.deepEqual(await shown(), saved, `${exit} keeps the last valid pool`);
  }
  await frame.locator('#setup-cards').click();
  await sheet.getByRole('radio', { name: 'Use all cards', exact: true }).locator('..').click();
  assert.equal(await sheet.locator('.card-grid input:checked').count(), cards.length);
  for (const card of cards.slice(3)) await sheet.locator(`input[value="${card}"]`).uncheck();
  await frame.locator('#setup-done').click();
  assert.equal(await sheet.locator('.foot-count').innerText(), 'Keep at least 4 cards checked.');
  for (const card of cards.slice(3, 5)) await sheet.locator(`input[value="${card}"]`).check();
  await frame.locator('#setup-done').click();
  assert((await frame.locator('#setup-cards').innerText()).startsWith('5 cards'));
  assert((await frame.locator('#setup-deal-note').innerText()).includes('at random'));
  await frame.locator('#setup-cards').click();
  assert(await sheet.getByRole('radio', { name: 'Use all cards', exact: true }).isChecked());
  const art = await sheet.locator('.card-face').evaluateAll(faces => faces.map(f => ({ card: f.querySelector('input').value, image: !!f.querySelector('.cf-art img'), scene: !!f.querySelector('.cf-art .pm'), plain: f.querySelector('.cf-word')?.textContent, name: f.querySelector('b').textContent })));
  assert.equal(art.filter(a => a.image).length, 9); assert.equal(art.filter(a => a.scene).length, 3); assert.equal(art.filter(a => a.plain).length, 9);
  assert(!await sheet.locator('img[src*="back.webp"]').count());
  await frame.locator('#menu-close').click();
  // Built-page checks use visible controls; source-harness app helpers are absent.
  await frame.locator('[data-screen="play"] [data-nav="profile"]').click();
  await frame.locator('[data-screen="profile"] [data-nav="collection"]').click();
  await frame.locator('#collection-tabs label').filter({ hasText: 'Cards' }).click();
  const collection = await frame.locator('#collection-items .card-face').evaluateAll(faces => faces.map(f => ({ card: f.dataset.card, image: !!f.querySelector('.cf-art img'), scene: !!f.querySelector('.cf-art .pm'), plain: f.querySelector('.cf-word')?.textContent, name: f.querySelector('b').textContent })));
  assert.deepEqual(collection, art, 'The sheet and Collection share card art and names');
  console.log('Cards: grid, names, art, costs, both modes and all three cancel paths pass');
}

export async function measureCardCoins(frame, output) {
  const { default: sharp } = await import('sharp');
  const { writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const rgb = text => text.match(/[\d.]+/g).slice(0, 3).map(Number);
  const light = values => values.map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((s, c, i) => s + c * [.2126,.7152,.0722][i], 0);
  const contrast = (a, b) => { const x = light(a), y = light(b); return (Math.max(x,y) + .05) / (Math.min(x,y) + .05); };
  const rings = await frame.locator('.card-coin').evaluateAll(coins => coins.map(c => ({ side: c.closest('.player-strip').id, color: getComputedStyle(c).borderColor })));
  assert.equal(new Set(rings.map(r => r.color)).size, 2, 'The hands have different rings');
  for (const ring of rings) assert(contrast(rgb(ring.color), [251,247,238]) >= 3, 'Each ring contrasts with vellum');
  const letters = [];
  for (const word of await frame.locator('.card-coin .cc-word').all()) {
    const bounds = await word.evaluate(w => { const range = document.createRange(); range.selectNodeContents(w); const r = range.getBoundingClientRect(), c = w.closest('button').getBoundingClientRect(); return { text: w.textContent, color: getComputedStyle(w).color, x: r.x - c.x, y: r.y - c.y, width: r.width, height: r.height }; });
    await word.evaluate(w => { w.style.visibility = 'hidden'; });
    const { data, info } = await sharp(await word.locator('..').screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    await word.evaluate(w => { w.style.visibility = ''; });
    let min = Infinity;
    for (let y = Math.max(0, Math.floor(bounds.y)); y < Math.min(info.height, Math.ceil(bounds.y + bounds.height)); y++) for (let x = Math.max(0, Math.floor(bounds.x)); x < Math.min(info.width, Math.ceil(bounds.x + bounds.width)); x++) {
      const offset = (y * info.width + x) * info.channels;
      min = Math.min(min, contrast(rgb(bounds.color), [...data.subarray(offset, offset + 3)]));
    }
    letters.push({ text: bounds.text, minTextBoxContrast: Number(min.toFixed(2)) });
  }
  const report = { rings: rings.map(r => ({ ...r, contrastOnVellum: Number(contrast(rgb(r.color), [251,247,238]).toFixed(2)) })), letters, status: letters.length ? 'Board letters remain. The board lane owns their replacement.' : 'No coin letters remain.' };
  await writeFile(join(output, 'card-contrast.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('F38 card contrast:', JSON.stringify(report));
}
