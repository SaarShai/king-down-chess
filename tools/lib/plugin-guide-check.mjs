import assert from 'node:assert/strict';

export async function checkGuide(page, frame) {
  const { LESSONS } = await import('../../src/lessons.ts');
  const { lessonMoves, lessonPosition } = await import('../../src/plugin/screens/guide-model.ts');
  const { toLan } = await import('../../src/rules/setup.ts');
  const before = await page.evaluate(() => window.harnessView);
  await frame.locator('#board-menu').click();
  const sheet = frame.locator('#board-sheet');
  assert.equal(await sheet.locator('.sheet-body > button').last().getAttribute('id'), 'menu-resign');
  await frame.locator('#menu-guide').click();
  assert.equal(await frame.locator('.shelf-piece').count(), 6);
  for (const [index, lesson] of LESSONS.entries()) {
    await frame.locator(`.shelf-piece[data-lesson="${index}"]`).click();
    await frame.locator('#lesson-board canvas').waitFor();
    if (index === 0) {
      for (const [key, square] of [['ArrowRight', 'h4'], ['ArrowLeft', 'a4'], ['ArrowUp', 'a8'], ['ArrowDown', 'a1']]) {
        for (let count = 0; count < 8; count++) await frame.locator('#lesson-board').press(key);
        assert.match(await frame.locator('#lesson-board').getAttribute('aria-label'), new RegExp(`${square}\\.`));
      }
      await sheet.locator('.sheet-body > button').filter({ hasText: /^Guide$/ }).click();
      await frame.locator('.shelf-piece[data-lesson="0"]').click();
    }
    const position = lessonPosition(index), move = lessonMoves(index).find(move => lesson.goal(position, move));
    assert(move, `${lesson.name} has a goal move`);
    await frame.locator('#lesson-board').press('Enter');
    await frame.locator(`[data-lesson-move=${JSON.stringify(toLan(position, move))}]`).click();
    assert.equal(await frame.locator('#lesson-task').innerText(), lesson.done);
    await sheet.locator('.sheet-body > button').filter({ hasText: /^Guide$/ }).click();
  }
  assert.equal(await sheet.getByRole('button', { name: 'Return to game', exact: true }).count(), 1);
  await sheet.getByRole('button', { name: 'Return to game', exact: true }).click();
  const after = await page.evaluate(() => window.harnessView);
  for (const key of ['game_id', 'fen', 'revision']) assert.equal(after[key], before[key], `Guide keeps the live ${key}`);
  console.log('PASS: six Guide lessons, one return action and the same live game');
}
