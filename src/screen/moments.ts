import type { SkillName } from '../ai/skill';
import { positionKey, type SearchResult } from '../ai/search';
import type { Engine, Game, Side } from '../game';
import { clickPath } from '../marks-model';
import { keyMoments, momentText, type KeyMoment, type momentKind } from '../moment';
import { describeMove, moveNumbers } from '../move-text';
import { findKing, type Color, type Move, type Position, type Status } from '../rules/engine';
import { toLan } from '../rules/setup';
import { kingArt } from '../ui/guide';
import { copyAndSay } from './links';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

/** The result line: who resigned, or who won and how, or the draw; empty while the game plays. */
export function resultText(status: Status, pos: Position, resigned: Color | null): string {
  if (resigned != null) return `${resigned ? 'Black' : 'White'} resigns — ${resigned ? 'White' : 'Black'} wins.`;
  return {
    playing: '',
    checkmate: `${pos.turn ? 'White' : 'Black'} wins ${findKing(pos.board, pos.turn) < 0 ? 'by taking the king' : 'by checkmate'}.`,
    stalemate: 'Draw by stalemate.',
    draw50: 'Draw by the 50-move rule.',
    drawRepetition: 'Draw by repetition.',
    drawMaterial: 'Draw by insufficient material.',
  }[status];
}

/** Why the game ended, for the result dialog; `said` (the last moment line) when no rule ended it. */
export function endReason(status: Status, pos: Position, resigned: Color | null, said: string): string {
  return (status === 'checkmate' ? (findKing(pos.board, pos.turn) < 0 ? 'The king was taken.' : 'The king is in check and no legal move escapes it.') : '')
    || (status === 'stalemate' ? 'No legal move, and the king is not in check.' : '')
    || (status === 'draw50' ? 'Fifty moves with no take and no pawn move.' : '')
    || (status === 'drawRepetition' ? 'The same position came up three times.' : '')
    || (status === 'drawMaterial' ? 'Neither side has enough material to mate.' : '')
    || (resigned != null ? 'That side gave up.' : '')
    || said;
}

/**
 * Today's result to share: the day, its army, won, lost or drew against the computer (between two people,
 * the result line), the moves and this page.
 */
export function shareResultText(r: {
  sides: readonly Side[]; resigned: Color | null; status: Status; turn: Color; result: string;
  skill: SkillName; daily: string | null; army: string; moves: number; page: string;
}): string {
  const n = r.moves, people = r.sides.filter(s => s === 'human').length;
  const me = r.sides.indexOf('human') as Color, winner = r.resigned != null ? 1 - r.resigned : r.status === 'checkmate' ? 1 - r.turn : -1;
  const outcome = people !== 1 ? r.result.slice(0, -1).toLowerCase() : winner < 0 ? 'drew' : winner === me ? 'won' : 'lost';
  const vs = people === 1 ? ` against the ${r.skill} computer` : '';
  return `King Down daily ${r.daily} (${r.army}): ${outcome} in ${n} move${n === 1 ? '' : 's'}${vs}. ${r.page}`;
}

/** The moment line while the pointer is on a square: the moment of the one move that a tap there finishes, else `said`. */
export const previewText = (pos: Position, ready: readonly Move[], seen: Set<string>, said: string): string =>
  (ready.length === 1 ? momentText(pos, ready[0], seen, true) : null) ?? said;

/**
 * A move's sounds. `now` plays as the move starts: a launch (shot, swap) or a quiet move. `hit` plays
 * when the board shows the contact: a shove, a chain or a capture.
 */
export function soundsFor(kind: ReturnType<typeof momentKind>, m: Move): { now: 'shot' | 'swap' | 'move' | null; hit: 'shove' | 'chain' | 'capture' | null } {
  const hit = kind === 'shove' || kind === 'shoveGuard' ? 'shove'
    : kind === 'chain' || kind === 'reaver' ? 'chain'
    : m.captures.length || m.selfRemove ? 'capture' : null;
  const now = kind === 'shot' || kind === 'deathTouch' || kind === 'strikeCapture' || kind === 'lob' || kind === 'strike' ? 'shot'
    : kind === 'swap' || kind === 'swapKing' ? 'swap'
    : !hit ? 'move' : null;
  return { now, hit };
}

/**
 * The moments: the moment line (`#moment`) and its hover preview, the result and the result dialog, the
 * key moments of a finished game, and today's result to share. It keeps the moments seen, the last line
 * said, the moves marked in the move list and the review note.
 */
export function connectMoments(c: {
  game(): Game;
  sides(): readonly Side[];
  resigned(): Color | null;
  daily(): string | null;
  skill(): SkillName;
  generation(): number;
  engine: Engine;
  /** The end ceremony and the result dialog (game-end.ts). */
  end: { show(): Promise<void> };
  showPly(ply: number, replay: boolean): Promise<void>;
  /** Mark these squares as the hint. */
  hint(squares: number[]): void;
  refresh(): void;
}) {
  const seenMoments = new Set<string>();
  let said = '';
  /** The finished game's key moments, marked in the move list; cleared when the game changes. */
  let marked: (KeyMoment & { text: string })[] = [];
  /** Replaces the review help line while a key moment is on the board. */
  let reviewNote = '';
  /** The moment line says `line`; a hover preview gives way to it again. */
  const say = (line: string): void => { said = line; $('moment').textContent = line; };

  function restoreMoments(): void {
    seenMoments.clear();
    said = '';
    for (const h of c.game().history) said = momentText(h.pos, h.move, seenMoments) ?? said;
    $('moment').textContent = said;
  }

  function result(): string {
    return resultText(c.game().status, c.game().pos, c.resigned());
  }

  /** Moves played so far, counted as the move list numbers them (a Haste turn is one move). */
  const movesPlayed = (): number => moveNumbers(c.game().history.map(h => h.pos.turn)).at(-1) ?? 0;

  function showOver(): void {
    const game = c.game();
    const n = movesPlayed();
    const dlg = $<HTMLDialogElement>('over');
    $('over-title').textContent = result();
    const last = [...game.history].reverse().find(h => !h.move.pass);
    // Ending reason wins over a prior moment caption (`said`); last-move text stays above.
    const why = endReason(game.status, game.pos, c.resigned(), said);
    $('over-detail').textContent = [last ? describeMove(last.pos, last.move, true, true) : '', why, `${n} move${n === 1 ? '' : 's'}.`].filter(Boolean).join(' ');
    dlg.returnValue = ''; // Esc leaves the last button's value behind, which would re-fire it
    dlg.querySelector<HTMLImageElement>('.over-w')!.src = kingArt(0); // the kings that played, as on the board
    dlg.querySelector<HTMLImageElement>('.over-b')!.src = kingArt(1);
    $('share-result').hidden = c.daily() == null;
    $('share-result').textContent = "Copy today's result";
    void c.end.show();
  }

  /**
   * Key moments: score every position of the finished game, then list the moves that gave away
   * the most (moment.ts `keyMoments`). A moment opens the review before that move, the better one marked.
   */
  async function listMoments(): Promise<void> {
    const game = c.game();
    const g = c.generation(), box = $('over-moments'), dlg = $<HTMLDialogElement>('sheet-moves');
    box.innerHTML = '<small>Finding the key moments…</small>';
    marked = [];
    const keys = game.history.map(h => positionKey(h.pos));
    const results: SearchResult[] = [], before: number[] = [], after: number[] = [];
    for (let k = 0; k < game.history.length; k++) {
      const h = game.history[k], next = game.history[k + 1]?.pos ?? game.pos;
      const best = await c.engine.think(h.pos, { timeMs: 200, maxDepth: 3, history: keys.slice(0, k) });
      if (g !== c.generation()) return; // the game changed (New game, Rematch, Undo): its search was cancelled
      // The played move, one ply shallower: the same horizon as the root's view of it.
      const reply = await c.engine.think(next, { timeMs: 200, maxDepth: 2, history: keys.slice(0, k + 1) });
      if (g !== c.generation()) return;
      const same = best.move != null && toLan(h.pos, best.move) === h.lan;
      results.push(best); before.push(best.score); after.push(same ? -best.score : reply.score);
    }
    const found = keyMoments(before, after);
    box.innerHTML = found.length ? '<h3>Key moments</h3>' : '<small>No move gave away 2 pawns or more.</small>';
    for (const km of found) {
      const h = game.history[km.ply], better = results[km.ply].move;
      const what = km.kind === 'missedMate' ? 'missed a forced mate'
        : km.kind === 'allowedMate' ? 'allowed a forced mate'
        : `gave away about ${Math.round(km.loss / 100)} pawns`;
      const text = `${Math.floor(km.ply / 2) + 1}${km.ply % 2 ? '…' : '.'} ${h.lan}: ${h.pos.turn ? 'Black' : 'White'} ${what}.${better ? ` Better: ${toLan(h.pos, better)}.` : ''}`;
      marked.push({ ...km, text });
      const b = document.createElement('button');
      b.textContent = text;
      b.onclick = async () => {
        dlg.close();
        await c.showPly(km.ply, false);
        reviewNote = `${text}${better ? ' The better move is marked.' : ''}`;
        c.hint(better ? [better.from, ...clickPath(better)] : []);
        c.refresh();
      };
      box.appendChild(b);
    }
    c.refresh(); // marks the moments in the move list
  }

  $('share-result').onclick = () => {
    const text = shareResultText({
      sides: c.sides(), resigned: c.resigned(), status: c.game().status, turn: c.game().pos.turn, result: result(), skill: c.skill(), daily: c.daily(),
      army: c.game().backRank, moves: movesPlayed(), page: `${location.origin}${location.pathname}`,
    });
    void copyAndSay($('share-result'), text, 'Result copied');
  };

  return {
    say,
    /** A new game or lesson: no moment seen yet, and `line` on the moment line. */
    start(line: string): void { seenMoments.clear(); say(line); },
    /** A move was played: the first move of each kind says its moment. */
    played(pre: Position, m: Move): void { const line = momentText(pre, m, seenMoments); if (line) say(line); },
    /** The pointer is on a square where a tap finishes `ready`. */
    preview(ready: readonly Move[]): void { $('moment').textContent = previewText(c.game().pos, ready, seenMoments, said); },
    restore: restoreMoments, result, showOver, listMoments,
    marked: () => marked,
    reviewNote: () => reviewNote,
    clearNote(): void { reviewNote = ''; },
    /** The game changed: no key moments. */
    clear(): void { marked = []; $('over-moments').replaceChildren(); },
  };
}
