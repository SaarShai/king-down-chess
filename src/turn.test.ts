import { afterEach, describe, expect, it } from 'vitest';
import { Game, resigningSide } from './game';
import { CLASSIC_CHESS, fromFen, toFen, toLan } from './rules/setup';
import { POWERS_BALANCED, setRules } from './rules/engine';
import { canUndoTurn, dropTurn, finishLinkedTurn, handOver, modeOf, pressPass, sendLans, turnAnnouncement, turnButton, turnLine, turnOf, waitNotice } from './turn';

/** Play the first legal move whose LAN matches, so the tests read like a score sheet. */
const play = (g: Game, ...lans: string[]): Game => {
  for (const lan of lans) {
    const m = g.legal.find(x => toLan(g.pos, x) === lan);
    if (!m) throw new Error(`no legal move ${lan} in ${toFen(g.pos)}`);
    g.play(m);
  }
  return g;
};

afterEach(() => setRules());

describe('turnOf: a plain move', () => {
  it('nothing staged: End turn is off and the board takes a move', () => {
    const t = turnOf(new Game(CLASSIC_CHESS), 0);
    expect(t).toMatchObject({ activeSide: 0, staged: 0, midWay: false, ready: false, waits: false });
  });

  it('one staged move: the turn waits for the press, and White is still the active side', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4');
    expect(turnOf(g, 0)).toMatchObject({ activeSide: 0, staged: 1, midWay: false, ready: true, waits: true });
  });

  it('after the press the next side moves, with nothing staged', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4');
    expect(turnOf(g, 1)).toMatchObject({ activeSide: 1, staged: 0, ready: false, waits: false });
  });

  it('an open chain, choice or animation keeps End turn off, and the turn still waits', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4');
    expect(turnOf(g, 0, true)).toMatchObject({ ready: false, waits: true });
  });

  it('a staged mate waits for the press: the game is not over until then', () => {
    const g = play(new Game(CLASSIC_CHESS), 'f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4');
    expect(g.status).toBe('checkmate');
    expect(turnOf(g, 3)).toMatchObject({ activeSide: 1, staged: 1, ready: true, waits: true });
  });
});

describe('turnOf: turns that go on', () => {
  it('a Haste first move is mid-way: End turn is on (it plays the pass), and the board takes the second move', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null] });
    const g = new Game();
    g.load(fromFen('7k/p7/8/8/8/8/8/R5K1 w - - 0 1'));
    play(g, 'Ra1-a4!H');
    expect(turnOf(g, 0)).toMatchObject({ activeSide: 0, staged: 1, midWay: true, ready: true, waits: false });
    expect(turnOf(play(g, 'Ra4-e4'), 0)).toMatchObject({ staged: 2, midWay: false, ready: true, waits: true });
  });

  it('a Haste pass makes the turn wait', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null] });
    const g = new Game();
    g.load(fromFen('7k/p7/8/8/8/8/8/R5K1 w - - 0 1'));
    play(g, 'Ra1-a4!H', '--');
    expect(turnOf(g, 0)).toMatchObject({ staged: 2, midWay: false, ready: true, waits: true });
  });

  it('a free Freeze is mid-way; the move after it makes the turn wait', () => {
    setRules({ ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] });
    const g = new Game();
    g.load(fromFen('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1'));
    play(g, '!F:d5');
    expect(turnOf(g, 0)).toMatchObject({ staged: 1, midWay: true, ready: true, waits: false });
    expect(turnOf(play(g, 'a2-a3'), 0)).toMatchObject({ staged: 2, ready: true, waits: true });
  });

  it("Black's double first turn (lab rule) goes on: End turn stays off until the second move", () => {
    setRules({ secondPlayerDoubleFirstTurn: true });
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4', 'e7-e5');
    expect(turnOf(g, 1)).toMatchObject({ activeSide: 1, staged: 1, midWay: false, ready: false, waits: false });
    expect(turnOf(play(g, 'd7-d6'), 1)).toMatchObject({ staged: 2, ready: true, waits: true });
  });
});

describe('the side that Resign gives up', () => {
  it('on one device it is the active side while its turn is staged, not the side to move', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4');
    expect(g.pos.turn).toBe(1);
    expect(resigningSide(['human', 'human'], turnOf(g, 0).activeSide, null)).toBe(0);
  });
});

describe('turnLine: the words beside the board', () => {
  const haste = (): Game => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null] });
    const g = new Game();
    g.load(fromFen('7k/p7/8/8/8/8/8/R5K1 w - - 0 1'));
    return play(g, 'Ra1-a4!H');
  };

  it('nothing staged: no line', () => {
    const g = new Game(CLASSIC_CHESS);
    expect(turnLine(g, turnOf(g, 0), 'computer')).toBe('');
  });

  it('the turn waits: against the computer, on one device and in a link game', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4');
    expect(turnLine(g, turnOf(g, 0), 'computer')).toBe('Your turn is ready. Tap End turn.');
    expect(turnLine(g, turnOf(g, 0), 'device')).toBe("White's turn is ready. Tap End turn.");
    expect(turnLine(g, turnOf(g, 0), 'link')).toBe('Your turn is ready. Tap Send your turn.');
  });

  it('a staged check says so first', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4', 'd7-d6', 'Bf1-b5');
    expect([g.inCheck, g.status]).toEqual([true, 'playing']);
    expect(turnLine(g, turnOf(g, 2), 'computer')).toBe('Check. Your turn is ready. Tap End turn.');
    expect(turnLine(g, turnOf(g, 2), 'device')).toBe("Check. White's turn is ready. Tap End turn.");
    expect(turnLine(g, turnOf(g, 2), 'link')).toBe('Check. Tap Send your turn.');
  });

  it('a staged end: the press finishes the game', () => {
    const mate = play(new Game(CLASSIC_CHESS), 'f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4');
    expect(turnLine(mate, turnOf(mate, 3), 'computer')).toBe('Checkmate. Tap End turn to finish.');
    expect(turnLine(mate, turnOf(mate, 3), 'link')).toBe('Checkmate. Tap Send your turn.');
    const stale = new Game();
    stale.load(fromFen('7k/8/6Q1/8/8/8/8/K7 w - - 0 1'));
    play(stale, 'Qg6-f7');
    expect(stale.status).toBe('stalemate');
    expect(turnLine(stale, turnOf(stale, 0), 'device')).toBe('Stalemate. Tap End turn to finish.');
  });

  it('mid-way: the follow-up move, or the press', () => {
    const g = haste();
    expect(turnLine(g, turnOf(g, 0), 'computer')).toBe('Move it again, or tap End turn.');
    expect(turnLine(g, turnOf(g, 0), 'link')).toBe('Move it again, or tap Send your turn.');
    setRules({ ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] });
    const f = new Game();
    f.load(fromFen('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1'));
    play(f, '!F:d5');
    expect(turnLine(f, turnOf(f, 0), 'device')).toBe('Now make your move, or tap End turn.');
    expect(turnLine(f, turnOf(f, 0), 'link')).toBe('Make your move, or tap Send your turn.');
  });

  it('mid-way after a Rally: another piece moves next', () => {
    setRules({ hands: [['Rally'], []], markFree: true, hasteCaptures: false });
    const g = new Game();
    g.load(fromFen('4k3/8/p7/8/8/2p5/8/RN2K3 w - - 0 1'));
    play(g, 'Ra1-a5!J');
    expect(turnLine(g, turnOf(g, 0), 'computer')).toBe('Move another piece, or tap End turn.');
  });

  it('every line has 8 words or fewer', () => {
    const lines = [
      ...(['computer', 'device', 'link'] as const).flatMap(mode => [waitNotice(mode, 0), waitNotice(mode, 1)]),
      'Check. Your turn is ready. Tap End turn.', "Check. White's turn is ready. Tap End turn.",
      'Now make your move, or tap End turn.', 'Make your move, or tap Send your turn.',
      'Move another piece, or tap Send your turn.', 'Your turn is ready. Tap Send your turn.',
    ];
    for (const line of lines) expect(line.split(/\s+/).length, line).toBeLessThanOrEqual(8);
  });
});

describe('waitNotice: a tap while the turn waits', () => {
  it('asks for the press; on one device it names the side and does not offer Undo', () => {
    expect(waitNotice('computer', 0)).toBe('Tap End turn, or Undo.');
    expect(waitNotice('device', 1)).toBe('Black: tap End turn.');
    expect(waitNotice('link', 0)).toBe('Tap Send your turn, or Undo.');
  });
});

describe('modeOf', () => {
  it('a link game, two people on one device, or the computer', () => {
    expect(modeOf(['human', 'human'], 1)).toBe('link');
    expect(modeOf(['human', 'human'], null)).toBe('device');
    expect(modeOf(['human', 'ai'], null)).toBe('computer');
    expect(modeOf(['ai', 'human'], null)).toBe('computer');
    expect(modeOf(['ai', 'ai'], null)).toBe('computer');
  });
});

describe('turnButton: its label and look', () => {
  const none = { linkSide: null, over: false, open: false };
  it('End turn against the computer and on one device: crimson only while ready', () => {
    const g = new Game(CLASSIC_CHESS);
    expect(turnButton(g, turnOf(g, 0), 'computer', none)).toEqual({ label: 'End turn', on: false, primary: false });
    play(g, 'e2-e4');
    expect(turnButton(g, turnOf(g, 0), 'device', none)).toEqual({ label: 'End turn', on: true, primary: true });
  });

  it('a link game: Send your turn while a turn is staged, then Send again (quiet, on)', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4');
    const link = { ...none, linkSide: 0 as const };
    expect(turnButton(g, turnOf(g, 0), 'link', link)).toEqual({ label: 'Send your turn', on: true, primary: true });
    expect(turnButton(g, turnOf(g, 1), 'link', link)).toEqual({ label: 'Send again', on: true, primary: false });
    expect(turnButton(g, turnOf(g, 1), 'link', { ...link, open: true }).on).toBe(false);
  });

  it("a link game on this device's own turn, nothing staged: Send your turn, off", () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4');
    expect(turnButton(g, turnOf(g, 1), 'link', { ...none, linkSide: 1 })).toEqual({ label: 'Send your turn', on: false, primary: false });
  });

  it('a link game that ended: Send again stays on, also on our own turn', () => {
    const g = play(new Game(CLASSIC_CHESS), 'f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4');
    expect(turnButton(g, turnOf(g, 4), 'link', { linkSide: 0, over: true, open: false })).toEqual({ label: 'Send again', on: true, primary: false });
  });
});

describe('the press: the pass of a mid-way turn, and the moves of the link it sends', () => {
  it('a plain turn: the link holds the history through the staged move, and the press plays no pass', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4', 'e7-e5', 'Ng1-f3');
    expect(pressPass(g, turnOf(g, 2))).toBeUndefined();
    expect(sendLans(g, turnOf(g, 2))).toEqual(['e2-e4', 'e7-e5', 'Ng1-f3']);
  });

  it('a mid-way Haste turn: the press plays the pass, and the link holds it (--)', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null] });
    const g = new Game();
    g.load(fromFen('7k/p7/8/8/8/8/8/R5K1 w - - 0 1'));
    play(g, 'Ra1-a4!H');
    expect(pressPass(g, turnOf(g, 0))?.pass).toBe(true);
    expect(sendLans(g, turnOf(g, 0))).toEqual(['Ra1-a4!H', '--']);
  });

  it('a free mark and a move: no pass; a free mark alone: the pass', () => {
    setRules({ ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] });
    const g = new Game();
    g.load(fromFen('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1'));
    play(g, '!F:d5');
    expect(sendLans(g, turnOf(g, 0))).toEqual(['!F:d5', '--']);
    play(g, 'a2-a3');
    expect(pressPass(g, turnOf(g, 0))).toBeUndefined();
    expect(sendLans(g, turnOf(g, 0))).toEqual(['!F:d5', 'a2-a3']);
  });

  it('a staged end: the link holds the final move', () => {
    const g = play(new Game(CLASSIC_CHESS), 'f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4');
    expect(sendLans(g, turnOf(g, 3))).toEqual(['f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4']);
  });

  it('Send again: nothing staged, the handed-over plies', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4', 'e7-e5');
    expect(sendLans(g, turnOf(g, 2))).toEqual(['e2-e4', 'e7-e5']);
  });
});


describe('the turn boundary', () => {
  it('Undo stops at the handed-over turn, and a computer ply hands itself over', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4');
    expect(canUndoTurn(g, 0)).toBe(true);
    const start = handOver(g);
    expect(canUndoTurn(g, start)).toBe(false);
    play(g, 'e7-e5');
    expect(canUndoTurn(g, handOver(g))).toBe(false);
  });
});


describe('card follow-ups and old links', () => {
  it.each([['Rage', 'A'], ['RageB', 'B']] as const)('%s stays open for its take or pass', (card, tag) => {
    setRules({ hands: [[card], []], hasteCaptures: false });
    const g = new Game();
    g.load(fromFen('4k3/8/p7/8/8/8/8/R3K3 w - - 0 1'));
    play(g, `Ra1-a5!${tag}`);
    expect(turnOf(g, 0)).toMatchObject({ ready: true, waits: false, midWay: true });
    play(g, 'Ra5xa6');
    expect(turnOf(g, 0)).toMatchObject({ ready: true, waits: true, staged: 2 });
    g.undo();
    expect(turnOf(g, 0)).toMatchObject({ ready: true, waits: false, staged: 1 });
  });

  it('the receiver finishes an old Haste link with a pass', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null] });
    const g = new Game();
    g.load(fromFen('7k/p7/8/8/8/8/8/R5K1 w - - 0 1'));
    play(g, 'Ra1-a4!H');
    finishLinkedTurn(g);
    expect([g.pos.turn, g.history.map(h => h.lan)]).toEqual([1, ['Ra1-a4!H', '--']]);
  });

  it('Resign drops only the staged turn', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4', 'e7-e5');
    dropTurn(g, 1);
    expect(g.history.map(h => h.lan)).toEqual(['e2-e4']);
  });
});


describe('the turn announcement', () => {
  it('keeps the move words, then asks for the press', () => {
    const g = play(new Game(CLASSIC_CHESS), 'e2-e4');
    expect(turnAnnouncement(g, turnOf(g, 0), 'computer', 'White pawn e2 to e4.')).toBe('White pawn e2 to e4. End turn, or Undo.');
    expect(turnAnnouncement(g, turnOf(g, 0), 'device', 'White pawn e2 to e4.')).toBe('White pawn e2 to e4. White: End turn.');
  });

  it('a staged mate uses the short end words', () => {
    const g = play(new Game(CLASSIC_CHESS), 'f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4');
    expect(turnAnnouncement(g, turnOf(g, 3), 'computer', 'Black queen d8 to h4.')).toBe('Checkmate. End turn, or Undo.');
  });
});
