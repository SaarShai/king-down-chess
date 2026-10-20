import assert from 'node:assert/strict';
import { shot } from './checks.mjs';

export async function checkCardChoices(page, frame, mount, setup, cards) {
  await mount(setup);
  const grid = frame.locator('#setup-card-grid'), sheet = frame.locator('#menu-sheet');
  const noLoops = async root => assert.equal(await root.evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.playState === 'running' && a.effect.getComputedTiming().iterations === Infinity).length), 0, 'Card art has no running loop');
  const transform = face => face.evaluate(async el => {
    await Promise.all(el.getAnimations().map(a => a.finished));
    await new Promise(resolve => requestAnimationFrame(() => resolve()));
    return getComputedStyle(el).transform;
  });
  await noLoops(grid);
  assert.equal(await grid.locator('.card-face').count(), 4);
  for (const width of [197, 393, 1000]) {
    await page.setViewportSize({ width, height: 900 });
    const boxes = await grid.locator('.card-face').evaluateAll(faces => faces.map(f => { const r = f.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right }; }));
    assert.equal(boxes[0].y, boxes[1].y); assert.equal(boxes[2].y, boxes[3].y);
    assert(boxes[2].y > boxes[0].y && boxes[1].x > boxes[0].x, 'The four faces form two rows and two columns');
    assert(boxes.every(b => b.x >= 0 && b.right <= width), 'The grid fits the frame');
  }
  await page.setViewportSize({ width: 393, height: 900 });
  assert.equal(await grid.locator('[aria-pressed]').count(), 0, 'New game cards do not claim a toggle state');
  for (const face of await grid.locator('.card-face').all()) {
    assert(await face.locator('b').innerText()); assert(await face.locator('small').innerText()); assert(await face.locator('.cf-cost').innerText());
  }
  await grid.locator('[data-card="Haste"]').click();
  assert(await sheet.locator('input[value="Haste"]').evaluate(el => el === document.activeElement), 'A card tap opens Cards at that card');
  await frame.locator('#menu-close').click();
  assert(await grid.locator('[data-card="Haste"]').evaluate(el => el === document.activeElement), 'Close returns focus to the card');
  await frame.locator('#setup-cards').click();
  await sheet.getByRole('radio', { name: 'Pick four', exact: true }).locator('..').click();
  assert.equal(await sheet.locator('.card-grid input:checked').count(), 0);
  const haste = sheet.locator('label.card-face:has(input[value="Haste"])');
  assert.equal(await haste.evaluate(el => getComputedStyle(el).transitionDuration), '0.14s');
  assert.equal(await transform(haste), 'none');
  await haste.locator('input').check();
  assert.equal(await transform(haste), 'matrix(1, 0, 0, 1, 0, -3)', 'A checked card lifts 3 px');
  assert.deepEqual(await sheet.locator('label.card-face:not(:has(input:checked))').evaluateAll(faces => faces.map(f => getComputedStyle(f).transform)), cards.slice(1).map(() => 'none'));
  await haste.locator('input').uncheck();
  assert.equal(await transform(haste), 'none', 'An unchecked card returns to its first position');
  await noLoops(sheet);
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
  for (const card of cards.slice(3, 6)) await sheet.locator(`input[value="${card}"]`).check();
  await frame.locator('#setup-done').click();
  assert((await frame.locator('#setup-cards').innerText()).startsWith('6 cards'));
  assert((await frame.locator('#setup-deal-note').innerText()).includes('at random'));
  await frame.locator('#setup-cards').click();
  assert(await sheet.getByRole('radio', { name: 'Use all cards', exact: true }).isChecked());
  await sheet.getByRole('radio', { name: 'Pick four', exact: true }).locator('..').click();
  await sheet.getByRole('radio', { name: 'Use all cards', exact: true }).locator('..').click();
  assert.deepEqual(await sheet.locator('.card-grid input:checked').evaluateAll(inputs => inputs.map(i => i.value)), cards.slice(0, 6), 'A mode round trip keeps the saved pool');
  await frame.locator('#setup-done').click();
  assert((await frame.locator('#setup-cards').innerText()).startsWith('6 cards'));
  await frame.locator('#setup-cards').click();
  await sheet.locator('input[value="Haste"]').uncheck();
  // WebKit does not give keyboard focus to a checkbox on a pointer click.
  await sheet.locator('input[value="Haste"]').focus();
  const beforeSheet = await sheet.elementHandle(), beforeCard = await grid.locator('.card-face').first().elementHandle();
  const focused = await sheet.locator('input:focus').getAttribute('value');
  assert.equal(focused, 'Haste', 'The refresh starts with keyboard focus on the changed card');
  const result = await (await page.request.post(new URL('/fixture-tool', page.url()).href, { data: { name: 'kingdown_open', arguments: { screen: 'play' } } })).json();
  assert(!result.isError);
  await page.evaluate(result => window.harnessShow(result), result);
  await beforeCard.waitForElementState('hidden');
  assert(await sheet.evaluate((el, before) => el === before, beforeSheet), 'A host refresh keeps the open sheet');
  await beforeSheet.dispose(); await beforeCard.dispose();
  assert.equal(await sheet.locator('input:focus').getAttribute('value'), focused, 'A host refresh keeps focus');
  assert(!await sheet.locator('input[value="Haste"]').isChecked(), 'A host refresh keeps the card draft');
  assert.equal(await sheet.locator('.card-grid input:checked').count(), 5);
  await frame.locator('#setup-done').click();
  assert((await frame.locator('#setup-cards').innerText()).startsWith('5 cards'), 'Done saves the draft after a host refresh');
  await frame.locator('#setup-cards').click();
  const art = await sheet.locator('.card-face').evaluateAll(faces => faces.map(f => ({ card: f.querySelector('input').value, image: !!f.querySelector('.cf-art img'), scene: !!f.querySelector('.cf-art .pm'), picture: !!f.querySelector('.cf-art .card-picture'), name: f.querySelector('b').textContent })));
  assert.equal(art.filter(a => a.image).length, 12); assert.equal(art.filter(a => a.scene).length, 0); assert.equal(art.filter(a => a.picture).length, 9);
  assert(!await sheet.locator('img[src*="back.webp"]').count());
  await frame.locator('#menu-close').click();
  // Built-page checks use visible controls; source-harness app helpers are absent.
  await frame.locator('[data-screen="play"] [data-nav="profile"]').click();
  await frame.locator('[data-screen="profile"] [data-nav="collection"]').click();
  await frame.locator('#collection-tabs label').filter({ hasText: 'Cards' }).click();
  const collection = await frame.locator('#collection-items .card-face').evaluateAll(faces => faces.map(f => ({ card: f.dataset.card, image: !!f.querySelector('.cf-art img'), scene: !!f.querySelector('.cf-art .pm'), picture: !!f.querySelector('.cf-art .card-picture'), name: f.querySelector('b').textContent })));
  assert.deepEqual(collection, art, 'The sheet and Collection share card art and names');
  await noLoops(frame.locator('#collection-items'));
  console.log('Cards: grid, names, art, costs, both modes and all three cancel paths pass');
}

export async function measureCardCoins(frame, output) {
  const { default: sharp } = await import('sharp');
  const { writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const rgb = text => text.match(/[\d.]+/g).slice(0, 3).map(Number);
  const light = values => values.map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((s, c, i) => s + c * [.2126,.7152,.0722][i], 0);
  const contrast = (a, b) => { const x = light(a), y = light(b); return (Math.max(x,y) + .05) / (Math.min(x,y) + .05); };
  const rings = await frame.locator('.card-coin > .coin-paint').evaluateAll(coins => coins.map(c => ({ side: c.closest('.player-strip').id, color: getComputedStyle(c).borderColor })));
  assert.equal(new Set(rings.map(r => r.color)).size, 2, 'The hands have different rings');
  const ringDifference = contrast(rgb(rings.find(r => r.side === 'strip-me').color), rgb(rings.find(r => r.side === 'strip-them').color));
  assert(ringDifference >= 3, 'The two hand rings have at least 3:1 contrast');
  for (const side of ['strip-me', 'strip-them']) {
    const coin = frame.locator(`#${side} .card-coin > .coin-paint`).first();
    const style = await coin.getAttribute('style');
    // Read the face under the ring, with its border, shadow and children hidden.
    const children = await coin.evaluate(el => {
      el.style.setProperty('transition', 'none', 'important');
      el.style.setProperty('border-color', 'transparent', 'important'); el.style.setProperty('box-shadow', 'none', 'important');
      return [...el.children].map(child => { const style = child.getAttribute('style'); child.style.setProperty('visibility', 'hidden', 'important'); return style; });
    });
    let pixels;
    try { pixels = await sharp(await coin.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true }); }
    finally { await coin.evaluate((el, saved) => {
      if (saved.style === null) el.removeAttribute('style'); else el.setAttribute('style', saved.style);
      [...el.children].forEach((child, i) => { if (saved.children[i] === null) child.removeAttribute('style'); else child.setAttribute('style', saved.children[i]); });
    }, { style, children }); }
    const { data, info } = pixels, radius = Math.min(info.width, info.height) / 2;
    let min = Infinity;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      const distance = Math.hypot(x + .5 - info.width / 2, y + .5 - info.height / 2);
      if (distance < radius - 3 || distance > radius - 1.5) continue;
      const offset = (y * info.width + x) * info.channels, color = rings.find(r => r.side === side).color;
      min = Math.min(min, contrast(rgb(color), [...data.subarray(offset, offset + 3)]));
    }
    assert(min >= 3, `${side} ring has at least 3:1 contrast against its coin face (${min.toFixed(2)})`);
    for (const ring of rings.filter(r => r.side === side)) ring.minContrastOnCoinFace = Number(min.toFixed(2));
  }
  assert.equal(await frame.locator('.card-coin .cc-word').count(), 0, 'Card coins use no letter pairs');
  for (const symbol of await frame.locator('.card-coin .card-symbol').all()) {
    assert(await symbol.evaluate(el => el.getBoundingClientRect().width >= 20), 'A coin symbol stays clear at its smallest size');
  }
  const report = { rings, ringDifference: Number(ringDifference.toFixed(2)), status: 'No coin letters remain.' };
  await writeFile(join(output, 'card-contrast.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('F38 card contrast:', JSON.stringify(report));
}
