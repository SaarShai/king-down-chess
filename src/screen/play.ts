import { UiMotion, checkFrame, handoff } from '../ui/motion';
import { railsOf, clickPath, landingMoves, marksModel } from '../marks-model';
import { checkersOf, describeMove, threatsIn, nextMoveNumber } from '../move-text';
import { reachOf, readTap, unmarkedTap } from '../read';
import { mulberry32 } from '../sim/rng';
import { boardFoot } from './board-foot';
/**
 * The turn core (docs/specs/after-redesign/spec.md §4.2 rule 2): the game on the board and the state of
 * its turn, refresh(), the moves, the computer, the dialogs, the input, the review, and every step that
 * replaces the game (New game, a lesson, Return to game, a saved game, Undo, Resign, the start-up restore).
 * main.ts connects it; other modules ask it for the current game at call time and keep no copy.
 */
import { skillPlan, type SkillName } from '../ai/skill';
import { Game, resigningSide, type Engine, type Side } from '../game';
import { GameRules } from '../game-rules';
import type { BoardView } from '../render/PaintedView';
import { momentKind } from '../moment';
import { setSound, snd } from '../render/sfx';
import { Color, Move, NAMES, PieceType, Position, S, colorOf, file as fileOf, findKing, parseRule, sqName, typeOf, type Rules } from '../rules/engine';
import { toFen } from '../rules/setup';
import { LESSONS } from '../lessons';
import { progress, recordLesson } from '../lesson-shelf-ui';
import { lessonShelf } from '../lesson-shelf';
import { POWER_TAG, autoQueen, hintMoves, offered } from '../powers-ui';
import { kingsOf, newGameWarning, playersOf, withDesign, type Setup } from '../new-game';
import { worthOf } from '../workshop/judge';
import { pieceIcon } from '../piece-icons';
import { canUndoTurn, dropTurn, finishLinkedTurn, handOver, modeOf, stagedPlies, turnEnded, turnLine, turnOf } from '../turn';
import { announceWaiting, connectTurnPress, renderTurnButton, waitingRead } from '../turn-controls';
import { awardTurnSeals } from '../ui/tricks';
import { readPiece, refreshTable, renderTable } from '../ui/table';
import { clearCoinRead, initCoins, refreshCoins } from '../ui/powers';
import { reviewStep } from '../review';
import { connectMoveMoments } from '../move-moments';
import { connectEndReview, connectGameEnd } from '../game-end';
import type { initHome } from '../ui/home-view';
import { connectPreviously } from '../ui/previously';
import { pieceArt } from '../ui/guide';
import { connectLinks } from './links';
import { readSave, savedGame, writeSave, type Save } from './save';
import type { connectSettings } from './settings';
import { connectMoments, soundsFor } from './moments';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

/** A save's or the URL's player value: a person or the computer. */
export const isSide = (v: unknown): v is Side => v === 'human' || v === 'ai';

/**
 * The turn core. `view`: the board. main.ts gives the URL facts, the engine and the parts that this
 * module calls; `keys` and `account` come later, so they are getters.
 */
export function connectPlay(view: BoardView, c: {
  params: URLSearchParams;
  /** The `?rules=` preset, if any. */
  preset: Partial<Rules> | undefined;
  rules: Partial<Rules>;
  /** The balanced readings when a king has a power (main.ts, the URL rules). */
  withPowers(k: Rules['kings']): Partial<Rules>;
  /** A plain `?fen=` position that this page opened (not a game link), else null. */
  fen: string | null;
  engine: Engine;
  guide: { fill(): void };
  settings: ReturnType<typeof connectSettings>;
  home: ReturnType<typeof initHome>;
  /** The keyboard cursor (screen/keys.ts). */
  keys(): { cursor(): number | null; say(): void; focus(keyboard: boolean): void };
  /** Settings → Account and the cloud save: null until it loads, or offline. */
  account(): { changed(): void } | null;
  /** The next game's setup: the last one started from New game. */
  setup(): Setup;
  openNewGame(): void;
}) {
  const { params, preset, withPowers, fen, engine, guide, settings, home } = c;
  const uiMotion = new UiMotion();
  window.addEventListener('pagehide', () => uiMotion.cancel());
  let handoffAt = -Infinity;
  let game = new Game(undefined, c.rules);
  const sync = (pos: Position): void => { view.setRules?.(game.context); view.sync(pos); };
  /** The keyboard cursor, drawn over the board (pointer events pass through). */
  const marksLayer = document.createElement('div');
  marksLayer.id = 'board-marks';
  marksLayer.setAttribute('aria-hidden', 'true');
  $('board').appendChild(marksLayer);
  const sides: [Side, Side] = ['human', 'ai'];
  /** The computer's level in this game (New game sets it). */
  let skill: SkillName = 'club';
  let selected: number | null = null;
  let pending: number[] = []; // beast chain squares clicked so far
  /** A read stays beside the kept move selection. */
  let inspected: number | null = null;
  /** The player to move has armed their king's power: the next click spends it. */
  let armed = false;
  let resigned: Color | null = null;
  let busy = false;
  let turnStart = 0;
  let sending = false;
  /** The computer is searching (not animating), so the header can say so. */
  let thinking = false;
  /** The in-flight token. reset() bumps it; every await in commit/maybeAi/choose drops out if it changed. */
  let gen = 0;
  /** Closes an open promotion picker (resolving it with null). Set only while one is on screen. */
  let closePromo: (() => void) | null = null;
  let closeMoveChoice: (() => void) | null = null;
  /** Squares lit by Hint. Cleared by a move, another selection, the power button and Esc. */
  let hintSquares: number[] = [];
  /** The date (YYYY-MM-DD) when this game is that day's army, for the shareable result. */
  let daily: string | null = null;
  /** The lesson on the board (index into LESSONS), and whether its goal move was played. */
  let lesson: number | null = null;
  let lessonDone = false;
  /** Keep the actual game, including repetition history, while a separate game runs the lessons. */
  let lessonReturn: { game: Game; sides: [Side, Side]; resigned: Color | null; linkSide: Color | null; turnStart: number } | null = null;
  /** In a game played by link, the side this device plays (the side to move when the link opened). */
  let linkSide: Color | null = null;
  /** Plies shown on the board while reviewing earlier moves; null = the live game. */
  let viewing: number | null = null;
  /** The position on the board: in review the move shown, else the live game. The readouts read it. */
  const shownPos = (): Position => game.positionAfter(viewing ?? game.history.length);
  /** Bumped by every review step, so a superseded step's animation does not sync the board. */
  let navGen = 0;
  /** A review step is replaying a move; `busy` is set too, so the board treats it as an animation. */
  let replaying = false;
  /** Why the last tap did nothing ("Not allowed: the rook cannot reach b2."); shown in the help line until the next action. */
  let notice = '';
  let saveBlocked = false;
  const recoveryNotice = 'Your saved game could not be loaded. It is kept. Start a New game to replace it.';
  /** The board is seen from Black's side (orient()). */
  let flipped = false;

  /** The game is over: mate, a draw, or somebody resigned. Blocks input and the AI. */
  const finished = (): boolean => resigned != null || game.status !== 'playing';
  /** This device may move now: a person's turn, and in a link game only its own side. */
  const currentTurn = () => turnOf(game, turnStart, busy || pending.length > 0 || viewing != null);
  const turnMode = () => modeOf(sides, linkSide);
  const ended = (kept = { game, turnStart, resigned }): boolean => turnEnded(kept.game, kept.turnStart, kept.resigned);
  const undoOn = (): boolean => !saveBlocked && lesson == null && viewing == null && !ended() && !thinking && !sending && !closePromo && !closeMoveChoice && (canUndoTurn(game, turnStart) || pending.length > 0);
  const myTurn = (): boolean => !saveBlocked && !currentTurn().waits && sides[game.pos.turn] === 'human' && (linkSide == null || game.pos.turn === linkSide) && !lessonDone;
  /** The side Resign gives up now (`resigningSide`), or null while it is off: the game is over, a lesson, or the computer thinks. */
  const resigner = (): Color | null => (saveBlocked || ended() || lesson != null || busy ? null : resigningSide(sides, currentTurn().activeSide, linkSide));

  const moveMoments = connectMoveMoments(view, {
    game: () => game, allowed: undoOn, chain: () => pending.length > 0,
    generation: () => gen, motion: () => settings.pace() !== 'off', reset, lock: value => { busy = value; }, refresh,
    afterUndo: () => {
      moments.restore();
      if (game.pos.haste !== undefined && game.pos.rage !== 3) selected = game.pos.haste;
      $('announce').textContent = 'Move taken back.';
      refresh(); save();
      uiMotion.play($('moves-line'), [{ transform: 'translateX(12px)' }, { transform: 'translateX(0)' }], 600);
    },
  });
  const gameEnd = connectGameEnd(view, $('board'), $<HTMLDialogElement>('over'), $('over-tiles'), {
    game: () => game, sides: () => sides, linkSide: () => linkSide, resigned: () => resigned,
    generation: () => gen, motion: () => settings.pace() !== 'off', lock: value => { busy = value; }, refresh,
    turnButton: $<HTMLButtonElement>('end-turn'),
    newGameSheet: $<HTMLDialogElement>('new-game'),
    announce: ceremony => { $('announce').textContent = `${ceremony ? 'King Down. ' : ''}${moments.result()}`; },
    showPly, rematch: () => newGame(game.backRank || undefined, game.backRank ? null : toFen(game.history[0]?.pos ?? game.pos), true),
  });
  connectEndReview($('over-review'), $<HTMLDialogElement>('over'), $('moves-line'), () => moments.listMoments());

  const refreshTurnButton = () => renderTurnButton($<HTMLButtonElement>('end-turn'), game, currentTurn(), turnMode(), linkSide, ended(), saveBlocked || busy || viewing != null, lesson != null);
  const announceTurn = () => announceWaiting(game, currentTurn(), turnMode(), $('end-turn'), $('announce'));
  const readWaiting = (sq: number) => {
    selected = null; pending = [];
    ({ notice } = waitingRead(game, currentTurn(), turnMode(), sq));
    ({ inspected } = readTap(game.pos, sq, selected, inspected, false));
    refresh();
  };
  connectTurnPress($<HTMLButtonElement>('end-turn'), $('board'), {
    game: () => game, turn: currentTurn, mode: turnMode, linkSide: () => linkSide,
    ended, blocked: () => saveBlocked || busy || viewing != null || lesson != null, generation: () => gen,
    lock: value => { busy = sending = value; }, commit,
    handOver: () => {
      const seals = awardTurnSeals(game, turnStart, sides, linkSide);
      const line = !seals.length ? '' : seals.length === 1 ? `New seal: ${seals[0]}.` : 'New seals.';
      if (line) $('announce').textContent = `${line} See Menu, Extra, Tricks.`;
      turnStart = handOver(game); handoffAt = performance.now(); selected = null; pending = [];
      return line;
    },
    refresh, save, next: () => { if (ended()) { gameEnd.arm(); moments.showOver(); } else void maybeAi(); },
    link: lans => links.gameLink(lans), notice: line => { notice = line; },
    focusBoard: keyboard => c.keys().focus(keyboard),
  });
  const previously = connectPreviously($<HTMLButtonElement>('see-again'), {
    game: () => game, view, generation: () => gen, navigation: () => navGen,
    motion: () => settings.pace() !== 'off', blocked: () => busy || viewing != null || lesson != null,
    show: (ply, playing) => { viewing = ply; busy = replaying = playing; selected = inspected = null; pending = []; },
    refresh,
  });
  const moments = connectMoments({
    game: () => game, sides: () => sides, resigned: () => resigned, daily: () => daily, skill: () => skill,
    generation: () => gen, engine, end: gameEnd, showPly, hint: squares => { hintSquares = squares; }, refresh,
  });

  function showInfo(sq: number | null): void {
    readPiece(shownPos(), sq, inspected != null, game.context);
  }

  /** The side to move's power tag while it is armed, else null. */
  const armedTag = (): string | null => {
    const power = game.rules.kings[game.pos.turn]?.power;
    return armed && power ? POWER_TAG[power] ?? null : null;
  };
  /**
   * The selected piece's moves that match the clicks so far. A power that shares squares with
   * ordinary moves is offered only while armed, and then only its own moves (`needsArming`).
   */
  const candidates = (): Move[] => {
    if (selected == null) return [];
    const tag = armedTag();
    return game.legal.filter(m => m.from === selected && pending.every((sq, i) => clickPath(m)[i] === sq)
      && offered(m, tag));
  };
  /** Armed Freeze, Ice Wall or Sacrifice: their moves name a piece, not a destination. */
  const markTargets = (): Move[] => {
    const tag = armedTag();
    return tag === 'freeze' || tag === 'ward' || tag === 'sacrifice' ? game.legal.filter(m => m.power === tag) : [];
  };

  function refresh(): void {
    if (saveBlocked) notice = recoveryNotice;
    const cands = candidates();
    const verb = marksModel(cands, pending);
    // Armed Freeze / Ice Wall / Sacrifice name a piece: a power target, not a capture.
    const named = [...new Set(markTargets().map(m => m.to))];
    const step = (m: Move): number | undefined => clickPath(m)[pending.length];
    const powers = [...new Set([...cands.filter(m => m.power && !m.pass).map(step).filter((s): s is number => s != null), ...named])];
    const last = (viewing == null ? game.history.at(-1) : game.history[viewing - 1])?.move;
    view.highlight({
      selected,
      ...verb,
      captures: verb.captures.filter(sq => !named.includes(sq)),
      bites: selected != null && typeOf(game.pos.board[selected]) === S ? pending : [],
      read: inspected != null ? reachOf(game.context, shownPos(), inspected) : undefined,
      powers,
      // Owner (2026-10-04): the square the piece left is not marked; where it went (or what it hit) is.
      last: !last ? [] : last.shove ? [last.shove.from, last.shove.to] : last.to === last.from ? [...last.captures] : [last.to],
      hint: hintSquares,
      check: (!busy || thinking) && game.inCheck && viewing == null ? findKing(game.pos.board, game.pos.turn) : null,
      checkers: (!busy || thinking) && viewing == null ? checkersOf(game.context, game.pos) : [],
      rails: selected == null ? [] : railsOf(game.context.rules.design, game.pos.board, selected, [...verb.moves, ...verb.captures], verb.captures),
      // Settings → Show threats.
      threats: settings.threats() && viewing == null && !busy && !ended() && (myTurn() || currentTurn().waits) ? threatsIn(game.context, { ...game.pos, turn: currentTurn().activeSide }) : [],
    });
    const canFinish = pending.length > 0 && cands.some(m => clickPath(m).length === pending.length);
    // Captured pieces: a piece the mover removed counts for the mover; a paladin that removes itself is its own side's loss.
    const taken: [number[], number[]] = [[], []];
    for (const h of game.history.slice(0, viewing ?? game.history.length)) { // in review, the moves up to the one shown
      const mover = h.pos.turn; // not the piece on `from`: a Freeze names an enemy square
      for (const c of h.move.captures) taken[mover].push(h.pos.board[c]);
      if (h.move.selfRemove) taken[1 - mover].push(h.pos.board[h.move.from]);
    }
    renderTable({ context: game.context,
      selected, selectedType: selected == null ? 0 : typeOf(game.pos.board[selected]), pending, canFinish, busy, thinking, notice,
      viewing, reviewNote: moments.reviewNote(), lesson, lessonDone, nextLesson: lessonShelf(progress()).next?.name ?? null,
      turnLine: turnLine(game, currentTurn(), turnMode()), activeSide: currentTurn().activeSide, staged: currentTurn().staged,
      check: game.inCheck, ended: ended(), finished: finished(), myTurn: myTurn(), result: moments.result(),
      backRank: game.backRank, fen: toFen(game.pos), history: game.history.map(h => ({ lan: h.lan, turn: h.pos.turn })),
      marked: moments.marked(), taken, sides, linkSide, undoOn: undoOn(), resigner: resigner(),
    });
    // The info card and End turn read the turn core and game-end.ts, so they stay here, after the table.
    showInfo(inspected ?? selected);
    refreshTurnButton();
    gameEnd.refresh();
    const coins = refreshCoins({ pos: shownPos(), history: game.history, rules: game.rules, legal: viewing == null ? game.legal : undefined, activeSide: currentTurn().activeSide, armed, canPlay: !finished() && viewing == null && lesson == null && myTurn(), busy, flipped, lesson, mode: turnMode(), viewer: linkSide ?? (sides[0] === 'ai' ? 1 : 0), waiting: currentTurn().waits, selection: selected != null || inspected != null || !!notice });
    armed = coins.armed;
    drawMarks();
    refreshTable({ game, sides, skill, rules: game.rules, flipped, thinking, viewing, lesson, lessonDone, notice, armed, selected, pending, linkSide, reviewNote: moments.reviewNote(), turn: currentTurn(), mode: turnMode(), power: coins.context, previously: previously.state() });
    home?.refresh();
    const current = document.querySelector<HTMLElement>('.player-strip.is-turn .portrait');
    if (current) handoff(uiMotion, $('game-table'), current, handoffAt);
    for (const row of document.querySelectorAll<HTMLElement>('.coin-row[data-side]')) row.querySelector('.portrait')?.classList.toggle('is-checked', viewing === null && game.inCheck && row.dataset.side === (game.pos.turn ? 'b' : 'w'));
  }

  /** The keyboard cursor, placed with view.screenOf(). */
  function drawMarks(): void {
    const cursor = c.keys().cursor();
    view.setPreview?.(cursor);
    if (cursor == null) { marksLayer.innerHTML = ''; return; }
    const box = $('board').getBoundingClientRect(), items: string[] = [];
    const at = (s: number, cls: string): void => {
      const c = view.screenOf(s), n = view.screenOf(fileOf(s) < 7 ? s + 1 : s - 1);
      const w = Math.hypot(c.x - n.x, c.y - n.y);
      items.push(`<i class="${cls}" style="left:${(c.x - box.left - w / 2).toFixed(1)}px;top:${(c.y - box.top - w / 2).toFixed(1)}px;width:${w.toFixed(1)}px;height:${w.toFixed(1)}px"></i>`);
    };
    at(cursor, 'mk-cursor');
    marksLayer.innerHTML = items.join('');
  }
  new ResizeObserver(() => drawMarks()).observe($('board'));


  async function commit(m: Move): Promise<void> {
    if (saveBlocked) return;
    const g = gen;
    uiMotion.cancel(); handoffAt = -Infinity;
    busy = true;
    hintSquares = [];
    const pre = game.pos;
    navGen++;
    if (viewing != null) { viewing = null; sync(pre); } // a review ends when a move is played
    const computer = lesson == null && sides[pre.turn] === 'ai';
    game.play(m);
    if (computer) { turnStart = handOver(game); handoffAt = performance.now(); }
    notice = '';
    $('announce').textContent = describeMove(game.context, pre, m, true) + (game.inCheck && !finished() ? ' Check.' : '');
    moments.played(pre, m);
    // Launch sounds play now; the hit sounds when the board shows the contact.
    const sounds = soundsFor(momentKind(pre, m), m), hit = sounds.hit ? snd[sounds.hit] : null;
    if (sounds.now) snd[sounds.now]();
    selected = null; pending = []; armed = false; inspected = null;
    refresh();
    let struck = false;
    const strike = (): void => { if (!struck && g === gen) { struck = true; hit?.(); } };
    await view.animateMove(pre, m, strike);
    // New game / Undo / Resign landed inside the animation: that game is gone. Returning here is what
    // keeps a second maybeAi() loop from starting and replaying this move onto the new position.
    if (g !== gen) return;
    strike(); // no animation (reduced motion) or no contact reported: sound the hit now
    sync(game.pos);
    if (game.inCheck) snd.check();
    busy = false;
    if (lesson != null) return lessonResult(pre, m);
    // After a Haste's first move the same piece is ready for its second.
    if (game.pos.haste !== undefined && game.pos.rage !== 3 && myTurn()) selected = game.pos.haste;
    refresh();
    if (game.inCheck) {
      const portrait = document.querySelector<HTMLElement>(`.coin-row[data-side='${game.pos.turn ? 'b' : 'w'}'] .portrait`);
      if (portrait) checkFrame(uiMotion, portrait);
      uiMotion.reveal($('status'), 430, 10, 250);
    }
    if (m.power) {
      const coin = $(`power-${pre.turn ? 'b' : 'w'}`);
      uiMotion.play(coin?.querySelector('img') ?? null, [{ scale: '1' }, { scale: '1.06', offset: .5 }, { scale: '1' }], 650);
      const spentNotches = coin?.querySelectorAll('.notch.is-spent');
      uiMotion.play(spentNotches?.[spentNotches.length - 1] ?? null, [{ scale: '1' }, { scale: '.9' }], 500);
    }
    save();
    if (currentTurn().waits && !computer) announceTurn();
    if (ended()) { gameEnd.arm(); moments.showOver(); } else void maybeAi();
  }

  /** A lesson move: the goal ends the lesson; any other move is taken back with the task again. */
  function lessonResult(pre: Position, m: Move): void {
    const l = LESSONS[lesson!];
    if (l.goal(pre, m)) { lessonDone = true; moments.say(`Well done. ${l.done}`); noteLesson(l.name); }
    else { game.undo(); sync(game.pos); moments.say(`Not quite. ${l.task}`); }
    refresh();
    if (lessonDone) {
      uiMotion.play($('lesson-progress').querySelector(`[title='${l.name}']`), [{ opacity: 0, scale: '.85', rotate: '-8deg' }, { opacity: 1, scale: '1', rotate: '0deg' }], 450, 350);
      uiMotion.reveal($('context-text'), 450, 8, 600);
      uiMotion.reveal($('next-lesson'), 400, 10, 2250);
    }
  }

  /** Lessons done, by name, in localStorage `kingdown.lessons` (the shelf and account read this store). */
  function noteLesson(name: string): void {
    recordLesson(name);
    c.account()?.changed();
  }

  /** A lesson: its position, both sides moved from this device, and nothing saved (the autosave keeps the real game). */
  function startLesson(i: number): void {
    if (saveBlocked) { notice = recoveryNotice; refresh(); return; }
    home?.close();
    $<HTMLDialogElement>('rules').close();
    if (lesson == null) {
      lessonReturn = { game, sides: [...sides], resigned, linkSide, turnStart };
    }
    reset();
    game = new Game();
    resigned = null; linkSide = null;
    lesson = i; lessonDone = false;
    sides[0] = sides[1] = 'human';
    game.load(game.context.fromFen(LESSONS[i].fen));
    turnStart = 0;
    moments.start(LESSONS[i].task);
    sync(game.pos);
    orient();
    refresh();
  }

  $('return-game').onclick = () => {
    if (!lessonReturn) return;
    const stored = cloudGame ? readSave() : null;
    if (stored?.unreadable) { keepUnreadableSave(); refresh(); return; }
    const s = stored?.save;
    if (s) return openSaved(s);
    reset();
    ({ game, resigned, linkSide, turnStart } = lessonReturn);
    [sides[0], sides[1]] = lessonReturn.sides;
    lessonReturn = null;
    lesson = null; lessonDone = false;
    moments.restore();
    sync(game.pos);
    orient();
    refresh();
    save();
    if (ended()) moments.showOver(); else void maybeAi();
  };
  $('next-lesson').onclick = () => {
    const next = lessonShelf(progress()).next;
    if (lesson != null && next) startLesson(next.lesson);
    else c.openNewGame();
  };

  /** `?think=<ms>`: a shorter thinking time for the browser checks, under each level's cap (ai/skill.ts). */
  const thinkMs = Number(params.get('think')) || undefined;

  async function maybeAi(): Promise<void> {
    if (saveBlocked || home?.visible || busy || finished() || currentTurn().staged > 0 || sides[game.pos.turn] !== 'ai') return;
    busy = thinking = true;
    refresh();
    const g = gen;
    const plan = skillPlan(skill, game.history.length, thinkMs);
    const res = await engine.think(game, { timeMs: plan.timeMs, temperature: plan.temperature, history: game.history.map(h => game.context.positionKey(h.pos)) });
    if (g !== gen) return;
    thinking = false;
    const choices = game.legal;
    const blunder = plan.blunder > 0 && choices.length > 0 && Math.random() < plan.blunder
      ? choices[Math.floor(Math.random() * choices.length)]
      : null;
    const move = blunder ?? res.move;
    if (move && !await moveMoments.tell(move)) return;
    busy = false;
    if (move) await commit(move);
  }

  /** A modal beside the board, so a phone player sees it. Resolves with the choice, or null on Cancel/Escape or reset(). */
  function pickPromotion(options: Move[]): Promise<Move | null> {
    const dlg = $<HTMLDialogElement>('promo'), box = $('promo-choices');
    $('promo-title').textContent = `Promote the pawn on ${sqName(options[0].to)}`;
    box.innerHTML = '';
    return new Promise(resolve => {
      const done = (m: Move | null): void => { uiMotion.cancel(); closePromo = null; dlg.close(); resolve(m); };
      closePromo = () => done(null);
      for (const m of options) {
        const b = document.createElement('button');
        const art = pieceArt(m.promo as PieceType, game.pos.turn === 1, game.context);
        b.innerHTML = `${art ? `<img src="${art}" alt="" aria-hidden="true">` : ''}<span>${pieceIcon(m.promo as PieceType, game.pos.turn)} ${NAMES[m.promo as PieceType]}</span>`;
        b.onclick = () => done(m);
        box.appendChild(b);
      }
      $('cancel-promo').onclick = () => done(null);
      dlg.oncancel = e => { e.preventDefault(); done(null); };
      refresh();
      dlg.classList.add('ui-dialog-motion');
      dlg.showModal();
      [...box.children].forEach((button, i) => uiMotion.reveal(button, 350, 12, 550 + i * 90));
    });
  }

  async function choose(moves: Move[]): Promise<void> {
    const queen = settings.queen() ? autoQueen(moves) : undefined;
    if (queen) return commit(queen);
    if (moves.length === 1 || !moves.every(m => m.promo)) return commit(moves[0]);
    const generation = gen;
    busy = true; // the picker is modal: without this the board stays live and a second move slips in
    const m = await pickPromotion(moves);
    if (generation !== gen) return; // reset() closed it and cleared busy
    busy = false;
    if (m) return commit(m);
    selected = null; pending = []; refresh(); // cancelled: the pawn stays, nothing selected
  }

  /** Only genuinely ambiguous targets need a choice; native dialog supplies focus and touch access. */
  async function choosePushOrCapture(capture: Move, push: Move): Promise<void> {
    const generation = gen;
    busy = true;
    const dlg = $<HTMLDialogElement>('move-choice');
    const target = sqName(push.shove!.from), destination = sqName(push.shove!.to);
    // The sheet covers the context line on a phone: a lesson keeps its task in the sheet.
    $('move-choice-goal').textContent = lesson == null ? '' : LESSONS[lesson].task;
    $('move-choice-goal').hidden = lesson == null;
    $('move-choice-detail').textContent = `Take removes the enemy on ${target}. Shove moves it to ${destination}${push.to === push.from ? ' and leaves your Ogre in place' : ` and moves your Ogre to ${target}`}.`;
    $('choose-capture').textContent = `Take on ${target}`;
    $('choose-push').textContent = `Shove to ${destination}`;
    let stopPlacing = () => {};
    const board = $('board');
    const place = () => {
      board.classList.add('choosing-move');
      // The layout size, not the drawn box: the dialog's opening scale must not move the board.
      const size = {width:dlg.offsetWidth, height:dlg.offsetHeight};
      board.style.maxHeight = `${Math.max(0, innerHeight - board.getBoundingClientRect().top - size.height - 24)}px`;
      Object.assign(dlg.style, boardFoot(board.getBoundingClientRect(), size, {width:innerWidth,height:innerHeight}));
    };
    const move = await new Promise<Move | null>(resolve => {
      const done = (m: Move | null): void => { stopPlacing(); closeMoveChoice = null; dlg.close(); resolve(m); };
      closeMoveChoice = () => done(null);
      $('choose-capture').onclick = () => done(capture);
      $('choose-push').onclick = () => done(push);
      $('cancel-choice').onclick = () => done(null);
      dlg.oncancel = e => { e.preventDefault(); done(null); };
      refresh();
      dlg.showModal(); place();
      const observer = new ResizeObserver(place); observer.observe($('board')); observer.observe(dlg);
      window.addEventListener('resize', place);
      stopPlacing = () => { observer.disconnect(); window.removeEventListener('resize', place); board.classList.remove('choosing-move'); board.style.maxHeight = ''; };
    });
    if (generation !== gen) return;
    busy = false;
    if (move) await commit(move);
    else { selected = null; pending = []; refresh(); }
  }

  /** A mark is one move; a sacrifice asks which lost piece comes back (the promotion picker's look). */
  async function choosePower(moves: Move[]): Promise<void> {
    if (moves.length === 1) return commit(moves[0]);
    const generation = gen;
    busy = true;
    const dlg = $<HTMLDialogElement>('promo'), box = $('promo-choices');
    $('promo-title').textContent = `Sacrifice the pawn on ${sqName(moves[0].from)}: which piece returns?`;
    box.innerHTML = '';
    const m = await new Promise<Move | null>(resolve => {
      const done = (x: Move | null): void => { closePromo = null; dlg.close(); resolve(x); };
      closePromo = () => done(null);
      for (const x of moves) {
        const b = document.createElement('button');
        b.innerHTML = `${pieceIcon(x.promo as PieceType, game.pos.turn)} ${NAMES[x.promo as PieceType]}`;
        b.onclick = () => done(x);
        box.appendChild(b);
      }
      $('cancel-promo').onclick = () => done(null);
      dlg.oncancel = e => { e.preventDefault(); done(null); };
      refresh();
      dlg.showModal();
    });
    if (generation !== gen) return;
    busy = false;
    if (m) return commit(m);
    armed = false; refresh();
  }

  initCoins(value => { armed = value; selected = inspected = null; pending = []; hintSquares = []; notice = ''; refresh(); });


  /** Drag arm: select without the click toggle so a second onSquareClick can still play the move. */
  view.onDragSelect = (sq) => {
    if (busy || viewing != null || finished() || !myTurn()) return;
    if (game.pos.board[sq] === 0 || colorOf(game.pos.board[sq]) !== game.pos.turn) return;
    hintSquares = [];
    notice = '';
    inspected = null;
    selected = sq;
    pending = [];
    refresh();
  };

  /** Show why a tap on `sq` did nothing, in the help line (a live region). A piece on `sq` shows its card. */
  const refuse = (why: string, sq: number): void => { ({ inspected } = readTap(shownPos(), sq, selected, inspected, false)); notice = why; refresh(); };

  view.onSquareClick = (sq, shift = false) => {
    if (saveBlocked) return refuse(recoveryNotice, sq);
    if (home?.visible) home.resume();
    clearCoinRead();
    if (busy) { if (thinking) refuse('The computer is thinking. Wait for its move.', sq); view.skip(); return; } // a tap during an animation skips it
    if (viewing != null) { refuse('', sq); return; }
    if (ended()) return refuse(lesson != null ? '' : 'The game is over. Start a new game.', sq);
    if (lesson == null && currentTurn().waits) return readWaiting(sq);
    if (!myTurn()) {
      return refuse(lessonDone ? 'Lesson done. Choose the next lesson below.'
        : sides[game.pos.turn] === 'ai' ? "It is the computer's move." : '', sq);
    }
    hintSquares = [];
    notice = '';
    const targets = markTargets();
    if (targets.length) { // armed Freeze / Ice Wall / Sacrifice: tap the piece itself
      const here = targets.filter(m => m.to === sq);
      if (here.length) void choosePower(here);
      else { armed = false; refresh(); }
      return;
    }
    const next = [...candidates().filter(m => clickPath(m)[pending.length] === sq), ...landingMoves(candidates(), sq)];
    if (selected == null || next.length === 0) {
      ({ selected, inspected, pending, notice } = unmarkedTap(game.context, game.pos, sq, selected, inspected, pending, armedTag()));
      refresh();
      return;
    }
    inspected = null;
    const complete = next.filter(m => clickPath(m).length === pending.length + 1);
    if (complete.length && complete.length === next.length) {
      const push = complete.find(m => m.shove);
      const capture = complete.find(m => !m.shove);
      if (push && capture) {
        if (shift) void choose([push]);
        else void choosePushOrCapture(capture, push);
        return;
      }
      void choose(complete);
      return;
    }
    pending.push(sq); // a finish button commits the shorter capture
    refresh();
  };
  view.onSquareHover = sq => {
    $('hover').textContent = sq == null ? '' : sqName(sq);
    const next = sq == null ? [] : candidates().filter(m => clickPath(m)[pending.length] === sq);
    const ready = next.filter(m => clickPath(m).length === pending.length + 1);
    moments.preview(ready);
  };


  $('stop-chain').onclick = () => { const m = candidates().find(m => clickPath(m).length === pending.length); if (m) void commit(m); };

  $('show-me').onclick = async () => {
    if (lesson == null || busy || viewing != null || finished() || !myTurn()) return;
    const tag = armedTag(), l = lesson == null ? null : LESSONS[lesson], pos = game.pos;
    const rootMoves = hintMoves(game.legal, tag, l ? m => l.goal(pos, m) : undefined, settings.queen());
    if (!rootMoves.length) { notice = 'No goal move is available.'; return refresh(); }
    busy = true;
    refresh();
    const g = gen;
    const res = await engine.think(game, { timeMs: 400, maxDepth: 3, history: game.history.map(h => game.context.positionKey(h.pos)), rootMoves }, pos);
    if (g !== gen) return;
    busy = false;
    // Esc during the search disarms the power, and the board then refuses the move found for it.
    if (res.move && armedTag() === tag) {
      if (res.move.pass) notice = 'End the turn.';
      else { selected = null; pending = []; hintSquares = [res.move.from, ...clickPath(res.move)]; } // the first hinted tap selects the piece
    }
    refresh();
  };

  /**
   * Review: show the board after `n` plies. One step forward replays that move's animation unless
   * `replay` is false; null returns to the live game. Not while a move or the computer is in progress.
   */
  async function showPly(n: number | null, replay = true): Promise<void> {
    if (n != null) home?.close();
    previously.cancel();
    const len = game.history.length, from = viewing ?? len, step = reviewStep(n, len);
    if ((busy && !replaying) || step.viewing === viewing) return;
    gameEnd.clear();
    n = step.ply;
    const at = (k: number) => game.positionAfter(k);
    const g = ++navGen;
    view.skip(); // a step during a replay ends it; its continuation sees the new navGen
    busy = replaying = false;
    viewing = step.viewing;
    selected = null; pending = []; hintSquares = []; moments.clearNote(); inspected = null;
    refresh();
    uiMotion.play($('moves-line'), [{ transform: `translateX(${n < from ? 12 : -12}px)` }, { transform: 'translateX(0)' }], n < from ? 600 : 650);
    c.keys().say(); // the keyboard cursor reads the board now shown
    if (replay && n === from + 1) {
      sync(at(from));
      busy = replaying = true; // the board is locked like any move animation; a tap skips it
      await view.animateMove(at(from), game.history[from].move);
      if (g !== navGen) return;
      busy = replaying = false;
    }
    sync(at(n));
    refresh();
  }

  $('moves').onclick = e => {
    const ply = (e.target as HTMLElement).closest<HTMLElement>('[data-ply]');
    if (ply) void showPly(+ply.dataset.ply!);
  };

  /**
   * Stop any AI search in flight and drop the per-game UI state. Every step that replaces or changes the
   * game outside a move calls this first: an await that resumes then sees a new `gen` and drops out
   * (moments.ts listMoments keeps the game across its awaits).
   */
  function reset(): void {
    uiMotion.cancel(); handoffAt = -Infinity;
    gameEnd.reset();
    moveMoments.cancel();
    clearCoinRead();
    previously.clear();
    gen++;
    navGen++;
    replaying = thinking = false;
    moments.clear();
    if (viewing != null) { viewing = null; sync(game.pos); }
    hintSquares = [];
    engine.cancel();
    closeMoveChoice?.();
    closePromo?.(); // drop an open promotion picker instead of leaving its promise hanging
    busy = sending = false;
    selected = null; pending = []; armed = false; inspected = null;
    notice = '';
  }

  /** Look from Black's side whenever the human plays Black. */
  const orient = (): void => {
    flipped = sides[0] === 'human' && sides[1] === 'human' && linkSide != null ? linkSide === 1 : sides[0] === 'ai' && sides[1] === 'human';
    view.flip(flipped);
  };

  /**
   * A game from `setup` (New game's last Start), or a rematch of this one with the sides swapped.
   * `players` overrides who plays (Ogre practice is for two people).
   */
  function newGame(backRank?: string, fen?: string | null, rematch = false, dailyDate: string | null = null, players?: [Side, Side]): void {
    const setup = c.setup();
    home?.close();
    $<HTMLDialogElement>('new-game').close(); // every army choice in the dialog starts here
    reset();
    if (!rematch) {
      const k = kingsOf(setup);
      // "Bring a design" (ticket 17): the design plays as `T`, in place of one back-rank piece; a position (`fen`) has no place for it.
      const design = setup.design && !fen ? parseRule(`design=${setup.design}`).design! : null;
      game = new Game(undefined, { ...withPowers(k), ...preset, kings: k, design });
      if (dailyDate) backRank = game.context.randomBackRank(mulberry32(+dailyDate.replace(/-/g, '')));
      if (design) backRank = withDesign(backRank ?? game.context.randomBackRank(), worthOf(design));
      skill = setup.level;
    }
    resigned = null;
    linkSide = null;
    lesson = null; lessonDone = false;
    lessonReturn = null;
    cloudGame = false;
    daily = dailyDate;
    moments.start('');
    [sides[0], sides[1]] = players ?? (rematch ? [sides[1], sides[0]] : playersOf(setup));
    if (fen) game.load(game.context.fromFen(fen)); else game.newGame(backRank);
    saveBlocked = false;
    turnStart = 0;
    sync(game.pos);
    orient();
    refresh();
    save(true);
    for (const portrait of document.querySelectorAll('.player-strip .portrait')) uiMotion.reveal(portrait, 600, 20, 250);
    uiMotion.reveal($('board').querySelector('canvas'), 450, 0, 850);
    uiMotion.reveal($('context-text'), 420, 8, 2200);
    void maybeAi();
  }

  /** Take back one staged ply, or close an open chain. */
  function undo(): void {
    moveMoments.undo();
  }


  $<HTMLDialogElement>('over').onclose = () => {
    const v = $<HTMLDialogElement>('over').returnValue;
    if (v === 'new') newGame();
    else if (v === 'rematch') {
      newGame(game.backRank || undefined, game.backRank ? null : toFen(game.history[0]?.pos ?? game.pos), true);
    }
  };

  $('undo').onclick = undo;
  $('resign-confirm').onclick = () => {
    const side = resigner();
    if (side == null) return;
    reset();
    dropTurn(game, turnStart);
    sync(game.pos);
    resigned = side;
    gameEnd.arm();
    refresh();
    save();
    moments.showOver();
  };
  const links = connectLinks({
    game: () => game, turnStart: () => turnStart, rules: params.get('rules'),
    blocked: () => !!(saveBlocked || busy || currentTurn().staged || lesson != null || linkSide != null),
  });

  /* ---- autosave ---- */
  /** A newer saved game came from the account during a lesson: Return to game opens it. */
  let cloudGame = false;

  function save(replaceUnreadable = false): void {
    if (saveBlocked || !replaceUnreadable && savedDataBlocked()) return;
    // A lesson never replaces the saved game: it changes only the settings in the save.
    const stored = lesson == null ? null : readSave();
    if (stored?.unreadable) { keepUnreadableSave(); refresh(); return; }
    const kept = stored?.save;
    if (lesson != null && !kept) return;
    writeSave(kept ? { ...kept, ...settings.settingsNow() } : {
      back: game.backRank,
      fen: toFen(game.history[0]?.pos ?? game.pos), // the position the game started from
      moves: game.history.map(h => h.lan),
      white: sides[0], black: sides[1],
      ...settings.settingsNow(),
      link: linkSide,
      daily,
      resigned,
      // A reload keeps the staged turn for End turn (web-redesign spec §4.8).
      ...(game.history.length > turnStart && { staged: game.history.length - turnStart }),
      // The rules the game is playing, so opening the save without its URL replays the same game
      // (`?rules=2017`, `?kings=…`; docs/TAKEOVER-PLAN.md §2).
      rules: { ...game.rules },
    });
    c.account()?.changed();
  }

  function keepUnreadableSave(): void {
    reset();
    saveBlocked = true;
    notice = recoveryNotice;
  }

  /** Another tab can change the shared key after boot; recheck it before any ordinary write. */
  function savedDataBlocked(): boolean {
    if (!saveBlocked && readSave().unreadable) { keepUnreadableSave(); refresh(); }
    return saveBlocked;
  }

  /** Validate before changing the live game or its UI state. The staged count is read before an old link's pass. */
  function replay(s: Save): { game: Game; staged: number } | undefined {
    try {
      const candidate = savedGame(s), staged = stagedPlies(candidate, s.staged);
      // A staged turn stays open for End turn; only a handed-over turn that stops mid-way (an old link) is finished.
      if (!staged) finishLinkedTurn(candidate);
      return { game: candidate, staged };
    } catch { keepUnreadableSave(); }
  }

  /** Sections the account had newer than this device; account/sync.ts already wrote them to the save. */
  function fromAccount(down: string[], switched = false): void {
    if (switched) { saveBlocked = false; settings.resetSettings(); }
    const stored = readSave();
    if (stored.unreadable) { keepUnreadableSave(); refresh(); return; }
    const s = stored.save;
    if (!s) { if (switched) newGame(); return; }
    if (down.includes('settings')) {
      settings.applySettings(s);
      setSound(settings.sound()); settings.applyPace(); view.setCoords(settings.coords()); view.setLabels(settings.labels());
      refresh();
    }
    if (down.includes('saved_game')) { if (switched) openSaved(s); else if (lesson != null) cloudGame = true; else if (!fen) openSaved(s); }
  }

  function labelContinue(): void {
    if (!game.history.length) return;
    $('title-continue').querySelector('.label')!.textContent = `Continue · move ${nextMoveNumber(game.history.map(h => h.pos.turn), game.pos.turn)}`;
  }

  /** The account's saved game replaces the one on the board (but not a position opened by `?fen=`). */
  function openSaved(s: Save): void {
    const replayed = replay(s);
    if (!replayed) { refresh(); return; }
    reset();
    game = replayed.game;
    $<HTMLDialogElement>('over').close();
    cloudGame = false;
    lesson = null; lessonDone = false; lessonReturn = null;
    if (isSide(s.white)) sides[0] = s.white;
    if (isSide(s.black)) sides[1] = s.black;
    linkSide = s.link === 0 || s.link === 1 ? s.link : null;
    daily = typeof s.daily === 'string' ? s.daily : null;
    resigned = s.resigned ?? null;
    turnStart = handOver(game) - replayed.staged;
    moments.restore();
    notice = 'Loaded your newer saved game from your account.';
    moments.say(notice);
    sync(game.pos);
    orient();
    guide.fill();
    refresh();
    // Over the title or New game the computer waits, as at start-up; the title offers this game.
    if ($<HTMLDialogElement>('title-screen').open) { $('title-continue').hidden = !game.history.length; labelContinue(); }
    else if (!$<HTMLDialogElement>('new-game').open) void maybeAi();
  }

  /** Who plays each side; a value that is not a side keeps that side's player. */
  function seat(white: unknown, black: unknown): void {
    if (isSide(white)) sides[0] = white;
    if (isSide(black)) sides[1] = black;
  }

  /**
   * The start-up restore: an opened game link (`link`; `continues`: it continues the saved game), a
   * `?fen=` position, or the autosave. `urlRules`: the URL names a rule set. `title`: the title opens. `notice`: the first notice.
   * It runs before any async work starts, so it is the one game switch that does not call `reset()`.
   */
  function restore(saved: Save | null, r: { link: boolean; continues: boolean; urlRules: boolean; title: boolean; unreadable: boolean; notice: string }): void {
    let staged = 0;
    if (r.unreadable) keepUnreadableSave();
    else if (r.link) {
      previously.load(params, r.continues ? saved!.moves.length : 0);
      sides[0] = sides[1] = 'human';
      linkSide = game.pos.turn;
    }
    else if (fen) { try { game.load(game.context.fromFen(fen)); } catch (e) { alert(`Bad fen: ${(e as Error).message}`); } }
    else if (saved) {
      // A save from before saves held their rules (a7bdb5ac) played the default rules.
      const savedRules = saved.rules ?? { ...new GameRules().rules };
      const rulesDiffer = r.urlRules && JSON.stringify(savedRules) !== JSON.stringify({ ...game.rules });
      if (rulesDiffer) {
        // The URL names a rule set and the autosave played a different one. Replaying the moves would
        // reinterpret them, so keep the URL's fresh game and let the next save overwrite the old one.
        console.warn('kingdown: the autosave played different rules than the URL asks for; starting fresh');
      } else {
        const replayed = replay(saved);
        if (replayed) {
          ({ game, staged } = replayed); resigned = saved.resigned ?? null;
          if (saved.link === 0 || saved.link === 1) linkSide = saved.link;
          if (typeof saved.daily === 'string') daily = saved.daily;
        }
      }
    }
    turnStart = handOver(game) - staged;
    // The title's Continue names the move the restored game is on (set before the first paint; a
    // Haste turn is two plies by one side, so the number comes from the replayed game, not the save).
    if (r.title) labelContinue();
    notice = saveBlocked ? recoveryNotice : r.notice;
    orient();
    sync(previously.position());
  }

  /** The commands that the keys send (screen/keys.ts); no page key acts while Home is up. */
  const commands = {
    blocked: () => home.visible,
    click: (sq: number, shift: boolean) => view.onSquareClick(sq, shift), read: (sq: number) => refuse('', sq),
    escape: () => { clearCoinRead(); view.skip(); if (viewing != null) void showPly(null, false); selected = null; pending = []; inspected = null; armed = false; hintSquares = []; refresh(); },
    undo, step: (by: -1 | 1) => { void showPly((viewing ?? game.history.length) + by); },
  };

  return {
    game: () => game, sides: (): readonly [Side, Side] => sides, skill: () => skill, setSkill: (level: SkillName): void => { skill = level; },
    shownPos, selected: () => selected, pending: () => pending, inspected: () => inspected, candidates, flipped: () => flipped,
    refresh, drawMarks, save, reset, maybeAi, ended, resigner, showPly, newGame, startLesson, openSaved, fromAccount, seat, restore,
    savedGames: {
      blocked: savedDataBlocked,
      accepts: (value: unknown): boolean => {
        try { savedGame(value); return true; }
        catch { notice = 'The account save could not be loaded. Your current game stays.'; refresh(); return false; }
      },
    },
    /** A rematch of this game with the sides swapped. */
    rematch: () => newGame(game.backRank || undefined, game.backRank ? null : toFen(game.history[0]?.pos ?? game.pos), true),
    /** What Home shows (ui/home.ts). */
    homeInput: () => ({ game, sides, level: skill, linkSide, staged: currentTurn().staged > 0, result: moments.result() }),
    /** New game's warning: the kept game (during a lesson, the game it returns to) ends. */
    warning: () => newGameWarning(lessonReturn?.game ?? game, lessonReturn?.turnStart ?? turnStart, ended(lessonReturn ?? undefined)),
    result: moments.result, say: moments.say,
    moments, previously, commands,
  };
}
