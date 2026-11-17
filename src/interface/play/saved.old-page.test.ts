/**
 * Decision 11: one save for both pages, checked with the old page's own code (screen/play.ts connectPlay with
 * the stubs of src/screen/play.test.ts). vi.mock is per file, so the stubs are copied here.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectPlay } from '../../screen/play';
import { connectSettings } from '../../screen/settings';
import { defaultSetup, type Setup } from '../../new-game';
import { Game, type Engine } from '../../game';
import type { BoardView } from '../../render/PaintedView';
import { connectTurnPress } from '../../turn-controls';
import { readSave, SAVE_KEY, type Save } from '../../screen/save';
import { toFen } from '../../rules/setup';
import { parseSq, POWERS_BALANCED, type Rules } from '../../rules/engine';
import { DraftTurn } from './turn';
import { gameType, levelOf, readStored, rulesOf, SaveWriter, SKILLS, snapshot } from './saved';

vi.mock('../../render/sfx', () => ({ setSound: vi.fn(), snd: {} }));
vi.mock('../../ui/table', () => ({ readPiece: vi.fn(), refreshTable: vi.fn(), renderTable: vi.fn() }));
vi.mock('../../ui/powers', () => ({ clearCoinRead: vi.fn(), initCoins: vi.fn(), refreshCoins: () => ({ armed: false }) }));
vi.mock('../../move-moments', () => ({ connectMoveMoments: () => ({ cancel: vi.fn(), undo: vi.fn(), tell: vi.fn().mockResolvedValue(true) }) }));
vi.mock('../../game-end', () => ({ connectEndReview: vi.fn(), connectGameEnd: () => ({ clear: vi.fn(), reset: vi.fn(), refresh: vi.fn() }) }));
vi.mock('../../turn-controls', () => ({ connectTurnPress: vi.fn(), renderTurnButton: vi.fn(), announceWaiting: vi.fn(), waitingRead: vi.fn() }));
vi.mock('../../ui/previously', () => ({ connectPreviously: (_button: unknown, c: { game(): { pos: unknown } }) => ({ cancel: vi.fn(), clear: vi.fn(), position: () => c.game().pos, state: vi.fn() }) }));
vi.mock('../../screen/moments', () => ({ soundsFor: () => ({ now: null, hit: null }), connectMoments: () => ({ clear: vi.fn(), clearNote: vi.fn(), start: vi.fn(), restore: vi.fn(), played: vi.fn(), say: vi.fn(), result: () => '', reviewNote: () => '', marked: () => [] }) }));
vi.mock('../../screen/links', () => ({ connectLinks: () => ({}) }));

const stored = new Map<string, string>();
const request = { link: false, continues: false, urlRules: false, title: false, unreadable: false, notice: '' };
beforeEach(() => {
  vi.clearAllMocks(); stored.clear();
  vi.stubGlobal('localStorage', { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value), removeItem: (key: string) => stored.delete(key), key: (i: number) => [...stored.keys()][i] ?? null, get length() { return stored.size; } });
  const nodes = new Map<string, object>(), node = () => ({ setAttribute: vi.fn(), appendChild: vi.fn(), close: vi.fn(), focus: vi.fn(), querySelector: () => null, style: {} });
  vi.stubGlobal('document', { hidden: false, documentElement: { dataset: { pace: 'off' } }, addEventListener: vi.fn(), removeEventListener: vi.fn(), querySelector: () => null, querySelectorAll: () => [], createElement: node, getElementById: (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); } });
  vi.stubGlobal('window', { addEventListener: vi.fn() });
  vi.stubGlobal('location', { href: 'http://localhost/' });
  vi.stubGlobal('history', { replaceState: vi.fn() });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('ResizeObserver', class { observe() {} });
});
afterEach(() => { vi.unstubAllGlobals(); });

/** The old page as main.ts connects it, with its real settings and its `withPowers` (src/main.ts). */
function oldPage(setup: Setup) {
  const view = { setRules: vi.fn(), resetEffects: vi.fn(), sync: vi.fn(), flip: vi.fn(), highlight: vi.fn(), setPreview: vi.fn(), setCoords: vi.fn(), setLabels: vi.fn(), setPace: vi.fn(), animateMove: vi.fn().mockResolvedValue(undefined), skip: vi.fn() } as unknown as BoardView;
  const engine = { cancel: vi.fn(), think: vi.fn().mockResolvedValue({ move: null }) };
  const settings = connectSettings(view, { skill: () => play.skill(), setSkill: level => play.setSkill(level), save: () => play.saveSettings(), refresh: () => play.refresh() });
  const play = connectPlay(view, { params: new URLSearchParams(), preset: undefined, rules: {}, withPowers: (k: Rules['kings']) => (k[0] || k[1] ? POWERS_BALANCED : {}), fen: null,
    engine: engine as unknown as Engine, guide: { fill: vi.fn() }, settings,
    home: { visible: false, close: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof connectPlay>[1]['home'],
    keys: () => ({ cursor: () => null, say: vi.fn(), focus: vi.fn() }), account: () => null,
    setup: () => setup, openNewGame: vi.fn(),
  });
  return { play, settings };
}
/** The old page's start-up order (main.ts): settings from the save, then restore. */
function openOnOldPage(setup = defaultSetup()) {
  const page = oldPage(setup), save = readSave().save!;
  page.settings.applySettings(save); page.play.seat(save.white, save.black); page.play.restore(save, request);
  return page;
}
const press = () => vi.mocked(connectTurnPress).mock.calls[0][2].handOver();

describe('a save made by the old page resumes here', () => {
  const kings = { picks: [{ king: 'Frost', power: 'Freeze' }, { king: 'Flame', power: 'Haste' }] } as Partial<Setup>;
  it.each([['pieces', { mode: 'computer', level: 'casual' }], ['powers', { mode: 'powers', level: 'beginner', ...kings }]] as const)('%s, after End turn and with a staged move', (type, choice) => {
    const { play } = oldPage({ ...defaultSetup(), ...choice } as Setup);
    play.restore(null, request); play.newGame();
    const game = play.game(); game.play(game.legal.find(m => !m.pass && !m.power)!); press(); play.save();
    let back = readStored();
    expect(back.kind).toBe('resume'); expect(toFen(back.resume!.draft.position)).toBe(toFen(game.pos));
    expect(levelOf(back.save!.skill)).toBe(levelOf(choice.level)); expect(gameType(back.resume!.game.rules)).toBe(type);
    expect(back.resume!.game.pos.turn).toBe(1);
    game.play(game.legal.find(m => !m.pass && !m.power)!); press(); // the computer's reply
    game.play(game.legal.find(m => !m.pass && !m.power)!); play.save(); // staged, not handed over
    back = readStored();
    expect(back.kind).toBe('resume'); expect(back.resume!.draft.length).toBe(1); expect(back.resume!.draft.canFinish).toBe(true);
    expect(toFen(back.resume!.draft.position)).toBe(toFen(game.pos)); expect(back.resume!.game.history).toHaveLength(2);
  });
});

describe('the old page resumes a save made here', () => {
  const prefs = { skill: SKILLS.clever, coords: true, sound: false, pace: 'normal' } as const;
  it('a staged Haste turn: the position, the staged steps and the level', () => {
    const game = new Game('RNBQKBNR', rulesOf('powers', [{ king: 'Flame', power: 'Haste' }, null], [[], []]));
    game.load(game.context.fromFen('7k/7p/8/8/8/8/7P/KN6 w - - 0 1'));
    const draft = new DraftTurn(game); draft.arm('haste');
    draft.stage(draft.at(parseSq('b1'), parseSq('c3'))[0]); draft.stage(draft.at(parseSq('c3'), parseSq('d5'))[0]);
    const w = new SaveWriter(() => {}); w.replace(); expect(w.game(snapshot(draft), prefs, true)).toBe(true);
    const { play } = openOnOldPage();
    expect(toFen(play.game().pos)).toBe(toFen(draft.now)); expect(play.homeInput().staged).toBe(true);
    expect(play.skill()).toBe('casual'); expect(play.sides()).toEqual(['human', 'ai']);
  });
  it('a cards game loads with no error, and the computer’s card move replays (the player has no card controls there: a known limit)', () => {
    const kings: Rules['kings'] = [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'DeathTouch' }];
    const game = new Game('RNBQKBNR', rulesOf('cards', kings, [['Curse'], ['Curse']]));
    game.load(game.context.fromFen('7k/7p/8/3n4/8/8/7P/K7 w - - 0 1'));
    game.play(game.legal.find(m => !m.pass && !m.power)!);
    game.play(game.legal.find(m => m.power === 'curse')!);
    while (game.pos.turn === 1) game.play(game.legal.find(m => m.pass) ?? game.legal[0]);
    const w = new SaveWriter(() => {}); w.replace(); w.game(snapshot(new DraftTurn(game)), prefs, true);
    const save: Save = JSON.parse(stored.get(SAVE_KEY)!);
    const { play } = openOnOldPage();
    expect(play.game().history.map(h => h.lan)).toEqual(save.moves);
    expect(play.game().history.some(h => h.pos.turn === 1 && h.move.power === 'curse')).toBe(true);
    expect(toFen(play.game().pos)).toBe(toFen(game.pos)); expect(() => play.homeInput()).not.toThrow();
  });
});

describe('launch decision 10: a Dark game on both pages', () => {
  const prefs = { skill: SKILLS.club, coords: true, sound: false, pace: 'normal' } as const;
  it('the old page writes a Dark game; this page resumes it after the computer move and with a staged move', () => {
    const { play } = oldPage({ ...defaultSetup(), mode: 'computer', level: 'casual', side: 1 } as Setup);
    play.restore(null, request); play.newGame(); expect(play.sides()).toEqual(['ai', 'human']);
    const game = play.game(); game.play(game.legal.find(m => !m.pass && !m.power)!); press(); play.save(); // the computer's move
    let back = readStored();
    expect(back.kind).toBe('resume'); expect(back.resume!.player).toBe(1); expect(back.resume!.game.pos.turn).toBe(1); expect(back.resume!.draft.length).toBe(0);
    game.play(game.legal.find(m => !m.pass && !m.power)!); play.save(); // staged, not handed over
    back = readStored();
    expect(back.kind).toBe('resume'); expect(back.resume!.draft.length).toBe(1); expect(toFen(back.resume!.draft.position)).toBe(toFen(game.pos));
  });
  it('this page writes a Dark game with a staged move; the old page seats the person on Dark with the same position', () => {
    const game = new Game('RNBQKBNR', rulesOf('pieces', [null, null], [[], []]));
    game.play(game.legal.find(m => game.context.toLan(game.pos, m) === 'e2-e4')!);
    const draft = new DraftTurn(game); draft.stage(draft.at(parseSq('e7'), parseSq('e5'))[0]);
    const w = new SaveWriter(() => {}); w.replace(); expect(w.game(snapshot(draft, null, 1), prefs, true)).toBe(true);
    const { play } = openOnOldPage();
    expect(play.sides()).toEqual(['ai', 'human']); expect(toFen(play.game().pos)).toBe(toFen(draft.now)); expect(play.homeInput().staged).toBe(true);
  });
});
