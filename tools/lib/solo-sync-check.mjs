/** One mounted client follows commands from another host. No Refresh or pushed host result after open. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { shot } from './checks.mjs';

export async function checkSoloSync({ page, ui, tool, open, label }) {
  const call = async (name, args) => { const result = await tool(name, args); assert(!result.isError, `${name}: ${JSON.stringify(result)}`); return result._meta.view; };
  const created = await call('kingdown_create', { kind: 'solo', mode: 'casual', colour: 'white', level: 'beginner', command_id: randomUUID(),
    options: { fairy: true, pool: ['Q','O','L','R','B','N','A','G','M','S'], arrangement: false, classic: false,
      cards: true, cardPool: ['Freeze','IceWall','March','MorphP'], kingPowers: true } });
  const game_id = created.game_id;
  const read = () => call('kingdown_get', { game_id });
  const command = async (name, args) => call(name, { game_id, command_id: randomUUID(), expected_revision: (await read()).revision, ...args });
  await open(game_id);
  await ui.locator('[data-screen="seat"]:not([hidden])').waitFor();
  const documentStart = await ui.locator('body').evaluate(() => performance.timeOrigin);
  await command('kingdown_choose', { order: created.draw, king: { king: 'Mud', power: 'March' }, ready: true });
  await page.clock.fastForward(5000);
  await ui.locator('[data-screen="board"]:not([hidden])').waitFor();
  await ui.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
  await ui.locator('#board-menu:not(:disabled)').waitFor();
  const canvas = ui.locator('#board canvas'), box = await canvas.boundingBox(); assert(box);
  const square = (file, rank) => canvas.click({ position: { x: (32 + (file + .5) * 112) * box.width / 960, y: (96 + (7 - rank + .5) * 112) * box.width / 960 } });
  await square(0, 1); await square(0, 2);
  await ui.locator('#undo[aria-disabled="false"]').waitFor();
  const words = await ui.locator('#short-move-words').textContent(), base = await read();
  await page.clock.fastForward(5000);
  assert.equal(await ui.locator('#undo').getAttribute('aria-disabled'), 'false', 'An unchanged poll keeps the draft');
  assert.equal(await ui.locator('#short-move-words').textContent(), words);
  assert.equal((await read()).revision, base.revision, 'Polling does not commit the local draft');
  await command('kingdown_move', { actions: ['b2-b3'] });
  await page.clock.fastForward(5000);
  await ui.locator('#undo[aria-disabled="true"]').waitFor();
  await ui.locator('#board:not([data-animating="true"])').waitFor();
  await ui.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  const moved = await read();
  assert.deepEqual(moved.last_commands.filter(c => c.action.type === 'turn' && c.seat === moved.seat).map(c => c.action.actions), [['b2-b3']], 'A remote turn clears the draft without committing it');
  await command('kingdown_resign', {});
  await page.clock.fastForward(5000);
  await ui.locator('#over.end-card[open]').waitFor();
  assert.equal(await ui.locator('#over-title').innerText(), 'You lose');
  await shot(page, `${label}-solo-synced-result`);
  const keepsFocusAfterPoll = async control => {
    await control.waitFor({ state: 'visible' });
    const focused = await control.elementHandle(); assert(focused); await focused.focus();
    assert(await focused.evaluate(node => node === document.activeElement), 'The visible control receives focus before the poll');
    const polled = page.waitForResponse(response => {
      const request = response.request(), path = new URL(response.url()).pathname;
      return request.method() === 'GET' && path === `/api/games/${game_id}` ||
        request.method() === 'POST' && path === '/fixture-tool' && request.postDataJSON()?.name === 'kingdown_get';
    });
    await page.clock.fastForward(5000);
    const response = await polled; assert.equal(response.status(), 200); await response.finished();
    await page.clock.runFor(100);
    assert(await focused.evaluate(node => node.isConnected && node === document.activeElement), 'An unchanged result poll preserves the focused control');
    await focused.dispose();
  };
  await keepsFocusAfterPoll(ui.getByRole('button', { name: 'Play again', exact: true }));
  await ui.getByRole('button', { name: 'See the board', exact: true }).click();
  await keepsFocusAfterPoll(ui.locator('#board'));
  assert.equal(await ui.locator('#over').isVisible(), false, 'An unchanged poll keeps the result closed while viewing the board');
  await ui.locator('#end-result').click();
  await ui.locator('#over.end-card[open]').waitFor();
  const resultMoves = await ui.locator('#recent-moves p').allTextContents();
  assert(resultMoves.length > 0, 'The finished game has moves to inspect');
  const ended = await command('kingdown_rematch', { choice: 'offer' });
  assert(ended.rematch_game_id);
  await page.clock.fastForward(5000);
  await ui.locator('[data-screen="seat"]:not([hidden])').waitFor();
  assert.equal(await ui.locator('body').evaluate(() => performance.timeOrigin), documentStart, 'The client never reloads');
  assert.equal(await ui.locator('#retry').isVisible(), false);
  await shot(page, `${label}-solo-synced-rematch`);
  console.log(`${label}: solo Ready, unchanged draft, remote turn, result and rematch sync without Refresh`);
  const finished = await read(), profile = (await tool('kingdown_profile', {}))._meta;
  await ui.locator('#page-back').click();
  await ui.locator('[data-screen="play"] [data-nav="profile"]').click();
  const row = ui.locator(`#profile-history [data-game-id="${game_id}"] button`);
  await row.waitFor();
  assert((await row.boundingBox()).height >= 48, 'The finished row has a full-height target');
  await row.press('Enter');
  await ui.locator('#over.end-card[open]').waitFor();
  await ui.getByRole('button', { name: 'Open rematch', exact: true }).waitFor();
  assert.equal(await ui.locator('#over-title').innerText(), 'You lose');
  await page.clock.fastForward(15_000);
  assert(await ui.locator('#over.end-card[open]').isVisible(), 'History keeps the chosen result instead of following its existing rematch');
  await ui.getByRole('button', { name: 'See the board', exact: true }).click();
  assert.deepEqual(await ui.locator('#recent-moves p').allTextContents(), resultMoves, 'History restores the chosen finished board and moves');
  await shot(page, `${label}-history-board`);
  await ui.locator('#end-result').click();
  await ui.getByRole('button', { name: 'Open rematch', exact: true }).click();
  await ui.locator('[data-screen="seat"]:not([hidden])').waitFor();
  const after = await read();
  for (const key of ['revision','fen','history','rematch_game_id']) assert.deepEqual(after[key], finished[key], `Inspecting history does not change ${key}`);
  assert.deepEqual((await tool('kingdown_profile', {}))._meta.record, profile.record, 'Inspecting a result and opening its rematch leaves the record unchanged');
  assert.equal(await ui.locator('body').evaluate(() => performance.timeOrigin), documentStart, 'History and rematch selection use the same mounted client');
  console.log(`${label}: keyboard history selection, exact result and board, explicit existing rematch, unchanged game and record`);
}
