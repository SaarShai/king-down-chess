// Unit test for the check helpers (tools/app-ui.mjs) with no browser: a small stand-in for the page's
// document and for Playwright's page. The browser checks run the helpers on the real app.
import { afterEach, describe, expect, it } from 'vitest';
import { contextText, lanMoves, lanTurns, menuItem, moveMarks, moveRow, readUi, waitForUi } from './app-ui.mjs';

type Node = { textContent: string; querySelectorAll?: (sel: string) => Node[] };
const row = (text: string): Node => ({ textContent: text });
const line = (...rows: Node[]): Node => ({ textContent: rows.map(r => r.textContent).join(' '), querySelectorAll: () => rows });

/** A document with the readout ids; a value of null leaves that id out. */
function page(ids: Record<string, Node | null>) {
  (globalThis as { document?: unknown }).document = { getElementById: (id: string) => ids[id] ?? null };
  return { evaluate: async (fn: () => unknown) => fn(), locator: (sel: string) => ({ sel }) };
}
const moves = (...lines: Node[]): Node => ({
  textContent: '',
  querySelectorAll: (sel: string) => (sel === 'li' ? lines : lines.flatMap(l => l.querySelectorAll!('[data-ply]'))),
});
const today = (over: Record<string, Node | null> = {}) => page({
  moves: moves(line(row('e2-e4?'), row('e7-e5??')), line(row('Nd2-d8!'))),
  status: row(''), 'move-help': row(' Not allowed: no. '), moment: row('The archer shot.'),
  ...over,
});

afterEach(() => { delete (globalThis as { document?: unknown }).document; });

describe('the readouts', () => {
  it('lanMoves gives the LAN of each ply without the key-moment marks', async () => {
    expect(await lanMoves(today())).toEqual(['e2-e4', 'e7-e5', 'Nd2-d8!']);
  });
  it('lanTurns groups the LAN by move number', async () => {
    expect(await lanTurns(today())).toEqual([['e2-e4', 'e7-e5'], ['Nd2-d8!']]);
  });
  it('moveMarks gives the key-moment mark of each ply', async () => {
    expect(await moveMarks(today())).toEqual(['?', '??', '']);
  });
  it('contextText gives one line for each readout that has words, trimmed', async () => {
    expect(await contextText(today())).toBe('Not allowed: no.\nThe archer shot.');
    expect(await contextText(today({ status: row('thinking…') }))).toBe('thinking…\nNot allowed: no.\nThe archer shot.');
    expect(await contextText(today({ 'move-help': row(''), moment: row('') }))).toBe('');
  });
  it('a missing readout fails with its id', async () => {
    await expect(contextText(today({ moment: null }))).rejects.toThrow('the page has no #moment');
    await expect(lanMoves(today({ moves: null }))).rejects.toThrow('the page has no #moves');
  });
  it('readUi uses nothing outside its own source, so that Playwright can send it to the page', () => {
    today();
    expect(new Function(`return (${readUi})()`)()).toEqual(readUi());
  });
});

describe('the controls', () => {
  it('menuItem names today\'s four buttons and refuses another name', () => {
    const p = page({});
    expect(menuItem(p, 'New game')).toEqual({ sel: '#new-game-btn' });
    expect(menuItem(p, 'Guide')).toEqual({ sel: '#rules-btn' });
    expect(menuItem(p, 'Workshop')).toEqual({ sel: '#workshop-btn' });
    expect(menuItem(p, 'Settings')).toEqual({ sel: '#settings-btn' });
    expect(() => menuItem(p, 'Menu')).toThrow('no menu item "Menu"; the items are New game, Guide, Workshop, Settings');
  });
  it('moveRow takes a ply from 1', () => {
    expect(moveRow(page({}), 2)).toEqual({ sel: '#moves [data-ply="2"]' });
    for (const ply of [0, 1.5, '1']) expect(() => moveRow(page({}), ply as number)).toThrow('is not a whole number from 1');
  });
});

describe('waitForUi', () => {
  it('sends the test, the reader and the argument to the page as one expression', async () => {
    let sent = '';
    const p = { ...today(), waitForFunction: async (expr: string) => { sent = expr; return new Function(`return ${expr}`)(); } };
    expect(await waitForUi(p, (ui: { lan: string[] }, n: number) => ui.lan.length === n, 3)).toBe(true);
    expect(sent).toMatch(/^\(\(ui, n\) => ui\.lan\.length === n\)\(\(function readUi\(\)/);
    expect(sent).toMatch(/, 3\)$/);
  });
  it('a failure names the ids that the test read and what they show now', async () => {
    const p = { ...today(), waitForFunction: async () => { throw new Error('Timeout 5ms exceeded.'); } };
    await expect(waitForUi(p, () => false)).rejects.toThrow(/Timeout 5ms exceeded\.\nwaitForUi: the test \(\) => false read #moves \[data-ply\], #status, #move-help and #moment; now: \{"lan":\["e2-e4"/);
  });
  it('refuses a test that is not a function', async () => {
    await expect(waitForUi(today() as never, 'ui => true' as never)).rejects.toThrow('the test is not a function');
  });
});
