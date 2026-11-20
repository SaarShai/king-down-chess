import { existsSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { guideEntries, guideSections } from './guide';
import { homeText } from './home';
import { learningEntry } from './learning';
import { kingChoices, rulesFor } from './new-game';
import { pieces, powerLines, resultText } from './texts';
import { DEFAULT_RULES, POWERS_BALANCED } from '../../rules/rules';
import { RELEASED_CARDS } from '../../content/cards';
import { KINGS, P, K, type PowerName } from '../../rules/engine';
import { GameRules } from '../../game-rules';
import { cardText, powerText } from '../../powers-ui';
import { pieceGuide } from '../../read';
import type { PieceType } from '../../rules/engine';

afterEach(() => vi.unstubAllGlobals());
it('has four guide sections and all released entries', () => {
  expect(guideSections).toEqual(['Pieces', 'Kings and powers', 'Cards', 'How a turn works']);
  expect(guideEntries('Pieces').map(item => item.name)).toEqual(['Archer', 'Beast', 'Guard', 'Maester', 'Ogre', 'Paladin', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King']);
  expect(guideEntries('Kings and powers')).toHaveLength(Object.values(KINGS).flat().length);
  expect(guideEntries('Cards').map(item => item.id)).toEqual(RELEASED_CARDS.map(card => card.id));
  expect(guideEntries('How a turn works')).toHaveLength(5);
  expect(guideEntries('unknown')).toEqual([]);
});
it('uses the in-game piece rule without inactive chess actions', () => {
  expect(DEFAULT_RULES.classicChess).toBe(false);
  for (const entry of guideEntries('Pieces')) expect(entry.full).toBe(pieces[+entry.id].full);
  expect(pieces[P].full).toContain('No en passant in this game.');
  expect(pieces[K].full).toContain('No castling in this game.');
});
it.each(guideEntries('Pieces'))('reads $name facts from pieceGuide', entry => {
  const context = new GameRules();
  const type = +entry.id as PieceType, source = pieceGuide(context, type);
  const facts = [source.moves, source.captures, source.special].filter(Boolean).join(' ').replace(/\bTakes\b/g, 'Captures').replace(/\btakes\b/g, 'captures').replace(/\btaken\b/g, 'captured').replace(/\btake\b/g, 'capture').replace('Select "Stop here" to end the chain.', 'Select End turn to end the chain.');
  const extra = type === P ? ' The path must be clear. Choose a new piece on the last rank. No en passant in this game.' : type === K ? ' Stay out of attack. No castling in this game.' : '';
  expect(pieces[type].full, entry.name).toBe(facts + extra);
  expect(entry.full, entry.name).toBe(facts + extra);
});
it('reads current power and card content with balanced rules and capture words', () => {
  const rules = new GameRules(POWERS_BALANCED).rules;
  const capture = (line: string) => line.replace(/\bTakes\b/g, 'Captures').replace(/\btakes\b/g, 'captures').replace(/\btaken\b/g, 'captured').replace(/\btake\b/g, 'capture');
  for (const entry of guideEntries('Kings and powers')) {
    if (entry.id === 'Freeze' || entry.id === 'IceWall') continue;
    expect(entry.full.toLowerCase()).toBe(`${capture(powerText(entry.id as PowerName, rules)).toLowerCase()}.`);
  }
  for (const card of RELEASED_CARDS) {
    if (['Freeze', 'IceWall', 'Firewall'].includes(card.id)) continue;
    const entry = guideEntries('Cards').find(entry => entry.id === card.id)!;
    if (card.id === 'March') expect(entry.full).toBe(entry.short);
    else expect(entry.full.toLowerCase()).toBe(`${capture(cardText(card.id, rules)).toLowerCase()}.`);
  }
});
it('describes the four game types that New game can deal', () => {
  const cases = [
    ['pieces', false, 0, 'Kings have no powers. Players have no cards.'],
    ['powers', true, 0, 'Each king has one power. Players have no cards.'],
    ['cards', false, 4, 'Both players get the same four cards. Kings have no powers.'],
    ['both', true, 4, 'Each king has an always-on power. Both players get the same four cards.'],
  ] as const;
  for (const [type, powers, cardCount, note] of cases) {
    const { kings, hands } = new GameRules(rulesFor(type, () => 0.5)).rules;
    expect(kings.map(Boolean)).toEqual([powers, powers]);
    expect(hands[0]).toHaveLength(cardCount);
    expect(hands[1]).toEqual(hands[0]);
    expect(homeText.types[type]).toBe(note);
  }
  expect(kingChoices('powers').some(king => king.power === 'Freeze')).toBe(true);
  expect(kingChoices('both').map(king => king.power)).not.toContain('Freeze');
  const steps = guideEntries('How a turn works');
  expect(steps.find(entry => entry.id === 'power')?.full).toContain('It can be active or always on.');
  expect(steps.find(entry => entry.id === 'card')?.full).toContain('With cards only, kings have no powers. With powers and cards, each king has an always-on power.');
});
it('gives the same optional move and safe end after a free action', () => {
  const context = new GameRules(POWERS_BALANCED);
  const followUp = 'After a free action, you can move a piece. If your king is safe, you can select End turn.';
  const steps = guideEntries('How a turn works');
  for (const id of ['power', 'card']) expect(steps.find(entry => entry.id === id)?.full).toContain(followUp);
  expect(steps.find(entry => entry.id === 'finish')?.full).toContain('a free action that leaves your king safe');
  for (const [section, ids] of [['Kings and powers', ['Freeze', 'IceWall']], ['Cards', ['Freeze', 'IceWall', 'Firewall']]] as const) {
    for (const id of ids) {
      const entry = guideEntries(section).find(item => item.id === id)!;
      const rule = learningEntry(entry.subject!, context);
      expect(entry.full).toBe(rule.full);
      expect(rule.full).not.toContain('then make your move');
      expect(rule.limits).toContain(followUp);
    }
  }
});
it('uses short lines from the copy table', () => {
  for (const section of guideSections.slice(0, 3)) for (const entry of guideEntries(section)) { expect(entry.short.length).toBeLessThanOrEqual(60); expect(entry.short).toMatch(/\.$/); }
  expect(powerLines.Flight).toBe('Move to an empty square in your half; no king.');
  expect(powerLines.MirrorB).toBe('Copy another card in your hand; that card stays.');
  expect(Object.fromEntries(guideEntries('Pieces').map(entry => [entry.name, entry.short]))).toEqual({
    Pawn: 'Move forward; capture diagonally. Promote on the last rank.', Knight: 'Jump two squares, then one across; jump over pieces.',
    Bishop: 'Move on a clear diagonal; pieces block the path.', Rook: 'Move on a clear rank or file; pieces block the path.',
    Queen: 'Move on a clear rank, file or diagonal; pieces block it.', King: 'Move one safe square. Only a king can capture a Guard.',
    Archer: 'Shoot two squares straight or diagonally ahead, over pieces.', Beast: 'Step one square; each later chain step must capture.',
    Guard: 'Step without capture; only a king can capture it.', Maester: 'Step or swap with an adjacent own piece; keep the king safe.',
    Ogre: 'Push and follow; never push a king or off the board.', Paladin: 'Queen paths over own pieces; non-pawn capture removes both.',
  });
  const approved = {
    Freeze: 'Stop an enemy except the king. It still attacks.', IceWall: 'Protect a piece, not the king; a push still works.',
    Strike: 'Move like a queen; no pawn, king or capture.', Haste: 'Move one piece up to twice; neither move captures.',
    Flight: 'Move to an empty square in your half; no king.', Sacrifice: 'Replace a pawn with a lost piece; no pawn, Guard or king.',
    March: 'Move a pawn two squares from any rank; the path stays clear.', Leap: 'Rook, Bishop or Queen: jump own pawns, not other pieces.',
    HolyLight: 'Protect pieces beside the king, not on its diagonals.', Mercy: 'The king jumps; its shelter stops captures except by pawns.',
    DeathTouch: 'King: capture beside it or two ahead or back; never move.', Darkness: 'Pawns step diagonally too; capture only straight ahead.',
    Salvation: 'Your back rank: return a lost piece; no pawn, Guard or king.', MirrorB: 'Copy another card in your hand; that card stays.',
    Firewall: 'Protect all pieces for the next enemy turn; a push works.', EarthQuake: 'Push pieces away; kings and blocked or edge pieces stay.',
    Burn: 'Capture on d4, e4, d5 or e5; no pawn or king can act.', FireStarter: 'Capture on the enemy back rank; no pawn or king can act.',
    Control: 'Move like a different adjacent own type; no pawn or king.', Rally: 'Move up to two different pieces; neither move captures.',
    MorphP: 'Change your pawn into a Knight or Bishop; it stays here.', Mimic: 'Use another own type to move, not capture; no pawn or king.',
    Vault: 'Jump exactly one piece with a Rook, Bishop or Queen.', Curse: 'Move an enemy to an empty square; no king or last-rank pawn.',
    SkyLift: 'Swap two different own types; no pawn or king.',
  };
  expect(powerLines).toEqual(approved);
  for (const section of ['Kings and powers', 'Cards']) for (const entry of guideEntries(section)) {
    const line = section === 'Cards' && entry.id === 'March' ? 'A pawn off its start rank can move two empty squares ahead.' : approved[entry.id as keyof typeof approved];
    expect(entry.short, entry.name).toBe(line);
  }
});

it('names End turn in the Beast rule for both Guide and Full rule', () => {
  const guide = guideEntries('Pieces').find(entry => entry.name === 'Beast')!;
  for (const rule of [guide.full, pieces[+guide.id].full]) {
    expect(rule).toContain('Select End turn to end the chain.'); expect(rule).not.toContain('Stop here');
  }
});
it.each([
  ['checkmate', false, 1, 'You win', 'Checkmate.'],
  ['checkmate', false, 0, 'The computer wins', 'Checkmate.'],
  ['playing', true, 0, 'The computer wins', 'You resign.'],
  ['stalemate', false, 1, 'Draw', 'No legal action and no check.'],
  ['draw50', false, 1, 'Draw', 'No progress for 100 actions.'],
  ['drawRepetition', false, 1, 'Draw', 'The same position occurs three times.'],
  ['drawMaterial', false, 1, 'Draw', 'Insufficient material.'],
] as const)('separates result %s from its cause', (status, resigned, side, title, cause) => {
  expect(resultText(status, resigned, side)).toEqual({ title, cause });
});
it('halves Fast times, restores Normal and uses reduced motion for Off and the system', async () => {
  const values = new Map([['--motion-strength', '2'], ['--dur-tab-in', '520ms']]);
  const root = { dataset: {} as Record<string, string>, style: { setProperty: (key: string, value: string) => values.set(key, value) } };
  vi.stubGlobal('document', { documentElement: root, addEventListener() {} });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: (name: string) => values.get(name) ?? '200ms' }));
  const { setInterfaceMotion, ms, time, calm } = await import('./motion');
  setInterfaceMotion('fast', false); expect(ms('--dur-tab-in')).toBe(260); expect(time(420)).toBe(210); expect(calm()).toBe(false);
  setInterfaceMotion('normal', false); expect(ms('--dur-tab-in')).toBe(520); expect(time(420)).toBe(420);
  setInterfaceMotion('off', false); expect(calm()).toBe(true);
  setInterfaceMotion('normal', true); expect(calm()).toBe(true);
});

it('has local figure and painting files for every guide entry', () => {
  for (const section of guideSections) for (const entry of guideEntries(section)) if (entry.art) expect(existsSync(`public${entry.art}`), entry.art).toBe(true);
});
it('hash routes name the place to open; any other hash opens Play', async () => {
  vi.stubGlobal('document', { documentElement: { dataset: {}, style: { setProperty() {} } }, addEventListener() {} });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '200ms' }));
  const { placeOf } = await import('./shell');
  expect(['#guide', '#you', '#play', 'guide', '', '#game', '#Guide', '#you/x'].map(placeOf)).toEqual(['guide', 'you', 'play', 'guide', 'play', 'play', 'play', 'play']);
});

async function historyShell() {
  const events = new EventTarget();
  const address = new URL('https://game.example.test/next.html');
  const entries: { state: unknown; url: string }[] = [{ state: null, url: address.href }];
  let index = 0;
  const replaceState = vi.fn((state: unknown, _title: string, url: string) => {
    entries[index] = { state, url: new URL(url, address).href };
    address.href = entries[index].url;
  });
  const history = {
    get state() { return entries[index].state; },
    replaceState,
    pushState(state: unknown, _title: string, url: string) {
      entries.splice(++index, Infinity, { state, url: new URL(url, address).href });
      address.href = entries[index].url;
    },
    go: vi.fn(), back: vi.fn(),
  };
  const visit = (entry: number) => {
    index = entry;
    address.href = entries[index].url;
    events.dispatchEvent(Object.assign(new Event('popstate'), { state: history.state }));
  };
  vi.stubGlobal('window', Object.assign(events, { scrollTo: vi.fn() }));
  vi.stubGlobal('document', {
    documentElement: { dataset: {}, style: { setProperty() {} } },
    body: { prepend() {} }, createElement: () => new EventTarget(),
    addEventListener() {}, querySelector: () => null,
  });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '200ms' }));
  vi.stubGlobal('history', history);
  vi.stubGlobal('location', address);
  const { mountShell } = await import('./shell');
  const shell = mountShell({ querySelector: () => null } as unknown as HTMLElement, vi.fn());
  return { shell, history, visit };
}

it('replaces the open view when a route arrives before Back', async () => {
  const { shell, history, visit } = await historyShell();
  const close = vi.fn(), more = vi.fn(), pool = vi.fn();
  shell.openLayer(close);
  shell.openLayerView(more);
  shell.openLayerView(pool);
  history.back();
  shell.go({ place: 'online', entry: 'game' }, false);
  expect(close).toHaveBeenCalledOnce();
  expect(history.go).not.toHaveBeenCalled();
  expect(history.back).toHaveBeenCalledOnce();
  expect(history.state).toMatchObject({ shell: { place: 'online' } });
  visit(2);
  expect(shell.route.place).toBe('play');
  expect(history.state).not.toHaveProperty('layer');
  expect(more).toHaveBeenCalledOnce();
  expect(pool).toHaveBeenCalledOnce();
});

it('releases actions only when Back reaches the base entry', async () => {
  const { shell, history, visit } = await historyShell();
  shell.openLayer(vi.fn());
  shell.openLayerView(vi.fn());
  shell.openLayerView(vi.fn());
  const done = shell.closeLayer(), later = vi.fn();
  shell.settled(later);
  expect(history.go).toHaveBeenCalledWith(-3);
  visit(2);
  expect(later).not.toHaveBeenCalled();
  visit(0);
  await done;
  expect(later).toHaveBeenCalledOnce();
});
