// Unit test for the check helpers (tools/app-ui.mjs) with no browser: a small stand-in for the page's
// document and for Playwright's page. The browser checks run the helpers on the real app.
import { afterEach, describe, expect, it } from 'vitest';
import {
  boardHelp, computerThinks, contextText, focusBoard, lanMoves, lanTurns, leaveBoard, menuItem, moveMarks, moveRow,
  pressMenu, readUi, refusalText, resultText, waitForUi,
} from './app-ui.mjs';

type Node = { textContent: string; dataset?: Record<string, string>; open?: boolean; querySelectorAll?: (sel: string) => Node[] };
const row = (text: string): Node => ({ textContent: text, dataset: { lan: text.trim().replace(/\?+$/, ''), mark: text.trim().match(/\?*$/)![0] } });
const line = (...rows: Node[]): Node => ({ textContent: rows.map(r => r.textContent).join(' '), querySelectorAll: () => rows });

/** What the stand-in page did: each press, focus and key, in order. */
let log: string[] = [];
/** A document with the readout ids; a value of null leaves that id out. */
function page(ids: Record<string, Node | null>) {
  (globalThis as { document?: unknown }).document = { getElementById: (id: string) => ids[id] ?? (id === 'menu-sheet' ? { open: false } : null) };
  return {
    evaluate: async (fn: () => unknown) => fn(),
    locator: (sel: string) => ({
      sel,
      click: async (options: object) => { log.push(`click ${sel} ${JSON.stringify(options)}`); },
      tap: async (options: object) => { log.push(`tap ${sel} ${JSON.stringify(options)}`); },
      focus: async () => { log.push(`focus ${sel}`); },
    }),
    keyboard: { press: async (key: string) => { log.push(`key ${key}`); } },
  };
}
const moves = (...lines: Node[]): Node => ({
  textContent: '',
  querySelectorAll: (sel: string) => (sel === 'li' ? lines : lines.flatMap(l => l.querySelectorAll!('[data-ply]'))),
});
const today = (over: Record<string, Node | null> = {}) => page({
  moves: moves(line(row('e2-e4?'), row('e7-e5??')), line(row('Nd2-d8!'))),
  'context-text': row('Not allowed: no.\nThe archer shot.'), status: row(''), 'move-help': row(' Not allowed: no. '), moment: row('The archer shot.'),
  ...over,
});

afterEach(() => { delete (globalThis as { document?: unknown }).document; log = []; });

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
    expect(await contextText(today({ status: row('thinking…') }))).toBe('Not allowed: no.\nThe archer shot.');
    expect(await contextText(today({ 'context-text': row(''), 'move-help': row(''), moment: row('') }))).toBe('');
  });
  it('refusalText gives the help line only, trimmed, and empty when it has no words', async () => {
    expect(await refusalText(today())).toBe('Not allowed: no.');
    expect(await refusalText(today({ 'move-help': row('  ') }))).toBe('');
  });
  it('computerThinks and resultText read the status line: the search, else the result', async () => {
    expect([await computerThinks(today()), await resultText(today())]).toEqual([false, '']);
    const thinking = today({ status: row('thinking…') });
    expect([await computerThinks(thinking), await resultText(thinking)]).toEqual([true, '']);
    const over = today({ status: row(' White wins by checkmate ') });
    expect([await computerThinks(over), await resultText(over)]).toEqual([false, 'White wins by checkmate']);
  });
  it('a missing readout fails with its id', async () => {
    await expect(contextText(today({ 'context-text': null }))).rejects.toThrow('the page has no #context-text');
    await expect(lanMoves(today({ moves: null }))).rejects.toThrow('the page has no #moves');
    await expect(refusalText(today({ 'move-help': null }))).rejects.toThrow('the page has no #move-help');
    await expect(computerThinks(today({ status: null }))).rejects.toThrow('the page has no #status');
  });
  it('readUi uses nothing outside its own source, so that Playwright can send it to the page', () => {
    today();
    expect(new Function(`return (${readUi})()`)()).toEqual(readUi());
  });
});

describe('the controls', () => {
  it('menuItem names today\'s four buttons and refuses another name', () => {
    const p = page({});
    expect(menuItem(p, 'New game')).toMatchObject({ sel: '#new-game-btn' });
    expect(menuItem(p, 'Guide')).toMatchObject({ sel: '#rules-btn' });
    expect(menuItem(p, 'Workshop')).toMatchObject({ sel: '#workshop-btn' });
    expect(menuItem(p, 'Settings')).toMatchObject({ sel: '[data-go="help"]' });
    expect(() => menuItem(p, 'Menu')).toThrow('no menu item "Menu"; the items are New game, Guide, Workshop, Settings');
  });
  it('pressMenu gives its press options to the item, and taps when asked', async () => {
    const p = page({});
    await pressMenu(p, 'New game', { timeout: 1000 });
    await pressMenu(p, 'Settings', { tap: true });
    expect(log).toEqual(['click #menu-btn {"timeout":1000}', 'click [data-go="new"] {"timeout":1000}', 'click #new-game-btn {"timeout":1000}', 'tap #menu-btn {}', 'tap [data-go="help"] {}']);
  });
  it('boardHelp opens the board switches, acts, then closes them', async () => {
    const p = page({});
    await boardHelp(p, async () => { log.push('act'); }, { tap: true });
    expect(log).toEqual(['tap #menu-btn {}', 'tap [data-go="help"] {}', 'act', 'click #menu-close undefined']);
  });
  it('focusBoard reaches the board with a key; leaveBoard only moves the focus away', async () => {
    const p = page({});
    await focusBoard(p);
    expect(log).toEqual(['focus #menu-btn', 'key Tab', 'focus #board']);
    log = [];
    await leaveBoard(p);
    expect(log).toEqual(['focus #menu-btn']);
  });
  it('moveRow takes a ply from 1', () => {
    expect(moveRow(page({}), 2)).toMatchObject({ sel: '#moves [data-ply="2"]' });
    for (const ply of [0, 1.5, '1']) expect(() => moveRow(page({}), ply as number)).toThrow('is not a whole number from 1');
  });
});

describe('waitForUi', () => {
  it('sends the test, the reader, the argument and the options to the page', async () => {
    let sent: unknown[] = [];
    const p = { ...today(), waitForFunction: async (...args: unknown[]) => { sent = args; return new Function(`return ${args[0]}`)(); } };
    expect(await waitForUi(p, (ui: { lan: string[] }, n: number) => ui.lan.length === n, 3, { timeout: 5000, polling: 100 })).toBe(true);
    expect(sent[0]).toMatch(/^\(\(ui, n\) => ui\.lan\.length === n\)\(\(function readUi\(\)/);
    expect(sent[0]).toMatch(/, 3\)$/);
    expect(sent.slice(1)).toEqual([undefined, { timeout: 5000, polling: 100 }]);
  });
  it('a failure names the ids that the test read and what they show now, in the message and in the stack', async () => {
    const p = {
      ...today(),
      waitForFunction: async () => {
        const error = new Error('Timeout 5ms exceeded.');
        error.stack = 'TimeoutError: Timeout 5ms exceeded.\n    at check.mjs:1:1'; // Playwright sets the stack once
        throw error;
      },
    };
    const error = await waitForUi(p, () => false).catch((e: Error) => e);
    const detail = /Timeout 5ms exceeded\.\nwaitForUi: the test \(\) => false read #moves \[data-ply\], #status, #move-help and #moment; now: \{"lan":\["e2-e4"/;
    expect(error.message).toMatch(detail);
    expect(error.stack).toMatch(detail);
    expect(error.stack).toMatch(/now: .*\n    at check\.mjs:1:1$/);
  });
  it('refuses an argument that JSON changes, before it waits', async () => {
    const p = { ...today(), waitForFunction: async () => { throw new Error('it waited'); } };
    for (const arg of [/e2-e4/, NaN, Infinity, new Date(0), [undefined], { a: undefined }]) {
      await expect(waitForUi(p, () => true, arg), String(arg)).rejects.toThrow('does not go to the page as JSON with no change');
    }
  });
  it('refuses a test that is not a function', async () => {
    await expect(waitForUi(today() as never, 'ui => true' as never)).rejects.toThrow('the test is not a function');
  });
});
