import build6 from '../../../docs/specs/owner-playtest/build6-king-ids.json';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDeletedAccount, localAccess, selectLocal } from '../../account/local';
import { Game } from '../../game';
import { GameRules } from '../../game-rules';
import { gameJSON, savedGame, writeSave, SAVE_KEY, type Save } from '../../screen/save';
import { stagedPlies } from '../../turn';
import { parseSq, type Rules } from '../../rules/engine';
import { POWERS_BALANCED, RULES_2017 } from '../../rules/rules';
import { toFen } from '../../rules/setup';
import { DraftTurn } from './turn';
import { DEAL_CARDS } from '../../match/setup';
import { ARRANGE_KEY, Arrangement, pendingArrangement } from './arrange';
import { answerOffer, beforeNewGame, continueLine, gameKeyOf, gameType, keepCopy, KEPT_KEY, keptOffer, levelOf, OFFERED_KEY, readStored, rulesOf, SaveWriter, SKILLS, snapshot, storedChoice, storedGameType, storedVibration, storeVibration, GAME_KEY, type Prefs } from './saved';
import { text } from './texts';
import { readOptions } from './new-game';

const store = new Map<string, string>();
let failRead = false, failWrite: string | null = null;
beforeEach(() => {
  store.clear(); failRead = false; failWrite = null;
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => { if (failRead) throw new Error('SecurityError'); return store.get(k) ?? null; },
    setItem: (k: string, v: string) => { if (failWrite === '*' || failWrite === k) throw new Error('QuotaExceededError'); store.set(k, v); },
    removeItem: (k: string) => store.delete(k), key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; },
  });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

const prefs: Prefs = { skill: 'beginner', coords: true, sound: false, pace: 'normal', vibration: true };
const PIECES = rulesOf('pieces', [null, null], [[], []]);
const powers = (kings: Rules['kings'], hands: Rules['hands'] = [[], []]) => rulesOf(hands.some(h => h.length) ? 'both' : 'powers', kings, hands);
const HASTE = powers([{ king: 'Flame', power: 'Haste' }, null]);
function draftOf(fen: string | null, rules: Partial<Rules> = PIECES) {
  const game = new Game('RNBQKBNR', rules); if (fen) game.load(game.context.fromFen(fen)); return new DraftTurn(game);
}
const step = (draft: DraftTurn, from: string, to: string) => draft.stage(draft.at(parseSq(from), parseSq(to))[0]);
const writer = () => { const lines: string[] = [], w = new SaveWriter(line => lines.push(line)); return { w, lines }; };
const saved = (): Save => JSON.parse(store.get(SAVE_KEY)!);
/** A game of this page that the player starts and saves. */
function started(draft = draftOf(null), p = prefs, player: 0 | 1 = 0) { const { w, lines } = writer(); w.replace(); expect(w.game(snapshot(draft, null, player), p, true)).toBe(true); return { w, lines, draft }; }
/** A save with one handed-over move: the computer is to move. */
function handedOver(rules = PIECES) {
  const draft = draftOf('7k/7p/8/8/8/8/P7/K7 w - - 0 1', rules); step(draft, 'a2', 'a3'); draft.commit();
  return { ...snapshot(new DraftTurn(draft.game)), ...prefs, gameAt: 500 };
}

describe('decision 1: the old shape', () => {
  const OLD = ['back', 'fen', 'moves', 'white', 'black', 'coords', 'link', 'daily', 'resigned'];
  it('writes the old field set: a fresh device', () => {
    started();
    expect(Object.keys(saved())).toEqual([...OLD, 'rules', 'skill', 'sound', 'pace', 'gameAt']);
    expect(saved()).toMatchObject({ white: 'human', black: 'ai', link: null, daily: null, resigned: null, skill: 'beginner', coords: true, sound: false, pace: 'normal' });
  });
  it('writes the old field set: stored queen, threats and labels stay', () => {
    store.set(SAVE_KEY, JSON.stringify({ ...handedOver(), queen: false, threats: true, labels: true }));
    started();
    expect(Object.keys(saved())).toEqual([...OLD, 'rules', 'skill', 'sound', 'queen', 'pace', 'threats', 'labels', 'gameAt']);
    expect(saved()).toMatchObject({ queen: false, threats: true, labels: true });
  });
  it('writes the old field set: staged above 0', () => {
    const { w, draft } = started(); step(draft, 'e2', 'e4'); w.game(snapshot(draft), prefs, true);
    expect(Object.keys(saved())).toEqual([...OLD, 'staged', 'rules', 'skill', 'sound', 'pace', 'gameAt']);
    expect(saved().staged).toBe(1);
  });
  it('writes the old field set: recovery stays while the game time stays', () => {
    const s = { ...handedOver(), recovery: 400 }; store.set(SAVE_KEY, JSON.stringify(s));
    const { w } = writer(); w.load(s);
    const game = savedGame(s); game.play(game.legal[0]); // the computer's reply
    expect(w.game(snapshot(new DraftTurn(game)), prefs)).toBe(true);
    expect(Object.keys(saved()).slice(-2)).toEqual(['gameAt', 'recovery']);
    expect(saved()).toMatchObject({ gameAt: 500, recovery: 400 });
  });
  it("the old page's code continues a new-page save", () => {
    const draft = draftOf('7k/7p/8/8/8/8/7P/KN6 w - - 0 1', HASTE); draft.arm('haste'); step(draft, 'b1', 'c3');
    started(draft);
    const game = savedGame(saved());
    expect(game.history).toHaveLength(1); expect(stagedPlies(game, saved().staged)).toBe(1);
    expect(toFen(game.pos)).toBe(toFen(draft.now));
  });
  it('a player step makes a newer game time; a computer reply alone keeps it; the sync record follows', () => {
    vi.useFakeTimers(); vi.setSystemTime(1000);
    const s = handedOver(); store.set(SAVE_KEY, JSON.stringify(s));
    const { w } = writer(); w.load(s);
    const game = savedGame(s); game.play(game.legal[0]);
    w.game(snapshot(new DraftTurn(game)), prefs);
    expect(saved().gameAt).toBe(500); expect(JSON.parse(store.get('kingdown.sync')!).saved_game.at).toBe(500);
    const draft = new DraftTurn(game); draft.stage(draft.legal.find(m => !m.pass)!);
    w.game(snapshot(draft), prefs, true);
    expect(saved().gameAt).toBe(1000); expect(JSON.parse(store.get('kingdown.sync')!).saved_game.at).toBe(1000);
  });
  it('a settings write keeps the game fields and the game time', () => {
    const s = handedOver(); store.set(SAVE_KEY, JSON.stringify(s));
    const { w } = writer();
    expect(w.settings({ ...prefs, pace: 'off', sound: true }, () => { throw new Error('no game write'); })).toBe(true);
    expect(gameJSON(saved())).toBe(gameJSON(s)); expect(saved()).toMatchObject({ gameAt: 500, pace: 'off', sound: true });
  });
  it('a settings write with no stored data writes the live game, as the old page does', () => {
    const draft = draftOf(null), { w } = writer();
    expect(w.settings(prefs, () => snapshot(draft))).toBe(true);
    expect(saved().moves).toEqual([]); expect(readStored().kind).toBe('empty');
  });
});

describe('decisions 2 and 3: staged steps and resume', () => {
  it('a reload in the middle of a staged turn restores the steps with Undo and End turn', () => {
    const draft = draftOf('7k/7p/8/8/8/8/7P/KN6 w - - 0 1', HASTE);
    draft.arm('haste'); step(draft, 'b1', 'c3'); step(draft, 'c3', 'd5'); started(draft);
    const stored = readStored(); expect(stored.kind).toBe('resume');
    const back = stored.resume!.draft;
    expect(back.length).toBe(2); expect(back.canFinish).toBe(true); expect(back.game.history).toHaveLength(0);
    back.undo(); expect(back.position.board[parseSq('c3')]).toBeTruthy(); expect(back.position.board[parseSq('d5')]).toBe(0);
  });
  it('a staged power and a staged card come back with their uses', () => {
    const frost = draftOf('7k/7p/n7/8/8/8/7P/K7 w - - 0 1', powers([{ king: 'Frost', power: 'Freeze' }, null]));
    frost.arm('freeze'); frost.stage(frost.at(parseSq('a6'), parseSq('a6'))[0]); started(frost);
    const one = readStored().resume!.draft;
    expect(one.position.used?.[0]).toBe(1); expect(one.position.marks?.[0]?.sq).toBe(parseSq('a6')); expect(one.canFinish).toBe(true);
    store.clear();
    const kings: Rules['kings'] = [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'DeathTouch' }];
    const cards = draftOf('7k/7p/8/3n4/8/8/7P/K7 w - - 0 1', powers(kings, [['Curse'], ['Curse']]));
    cards.arm('curse'); cards.stage(cards.options(parseSq('d5'))[0]); started(cards);
    const two = readStored(); expect(two.kind).toBe('resume');
    expect(two.resume!.draft.steps[0].move.power).toBe('curse'); expect(two.resume!.draft.position.used?.[0]).toBe(1);
    expect(gameType(two.resume!.game.rules)).toBe('both');
  });
  it('a reload while the computer thinks resumes with the computer to move', () => {
    store.set(SAVE_KEY, JSON.stringify(handedOver()));
    const { kind, resume } = readStored();
    expect(kind).toBe('resume'); expect(resume!.game.pos.turn).toBe(1); expect(resume!.draft.length).toBe(0);
    expect(continueLine(resume!.draft, 'clever')).toBe('Focused computer · Pieces · Computer is thinking…');
  });
  it('a save that ends on a handed-over Haste step resumes with the linked pass played', () => {
    const draft = draftOf('7k/7p/8/8/8/8/7P/KN6 w - - 0 1', HASTE); draft.arm('haste'); step(draft, 'b1', 'c3');
    const s = snapshot(draft); delete s.staged; store.set(SAVE_KEY, JSON.stringify({ ...s, ...prefs }));
    const { kind, resume } = readStored();
    expect(kind).toBe('resume'); expect(resume!.game.history.at(-1)!.move.pass).toBe(true); expect(resume!.game.pos.turn).toBe(1);
  });
  it('an open chain saves only its whole steps', () => {
    const draft = draftOf('7k/8/5p2/4p3/3S4/8/8/K7 w - - 0 1');
    draft.bite(parseSq('d4'), parseSq('e5')); expect(draft.chain).toBe(true);
    const s = snapshot(draft); expect(s.moves).toEqual([]); expect(s.staged).toBeUndefined();
  });
  it('Continue names the level, the game type and whose turn', () => {
    const draft = draftOf(null, powers([{ king: 'Frost', power: 'Freeze' }, null]));
    expect(continueLine(draft, 'club')).toBe(`Fierce computer · ${text.withPowers} · ${text.ready}`);
    step(draft, 'e2', 'e4'); expect(continueLine(draft, 'casual')).toBe(`Friendly computer · ${text.withPowers} · ${text.draft}`);
  });
  it('a FEN save resumes, and the rules this page builds read as the same rules after a merge', () => {
    const s = handedOver(powers([{ king: 'Frost', power: 'Freeze' }, null]));
    expect(s.back).toBe('');
    const rules = { ...s.rules! } as Partial<Rules>; delete rules.threefold; // a save from before a rule key existed
    store.set(SAVE_KEY, JSON.stringify({ ...s, rules }));
    expect(readStored().kind).toBe('resume');
  });
  it('no data, and a save with no move, give no Continue', () => {
    expect(readStored().kind).toBe('none');
    started(); expect(readStored().kind).toBe('empty');
  });
});

describe('decision 6: a finished game', () => {
  it('a checkmate, a draw and a resignation read as finished; a staged mate does not', () => {
    const mate = draftOf('7k/8/5KQ1/8/8/8/8/8 w - - 0 1'), game = mate.game;
    mate.stage(game.legal.find(m => game.context.status(game.context.makeMove(game.pos, m)) === 'checkmate')!);
    started(mate); expect(readStored().kind).toBe('resume'); expect(readStored().resume!.draft.length).toBe(1);
    mate.commit(); started(new DraftTurn(game)); expect(readStored().kind).toBe('finished');
    const draw = draftOf('7k/8/8/8/8/8/1q6/K7 w - - 0 1'); step(draw, 'a1', 'b2'); draw.commit();
    expect(draw.game.status).toBe('drawMaterial'); started(new DraftTurn(draw.game)); expect(readStored().kind).toBe('finished');
    const resign = draftOf(null); step(resign, 'e2', 'e4'); resign.commit();
    const { w } = started(new DraftTurn(resign.game)); expect(readStored().kind).toBe('resume');
    w.game(snapshot(new DraftTurn(resign.game), 0), prefs, true); expect(readStored().kind).toBe('finished');
  });
});

describe('decision 7: a save that this page cannot open', () => {
  const base = () => handedOver();
  const KINGS2: Rules['kings'] = [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'DeathTouch' }];
  /** A powers save whose stored kings an older engine wrote. */
  const withKings = (kings: unknown) => { const s = handedOver(powers([{ king: 'Frost', power: 'Freeze' }, null])); return { ...s, rules: { ...s.rules, kings } }; };
  const cases: [string, () => unknown][] = [
    ['two people', () => ({ ...base(), black: 'human' })],
    ['a daily army', () => ({ ...base(), daily: '2026-11-13' })],
    ['a shared game', () => ({ ...base(), link: 0 })],
    ['a Catapult army', () => { const d = draftOf('7k/7p/8/8/8/8/P7/KC6 w - - 0 1'); step(d, 'a2', 'a3'); d.commit(); return snapshot(new DraftTurn(d.game)); }],
    ['an older rule set', () => { const g = new Game('RNBQKBNR', RULES_2017); g.play(g.legal.find(m => !m.pass)!); return snapshot(new DraftTurn(g)); }],
    ['a partial replay', () => ({ ...base(), moves: [...base().moves, 'a1-a8'] })],
    ['an older engine: an unknown king power', () => withKings([{ king: 'Mud', power: 'OldPower' }, null])],
    ['an older engine: a king with no power', () => withKings([{ king: 'Frost' }, null])],
    ['an older engine: an unknown king', () => withKings([{ king: 'Ash', power: 'Freeze' }, null])],
    ['an older engine: kings that are not a list', () => withKings('ab')],
    ['an older engine: an unknown card', () => { const s = handedOver(powers(KINGS2, [['Curse'], ['Curse']])); return { ...s, rules: { ...s.rules, hands: [['OldCard'], ['OldCard']] } }; }],
    ['staged steps on the computer side', () => {
      const d = draftOf('7k/7p/8/8/8/8/P7/K7 w - - 0 1'); step(d, 'a2', 'a3'); d.commit(); d.game.play(d.game.legal.find(m => !m.pass)!);
      return { ...snapshot(new DraftTurn(d.game)), staged: 1 };
    }],
  ];
  it.each(cases)('keeps it: %s', (_name, make) => {
    const raw = JSON.stringify(make()); store.set(SAVE_KEY, raw);
    const stored = readStored(); expect(stored.kind).toBe('kept'); expect(stored.raw).toBe(raw);
    expect(keepCopy(stored.raw)).toBe('copied'); expect(store.get(KEPT_KEY)).toBe(raw);
    expect(keepCopy(stored.raw)).toBe('already');
  });
  it.each([0, 1])('keeps array-valued king fields on side %i with an ordinary replay', side => {
    for (const king of [{ king: 'Frost', power: ['Freeze'] }, { king: ['Frost'], power: 'Freeze' }]) {
      const kings: unknown[] = [null, null]; kings[side] = king;
      const raw = JSON.stringify({ ...base(), back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], rules: { ...powers([{ king: 'Frost', power: 'Freeze' }, null]), kings } });
      store.set(SAVE_KEY, raw); store.delete(KEPT_KEY);
      expect(readStored().kind).toBe('kept');
      beforeNewGame(writer().w); expect(store.get(KEPT_KEY)).toBe(raw);
    }
  });
  it('updates a kept game of two people after Undo replaces its staged step', () => {
    const initial = { ...base(), back: 'RNBQKBNR', fen: '', white: 'human', black: 'human', moves: ['e2-e4', 'd7-d6'], staged: 1 };
    const newest = JSON.stringify({ ...initial, moves: ['e2-e4', 'e7-e6', 'f2-f3'], staged: undefined });
    store.set(KEPT_KEY, JSON.stringify(initial)); store.set(SAVE_KEY, newest);
    beforeNewGame(writer().w); expect(store.get(KEPT_KEY)).toBe(newest);
  });
  it('updates a kept game of two people when the old page writes its effective default rules', () => {
    const initial = { ...base(), back: 'RNBQKBNR', fen: '', white: 'human', black: 'human', moves: ['e2-e4'], rules: undefined };
    const newest = JSON.stringify({ ...initial, moves: ['e2-e4', 'e7-e6', 'f2-f3'], rules: new GameRules().rules });
    store.set(KEPT_KEY, JSON.stringify(initial)); store.set(SAVE_KEY, newest);
    beforeNewGame(writer().w); expect(store.get(KEPT_KEY)).toBe(newest);
  });
  it('keeps a save of two people and does not write over it', () => {
    const dark = { ...base(), white: 'human', black: 'human' }, raw = JSON.stringify(dark); store.set(SAVE_KEY, raw);
    const { w } = writer();
    expect(keepCopy(readStored().raw)).toBe('copied');
    w.settings({ ...prefs, pace: 'off' }, () => { throw new Error('no game write'); });
    expect(gameJSON(saved())).toBe(gameJSON(dark as Save)); expect(store.get(KEPT_KEY)).toBe(raw);
    expect(() => w.game(snapshot(draftOf(null)), prefs)).not.toThrow(); expect(gameJSON(saved())).toBe(gameJSON(dark as Save));
    beforeNewGame(w); expect(w.game(snapshot(draftOf(null)), prefs, true)).toBe(true);
    // The copy holds the same game; its settings are the ones of the last read.
    expect(saved().white).toBe('human'); expect(gameJSON(JSON.parse(store.get(KEPT_KEY)!))).toBe(gameJSON(dark as Save));
  });
  it('keeps both games when a different game fills the kept key', () => {
    store.set(KEPT_KEY, 'older'); store.set(SAVE_KEY, JSON.stringify({ ...base(), white: 'human', black: 'human' }));
    expect(keepCopy(readStored().raw)).toBe('full');
    const { w } = writer(); beforeNewGame(w);
    const raw = store.get(SAVE_KEY);
    expect(w.game(snapshot(draftOf(null)), prefs, true)).toBe(false); expect(store.get(KEPT_KEY)).toBe('older');
    expect(store.get(SAVE_KEY)).toBe(raw); expect(w.warning).toBe(text.keptFull);
  });
  it('a later state of the kept game replaces its copy; another game does not', () => {
    const dark = { ...base(), white: 'human', black: 'human' } as Save, game = savedGame(dark);
    store.set(KEPT_KEY, JSON.stringify(dark)); game.play(game.legal.find(m => !m.pass)!); // the old page plays on
    const later = JSON.stringify({ ...dark, moves: game.history.map(h => h.lan) }); store.set(SAVE_KEY, later);
    expect(keepCopy(readStored().raw)).toBe('copied'); expect(store.get(KEPT_KEY)).toBe(later);
    const other = JSON.stringify({ ...dark, moves: ['h2-h3'] });
    expect(keepCopy(other)).toBe('full'); expect(store.get(KEPT_KEY)).toBe(later);
    expect(keepCopy(JSON.stringify(dark))).toBe('full'); // an older state does not replace a newer copy
  });
  it('blocks the new game when the copy fails', () => {
    const raw = JSON.stringify({ ...base(), white: 'human', black: 'human' }); store.set(SAVE_KEY, raw); failWrite = KEPT_KEY;
    const { w, lines } = writer(); beforeNewGame(w);
    expect(w.game(snapshot(draftOf(null)), prefs, true)).toBe(false);
    expect(store.get(SAVE_KEY)).toBe(raw); expect(lines).toEqual([text.cannotSave]); expect(w.lost).toBe(true);
  });
  it('sorts a save again at the press: a save of two people written after load gets its copy before the new game', () => {
    const { w } = writer(); expect(readStored().kind).toBe('none');
    const raw = JSON.stringify({ ...base(), white: 'human', black: 'human' }); store.set(SAVE_KEY, raw); // another tab
    beforeNewGame(w); expect(w.game(snapshot(draftOf(null)), prefs, true)).toBe(true);
    expect(store.get(KEPT_KEY)).toBe(raw);
  });
});

describe('decision 8: unreadable data and no storage', () => {
  it.each([['{', {}], ['{"moves":"x","sound":true,"pace":"off"}', { sound: true, pace: 'off' }]])('a corrupted save (%s) is kept, its settings apply and nothing writes over it', (raw, settings) => {
    store.set(SAVE_KEY, raw);
    const stored = readStored(); expect(stored.kind).toBe('kept'); expect(stored.settings).toEqual(settings);
    const { w } = writer();
    expect(w.settings(prefs, () => snapshot(draftOf(null)))).toBe(false);
    expect(w.game(snapshot(draftOf(null)), prefs)).toBe(false);
    expect(store.get(SAVE_KEY)).toBe(raw);
    beforeNewGame(w); expect(store.get(KEPT_KEY)).toBe(raw);
    expect(w.game(snapshot(draftOf(null)), prefs, true)).toBe(true);
  });
  it('storage that throws on read plays without a save', () => {
    failRead = true;
    expect(readStored().kind).toBe('blocked'); expect(storedChoice('kingdown.setup', ['pieces', 'powers'])).toBe('pieces');
    const { w, lines } = writer(); beforeNewGame(w);
    expect(w.game(snapshot(draftOf(null)), prefs, true)).toBe(false);
    expect(w.game(snapshot(draftOf(null)), prefs, true)).toBe(false);
    expect(lines).toEqual([text.cannotSave]);
  });
  it('storage that throws on write warns once', () => {
    failWrite = '*';
    const { w, lines } = writer(); w.replace();
    const draft = draftOf(null);
    expect(w.game(snapshot(draft), prefs, true)).toBe(false); step(draft, 'e2', 'e4');
    expect(w.game(snapshot(draft), prefs, true)).toBe(false); expect(w.settings(prefs, () => snapshot(draft))).toBe(false);
    expect(lines).toEqual([text.cannotSave]); expect(w.lost).toBe(true);
  });
  it("another tab's game change blocks the write; its settings change does not", () => {
    const { w, lines, draft } = started();
    store.set(SAVE_KEY, JSON.stringify({ ...saved(), sound: true, pace: 'off' })); // the old page's settings write
    step(draft, 'e2', 'e4'); expect(w.game(snapshot(draft), prefs, true)).toBe(true);
    const other = JSON.stringify(handedOver()); store.set(SAVE_KEY, other);
    draft.undo(); expect(w.game(snapshot(draft), prefs, true)).toBe(false);
    expect(store.get(SAVE_KEY)).toBe(other); expect(lines).toEqual([text.otherTab]); expect(w.blocked).toBe(true);
    beforeNewGame(w); expect(w.game(snapshot(draftOf(null)), prefs, true)).toBe(true);
  });
});

describe('owner playtest section 2: a cards game with no king powers', () => {
  it('saves, resumes and names the game; the hand stays and no king has a power', () => {
    const hand = DEAL_CARDS.slice(0, 4);
    const rules = rulesOf('cards', [null, null], [hand, hand]);
    expect(gameType(rules as Rules)).toBe('cards');
    const draft = draftOf(null, rules); step(draft, 'e2', 'e4'); draft.commit();
    started(draft);
    const stored = readStored();
    expect(stored.kind).toBe('resume');
    expect(stored.resume!.game.rules.kings).toEqual([null, null]);
    expect(stored.resume!.game.rules.hands[0]).toEqual(hand);
    expect(gameType(stored.resume!.game.rules)).toBe('cards');
    expect(continueLine(stored.resume!.draft, 'casual')).toContain(`· ${text.withCards} ·`);
  });
});

describe('decisions 9 and 10: stored choices and levels', () => {
  it('reads the last game type of four; an earlier stored type maps, and none or a bad value gives Pieces', () => {
    expect(storedGameType()).toBe('pieces');
    store.set('kingdown.setup', 'cards'); expect(storedGameType()).toBe('both');
    store.set('kingdown.setup', 'powers'); expect(storedGameType()).toBe('powers');
    store.set(GAME_KEY, 'cards'); expect(storedGameType()).toBe('cards');
    store.set(GAME_KEY, 'lab'); store.set('kingdown.setup', 'lab'); expect(storedGameType()).toBe('pieces');
  });
  it('maps each skill to a level, and Strong or none to Club; the next write has club', () => {
    expect(['beginner', 'casual', 'club', 'strong', undefined, 7].map(levelOf)).toEqual(['casual', 'clever', 'club', 'club', 'club', 'club']);
    expect(Object.values(SKILLS)).toEqual(['beginner', 'casual', 'club']);
    const s = { ...handedOver(), skill: 'strong' as const }; store.set(SAVE_KEY, JSON.stringify(s));
    const stored = readStored(); expect(levelOf(stored.save!.skill)).toBe('club');
    const { w } = writer(); w.load(s);
    w.game(snapshot(stored.resume!.draft), { ...prefs, skill: SKILLS[levelOf(stored.save!.skill)] });
    expect(saved().skill).toBe('club');
  });
  it('builds the rules of each game type as this page starts them', () => {
    expect(gameType(new GameRules(PIECES).rules)).toBe('pieces');
    expect(gameType(new GameRules(HASTE).rules)).toBe('powers');
    expect(new GameRules(HASTE).rules.freezeUses).toBe(POWERS_BALANCED.freezeUses);
  });
});

/** A Dark game: the computer (Light) plays e2-e4; the player is to move. */
function darkGame(rules: Partial<Rules> = PIECES) {
  const game = new Game('RNBQKBNR', rules); game.play(game.legal.find(m => game.context.toLan(game.pos, m) === 'e2-e4')!);
  return new DraftTurn(game);
}
describe('launch decision 10: a Dark game resumes', () => {
  it('opens it now: the player is Dark, on the player turn and on the computer turn', () => {
    store.set(SAVE_KEY, JSON.stringify({ ...handedOver(), white: 'ai', black: 'human' }));
    const mine = readStored(); expect(mine.kind).toBe('resume'); expect(mine.resume!.player).toBe(1);
    expect(mine.resume!.game.pos.turn).toBe(1); expect(continueLine(mine.resume!.draft, 'club', 1)).toBe(`Fierce computer · Pieces · ${text.ready}`);
    const draft = darkGame(); step(draft, 'e7', 'e5'); draft.commit();
    store.set(SAVE_KEY, JSON.stringify({ ...snapshot(new DraftTurn(draft.game), null, 1), ...prefs }));
    const theirs = readStored(); expect(theirs.kind).toBe('resume'); expect(theirs.resume!.game.pos.turn).toBe(0);
    expect(continueLine(theirs.resume!.draft, 'club', 1)).toBe(`Fierce computer · Pieces · ${text.thinking}`);
    expect(keepCopy(JSON.stringify({ ...handedOver(), white: 'ai', black: 'human' }))).toBe('copied'); // the copy rule itself is unchanged
  });
  it('restores staged Dark steps: a move, a Haste turn and a card', () => {
    const one = darkGame(); step(one, 'e7', 'e5'); started(one, prefs, 1);
    const back = readStored(); expect(back.kind).toBe('resume'); expect(back.resume!.draft.length).toBe(1); expect(back.resume!.draft.canFinish).toBe(true);
    store.clear();
    const haste = darkGame(powers([null, { king: 'Flame', power: 'Haste' }])); haste.arm('haste'); step(haste, 'b8', 'c6'); step(haste, 'c6', 'd4'); started(haste, prefs, 1);
    const two = readStored().resume!.draft; expect(two.length).toBe(2); expect(two.position.board[parseSq('d4')]).toBeTruthy();
    two.undo(); expect(two.position.board[parseSq('c6')]).toBeTruthy();
    store.clear();
    const kings: Rules['kings'] = [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'DeathTouch' }];
    const card = darkGame(powers(kings, [['Curse'], ['Curse']])); card.arm('curse'); card.stage(card.options(parseSq('e4'))[0]); started(card, prefs, 1);
    const three = readStored(); expect(three.kind).toBe('resume'); expect(three.resume!.draft.steps[0].move.power).toBe('curse'); expect(three.resume!.draft.position.used?.[1]).toBe(1);
  });
  it('Dark snapshots keep the old field set and write the side values', () => {
    const draft = darkGame(); step(draft, 'e7', 'e5'); const { w } = started(draft, prefs, 1);
    expect(Object.keys(saved())).toEqual(['back', 'fen', 'moves', 'white', 'black', 'coords', 'link', 'daily', 'resigned', 'staged', 'rules', 'skill', 'sound', 'pace', 'gameAt']);
    expect(saved()).toMatchObject({ white: 'ai', black: 'human', staged: 1, resigned: null });
    expect(snapshot(draft)).toMatchObject({ white: 'human', black: 'ai' }); // the default side stays Light
    draft.undo(); w.game(snapshot(draft, 1, 1), prefs, true); expect(saved()).toMatchObject({ white: 'ai', black: 'human', resigned: 1 });
    expect(readStored().kind).toBe('finished');
  });
  it('an empty Dark save with the computer to move resumes; an empty Light save gives no Continue', () => {
    const { w } = started(new DraftTurn(new Game('RNBQKBNR', PIECES)));
    expect(readStored().kind).toBe('empty');
    w.game(snapshot(new DraftTurn(new Game('RNBQKBNR', PIECES)), null, 1), prefs, true);
    const dark = readStored(); expect(dark.kind).toBe('resume'); expect(dark.resume!.player).toBe(1); expect(dark.resume!.game.pos.turn).toBe(0);
    store.set(SAVE_KEY, JSON.stringify({ ...saved(), white: 'human', black: 'human' })); expect(readStored().kind).toBe('empty');
  });
});

describe('launch decision 10: a kept Dark game is offered once', () => {
  const keptDark = () => JSON.stringify({ ...handedOver(), white: 'ai', black: 'human' });
  it('offers a kept Dark game next to another game, once for each kept state', () => {
    const current = draftOf(null); step(current, 'e2', 'e4'); started(current); expect(readStored().kind).toBe('resume');
    store.set(KEPT_KEY, keptDark());
    const offer = keptOffer(readStored()); expect(offer?.raw).toBe(keptDark()); expect(offer?.resume.player).toBe(1);
    answerOffer(offer!.raw); expect(store.get(OFFERED_KEY)).toBe(keptDark()); expect(keptOffer(readStored())).toBeNull();
    expect(store.get(KEPT_KEY)).toBe(keptDark()); // the copy stays
    const later = savedGame(JSON.parse(keptDark())); later.play(later.legal.find(m => !m.pass)!); later.play(later.legal.find(m => !m.pass)!);
    const next = JSON.stringify({ ...JSON.parse(keptDark()), moves: later.history.map(h => h.lan) }); store.set(KEPT_KEY, next);
    expect(keptOffer(readStored())?.raw).toBe(next);
    store.delete(SAVE_KEY); expect(keptOffer(readStored())?.raw).toBe(next); // no current game
  });
  it('makes no offer for the same game, a game that cannot open, a finished copy or bad data', () => {
    store.set(KEPT_KEY, keptDark()); store.set(SAVE_KEY, keptDark()); expect(keptOffer(readStored())).toBeNull();
    const later = savedGame(JSON.parse(keptDark())); later.play(later.legal.find(m => !m.pass)!);
    store.set(SAVE_KEY, JSON.stringify({ ...JSON.parse(keptDark()), moves: later.history.map(h => h.lan) })); expect(keptOffer(readStored())).toBeNull();
    store.set(SAVE_KEY, JSON.stringify({ ...handedOver(), black: 'human' })); expect(readStored().kind).toBe('kept'); expect(keptOffer(readStored())).toBeNull();
    store.delete(SAVE_KEY);
    for (const bad of ['{', JSON.stringify({ ...handedOver(), black: 'human' }), JSON.stringify({ ...handedOver(), white: 'ai', black: 'human', resigned: 1 })]) {
      store.set(KEPT_KEY, bad); expect(keptOffer(readStored())).toBeNull();
    }
  });
  it('storage that refuses gives no offer', () => {
    store.set(KEPT_KEY, keptDark()); failRead = true; expect(keptOffer(readStored())).toBeNull();
  });
  it('an answer that cannot save lasts for this page load', () => {
    store.set(KEPT_KEY, keptDark()); failWrite = OFFERED_KEY;
    const offer = keptOffer(readStored())!; answerOffer(offer.raw);
    expect(store.has(OFFERED_KEY)).toBe(false); expect(keptOffer(readStored())).toBeNull();
  });
});

 it('keeps the storage warning until a game write succeeds and clears it on load', () => {
  const { w } = writer(); w.replace(); const value = snapshot(draftOf(null));
  failWrite = '*'; expect(w.game(value, prefs)).toBe(false);
  expect(w.warning).toBe(text.cannotSave);
  failWrite = ''; expect(w.game(value, prefs)).toBe(true); expect(w.warning).toBe('');
  w.block(text.otherTab); expect(w.warning).toBe(text.otherTab);
  w.load(saved()); expect(w.warning).toBe(''); expect(w.lost).toBe(false); expect(w.blocked).toBe(false);
});


it.each(['alice', 'bob', 'anonymous'])('deletion clears only alice kept bytes and offer bytes, with owner %s', owner => {
  if (owner !== 'anonymous') selectLocal(localStorage, owner, () => {});
  const raw = JSON.stringify({ ...handedOver(), white: 'ai', black: 'human' });
  expect(keepCopy(raw)).toBe('copied');
  answerOffer(raw);
  for (const key of [KEPT_KEY, OFFERED_KEY]) expect(store.get(key + '.owner')).toBe(owner);
  selectLocal(localStorage, 'bob', () => {});
  clearDeletedAccount(localStorage, 'alice');
  for (const key of [KEPT_KEY, OFFERED_KEY]) {
    expect(store.get(key)).toBe(owner === 'alice' ? undefined : raw);
    expect(store.get(key + '.owner')).toBe(owner === 'alice' ? undefined : owner);
  }
});
it('keeps an offer from another owner when it clears the kept copy', () => {
  selectLocal(localStorage, 'alice', () => {});
  const raw = JSON.stringify({ ...handedOver(), white: 'ai', black: 'human' });
  expect(keepCopy(raw)).toBe('copied');
  store.set(OFFERED_KEY, 'bob game'); store.set(OFFERED_KEY + '.owner', 'bob');
  answerOffer(raw);
  clearDeletedAccount(localStorage, 'alice');
  expect(store.has(KEPT_KEY)).toBe(false); expect(store.get(OFFERED_KEY)).toBe('bob game');
  expect(store.get(OFFERED_KEY + '.owner')).toBe('bob');
});
it('does not offer, answer or replace another account copy or write from a stale tab', () => {
  selectLocal(localStorage, 'alice', () => {});
  const raw = JSON.stringify({ ...handedOver(), gameAt: 777, white: 'ai', black: 'human' });
  expect(keepCopy(raw)).toBe('copied');
  expect(keptOffer(readStored())?.raw).toBe(raw);
  selectLocal(localStorage, 'bob', () => {});
  expect(keptOffer(readStored())).toBeNull(); answerOffer(raw);
  expect(store.has(OFFERED_KEY)).toBe(false); expect(keepCopy(raw)).toBe('full');
  const stale = localAccess(localStorage);
  store.set('kingdown.sync-owner', JSON.stringify({ userId: 'alice' }));
  expect(stale.userId).toBe('bob'); expect(keepCopy(raw)).toBe('failed'); answerOffer(raw);
  expect(store.has(OFFERED_KEY)).toBe(false);
});


it.each([0, 1] as const)('resumes an unfinished arrangement for side %s from its saved legal deal', player => {
  const { draft } = started(draftOf(null), prefs, player);
  store.set(ARRANGE_KEY, JSON.stringify({ army: draft.game.backRank, side: player, fen: toFen(draft.game.pos) }));
  const saved = readStored(); expect(saved.kind).toBe('resume');
  expect(saved.resume?.player).toBe(player); expect(saved.resume?.game.history).toHaveLength(0);
  expect(toFen(saved.resume!.game.pos)).toBe(toFen(draft.game.pos));
});


it.each(['pieces', 'powers', 'cards', 'both'] as const)('keeps a confirmed Manual %s game until the first move, with a new-game warning', setup => {
  const rules = rulesOf(setup, [{ king: 'Mud', power: 'March' }, { king: 'Spirit', power: 'Mercy' }], [DEAL_CARDS.slice(0, 4), DEAL_CARDS.slice(0, 4)]);
  const game = new Game('RNBQKBNR', rules), arrangement = new Arrangement(game.backRank, 0);
  arrangement.pick(1); arrangement.pick(3); expect(arrangement.canReady).toBe(true);
  game.load(arrangement.position(game.pos));
  store.set(ARRANGE_KEY, JSON.stringify({ army: arrangement.order, side: 0, fen: toFen(game.pos), ready: true }));
  started(new DraftTurn(game));
  const saved = readStored(); expect(saved.kind).toBe('resume');
  expect(toFen(saved.resume!.game.pos)).toBe(toFen(game.pos));
  expect(pendingArrangement(localStorage, saved.resume!.game, 0)).toBeUndefined();
  expect(gameKeyOf(saved)).not.toBe('');
  const resumed = saved.resume!.draft; step(resumed, 'a2', 'a3');
  const { w } = writer(); w.load(saved.save); expect(w.game(snapshot(resumed), prefs, true)).toBe(true);
  expect(readStored().kind).toBe('resume');
});


it.each(['pieces', 'powers', 'cards', 'both'] as const)('a stale Ready cannot remove the newer confirmed %s game', setup => {
  const rules = rulesOf(setup, [{ king: 'Mud', power: 'March' }, { king: 'Spirit', power: 'Mercy' }], [DEAL_CARDS.slice(0, 4), DEAL_CARDS.slice(0, 4)]);
  const { w: a } = started(new DraftTurn(new Game('RNBQKBNR', rules))), initial = saved(), { w: b } = writer(); b.load(initial);
  const ready = (w: SaveWriter, swap: boolean) => {
    const game = savedGame(initial), order = new Arrangement(game.backRank, 0);
    if (swap) { order.pick(1); order.pick(3); }
    expect(order.canReady).toBe(true); game.load(order.position(game.pos));
    store.set(ARRANGE_KEY, JSON.stringify({ army: order.order, side: 0, fen: toFen(game.pos), ready: true }));
    return w.game(snapshot(new DraftTurn(game)), prefs, true);
  };
  expect(ready(a, true)).toBe(true); const newer = store.get(SAVE_KEY);
  expect(ready(b, false)).toBe(false); expect(b.blocked).toBe(true);
  expect(store.get(SAVE_KEY)).toBe(newer); expect(readStored().kind).toBe('resume');
  expect(gameKeyOf(readStored())).not.toBe('');
  expect(pendingArrangement(localStorage, readStored().resume!.game, 0)).toBeUndefined();
});
it.each([SAVE_KEY, ARRANGE_KEY])('a failed %s write keeps a confirmed FEN save resumable without a marker', key => {
  const { w } = started(), game = savedGame(saved()), order = new Arrangement(game.backRank, 0);
  order.pick(1); order.pick(3); game.load(order.position(game.pos));
  failWrite = key;
  try { localStorage.setItem(ARRANGE_KEY, JSON.stringify({ army: order.order, side: 0, fen: toFen(game.pos), ready: true })); } catch { /* Ready still attempts the game save. */ }
  const draft = new DraftTurn(game), written = w.game(snapshot(draft), prefs, true);
  expect(written).toBe(key !== SAVE_KEY);
  if (!written) { expect(w.lost).toBe(true); failWrite = null; expect(w.game(snapshot(draft), prefs, true)).toBe(true); }
  store.delete(ARRANGE_KEY);
  expect(readStored().kind).toBe('resume'); expect(toFen(readStored().resume!.game.pos)).toBe(toFen(game.pos));
});
it('the old page reads and rewrites the same zero-move confirmed FEN save', () => {
  const game = new Game('RNBQKBNR', PIECES), order = new Arrangement(game.backRank, 0);
  order.pick(1); order.pick(3); game.load(order.position(game.pos)); started(new DraftTurn(game));
  expect(saved().back).toBe(''); expect(saved().moves).toEqual([]);
  const old = savedGame(saved()); expect(toFen(old.pos)).toBe(toFen(game.pos));
  expect(writeSave({ ...saved(), coords: false, back: old.backRank, fen: toFen(old.pos), moves: old.history.map(h => h.lan) })).toBe(true);
  expect(readStored().kind).toBe('resume'); expect(toFen(readStored().resume!.game.pos)).toBe(toFen(game.pos));
});


it('loads build 6 saved games and stored options with the Stratus and Mud IDs', () => {
  const kings: Rules['kings'] = [{ king: 'Stratus', power: 'Flight' }, { king: 'Mud', power: 'March' }];
  // The build 6 save format and keys stay unchanged. Read the old raw JSON through both pages.
  const raw = JSON.stringify(build6);
  store.set(SAVE_KEY, raw);
  const loaded = readStored();
  expect(loaded.kind).toBe('resume');
  expect(loaded.resume!.game.rules.kings).toEqual(kings);
  expect(savedGame(JSON.parse(raw)).rules.kings).toEqual(kings);
  for (const king of kings) {
    store.set('kingdown.game-options', JSON.stringify({ king }));
    expect(readOptions(JSON.parse(store.get('kingdown.game-options')!)).king).toEqual(king);
  }
  expect(store.get(SAVE_KEY)).toBe(raw);
});

it('keeps Vibration on for old saves and stores the choice for this device', () => {
  const oldGame = snapshot(draftOf(null));
  expect(writeSave(oldGame)).toBe(true);
  expect(storedVibration()).toBe(true);
  storeVibration({ vibration: false });
  expect(storedVibration()).toBe(false);
  expect(saved()).toEqual(oldGame);
  storeVibration({ vibration: true });
  expect(storedVibration()).toBe(true);
});
