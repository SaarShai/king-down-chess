import assert from 'node:assert/strict';
import { shot } from './checks.mjs';
import { settled } from './plugin-settled.mjs';

export async function checkCardChoices(page, frame, mount, setup, cards) {
  await mount(setup);
  const noLoops = async target => assert(await target.evaluate(e => e.getAnimations({subtree:true}).every(a => a.playState !== 'running' || a.effect.getComputedTiming().endTime !== Infinity)), 'Cards have no infinite animation');
  const grid=frame.locator('#setup-card-pool'), body=frame.locator('#cards-body'), sheet=frame.locator('#menu-sheet');
  const selected=()=>grid.locator('input:checked').evaluateAll(inputs=>inputs.map(i=>i.value));
  const transform = face => face.evaluate(async el => {
    await Promise.all(el.getAnimations().map(a => a.finished));
    await new Promise(resolve => requestAnimationFrame(() => resolve()));
    return getComputedStyle(el).transform;
  });
  assert.equal(await grid.locator('[data-card]').count(),cards.length);
  assert.equal(await grid.locator('small, .cf-cost').count(),0,'Tiles show art and name only');
  for(const [width,height] of [[1280,800],[1000,900],[393,900],[390,844],[320,568],[197,900]]) {
    await page.setViewportSize({width,height});
    // Each tile, name and corner check fits the box; a name breaks only between words; the clear 44 px hit area holds a small check in the tile corner.
    const fit=await grid.evaluate(g=>{ g.scrollTop=0; const r=g.getBoundingClientRect(), labels=[...g.querySelectorAll('.card-use')];
      return { grid:r.left>=0&&r.right<=document.documentElement.clientWidth,
        tiles:[...g.querySelectorAll('.setup-card')].every(t=>{ const b=t.getBoundingClientRect(); return b.left>=r.left&&b.right<=r.right; }),
        names:[...g.querySelectorAll('b')].every(b=>b.scrollWidth<=b.clientWidth&&getComputedStyle(b).overflowWrap==='normal'&&getComputedStyle(b).wordBreak==='normal'),
        checks:labels.every(l=>{ const box=l.getBoundingClientRect(), input=l.querySelector('input').getBoundingClientRect(), tile=l.parentElement.getBoundingClientRect();
          return box.width>=44&&box.height>=44&&box.left>=r.left&&box.right<=r.right&&input.width<=22&&input.right<=tile.right&&tile.right-input.right<=8&&input.top>=tile.top&&input.top-tile.top<=8; })&&labels[0].getBoundingClientRect().top>=r.top }; });
    assert.deepEqual(fit,{grid:true,tiles:true,names:true,checks:true},`The card box fits at ${width} px`);
    assert(await grid.evaluate(e=>e.scrollHeight>e.clientHeight && getComputedStyle(e).overflowY==='auto' && getComputedStyle(e).overscrollBehaviorY==='contain'),'The card box contains its scroll');
    assert(await frame.locator('html').evaluate(e=>e.scrollWidth<=e.clientWidth),'The page fits');
    await grid.evaluate(e=>{e.scrollTop=e.scrollHeight;});
    assert(await grid.evaluate(e=>e.scrollTop>0));
  }
  await page.setViewportSize({width:393,height:900});
  await frame.locator('#setup-card-Haste').click();
  assert(await sheet.locator('small').innerText()); assert(await sheet.locator('.cf-cost').innerText());
  await noLoops(sheet);
  await frame.locator('#menu-close').click();
  assert(await frame.locator('#setup-card-Haste').evaluate(e=>e===document.activeElement),'Close returns focus to the tile');
  for(const exit of ['Escape','scrim','Done']) {
    await frame.locator('#setup-card-Haste').click(); await sheet.waitFor();
    if(exit==='Escape') await page.keyboard.press('Escape');
    else if(exit==='scrim') await frame.locator('.scrim').click({position:{x:2,y:2}});
    else await frame.locator('#setup-done').click();
    assert.equal(await sheet.count(),0,`${exit} closes the full card`);
    assert(await frame.locator('#setup-card-Haste').evaluate(e=>e===document.activeElement),`${exit} returns focus to the tile`);
  }
  await body.getByRole('radio',{name:'Pick four',exact:true}).locator('..').click();
  assert.equal((await selected()).length,0);
  await frame.locator('#setup-start').click();
  assert.equal(await frame.locator('#setup-card-status').innerText(),'Pick 4 more cards.');
  await frame.locator('#setup-start-status',{hasText:/^Pick 4 more cards\.$/}).waitFor({state:'attached'});
  assert(await frame.locator('[data-screen="play"]').isVisible(),'An incomplete pool does not start a game');
  const haste=grid.locator('[data-card="Haste"] .card-face');
  assert.equal(await haste.evaluate(el=>getComputedStyle(el).transitionDuration),'0.14s');
  assert.equal(await transform(haste),'none');
  await grid.locator('input[value="Haste"]').check();
  assert.equal(await transform(haste),'matrix(1, 0, 0, 1, 0, -3)','A checked card lifts 3 px');
  assert.deepEqual(await grid.locator('.setup-card:not(:has(input:checked)) .card-face').evaluateAll(faces=>faces.map(f=>getComputedStyle(f).transform)),cards.slice(1).map(()=>'none'));
  await grid.locator('input[value="Haste"]').uncheck();
  assert.equal(await transform(haste),'none','An unchecked card returns to its first position');
  const picked=['MirrorB','MorphP','Haste','Flight'];
  for(const card of picked) await grid.locator(`input[value="${card}"]`).check();
  assert.equal(await grid.locator('input:not(:checked):disabled').count(),cards.length-4);
  await grid.locator('input[value="MirrorB"]').uncheck();
  assert(!await grid.locator('input[value="Freeze"]').isDisabled());
  await grid.locator('input[value="MirrorB"]').check();
  assert.deepEqual(new Set(await selected()),new Set(picked));
  assert.equal(await grid.locator('[data-card="MirrorB"] b').innerText(),'Mirror');
  assert.equal(await grid.locator('[data-card="MorphP"] b').innerText(),'Morph');
  await shot(page,'cards-picked-four');
  await body.getByRole('radio',{name:'Use all cards',exact:true}).locator('..').click();
  assert.equal((await selected()).length,cards.length);
  for(const card of cards.slice(4)) await grid.locator(`input[value="${card}"]`).uncheck();
  assert.equal(await grid.locator('input:checked:disabled').count(),4,'The last four cards lock');
  assert(await frame.locator('#setup-card-lock').isVisible());
  for(const card of cards.slice(4,6)) await grid.locator(`input[value="${card}"]`).check();
  await body.getByRole('radio',{name:'Pick four',exact:true}).locator('..').click();
  await body.getByRole('radio',{name:'Use all cards',exact:true}).locator('..').click();
  assert.deepEqual(await selected(),cards.slice(0,6),'A mode round trip keeps the all-card pool');
  await frame.locator('#setup-card-Haste').click();
  await sheet.locator('input').uncheck(); await sheet.locator('input').focus();
  const before=await sheet.elementHandle();
  const result=await (await page.request.post(new URL('/fixture-tool',page.url()).href,{data:{name:'kingdown_open',arguments:{screen:'play'}}})).json();
  assert(!result.isError); await page.evaluate(result=>window.harnessShow(result),result); await settled(page,frame);
  assert(await sheet.evaluate((e,before)=>e===before,before),'A host refresh keeps the card sheet'); await before.dispose();
  assert(await sheet.locator('input').evaluate(e=>e===document.activeElement),'A host refresh keeps focus');
  assert(!await sheet.locator('input').isChecked(),'The sheet keeps the inline pool change');
  await frame.locator('#menu-close').click();
  assert.equal((await selected()).length,5);
  const art=await grid.locator('[data-card]').evaluateAll(faces=>faces.map(f=>({card:f.dataset.card,image:!!f.querySelector('.cf-art img'),scene:!!f.querySelector('.cf-art .pm'),picture:!!f.querySelector('.cf-art .card-picture'),name:f.querySelector('b').textContent})));
  assert.equal(art.filter(a=>a.image).length,12); assert.equal(art.filter(a=>a.picture).length,9);
  assert.equal(await grid.locator('img[src*="back.webp"]').count(),0);
  await noLoops(grid);
  await frame.locator('[data-screen="play"] [data-nav="profile"]').click();
  await frame.locator('[data-screen="profile"] [data-nav="collection"]').click();
  await frame.locator('#collection-tabs label').filter({hasText:'Cards'}).click();
  const collection=await frame.locator('#collection-items .card-face').evaluateAll(faces=>faces.map(f=>({card:f.dataset.card,image:!!f.querySelector('.cf-art img'),scene:!!f.querySelector('.cf-art .pm'),picture:!!f.querySelector('.cf-art .card-picture'),name:f.querySelector('b').textContent})));
  assert.deepEqual(collection,art,'The pool and Collection share art and names');
  await noLoops(frame.locator('#collection-items'));
  console.log('Cards: inline grid, full card, focus, art, both modes, locks and refresh pass');
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
