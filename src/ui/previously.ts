import type { Game } from '../game';
import type { BoardView } from '../render/PaintedView';
import { snd } from '../render/sfx';
import { momentKind } from '../moment';
import { inCheck } from '../rules/engine';
import { fromFen } from '../rules/setup';
import { finishLinkedTurn } from '../turn';
import { previouslyPlayback, previouslyTurn, type PreviouslyTurn } from '../previously';

export interface PreviouslyState extends PreviouslyTurn { seeAgain: boolean; playing: boolean }

interface Controls {
  game(): Game;
  view: BoardView;
  generation(): number;
  navigation(): number;
  motion(): boolean;
  blocked(): boolean;
  show(ply: number | null, playing: boolean): void;
  refresh(): void;
}

/** Replay reads the kept game; it never plays or removes a game ply. */
export function connectPreviously(button: HTMLButtonElement, c: Controls) {
  let game: Game | null = null, turn: PreviouslyTurn | null = null;
  let played = false, complete = false, playing = false, fresh = false;
  let run = 0;
  const options = () => ({ played, complete, motion: c.motion(), reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches });
  const state = (): PreviouslyState | null => game === c.game() && turn && game.history.length === turn.to
    ? { ...turn, seeAgain: previouslyPlayback(turn, options()).seeAgain, playing } : null;

  async function replay(): Promise<void> {
    const s = state();
    if (!s || !s.seeAgain || c.blocked() || playing) return;
    const current = c.game(), token = ++run, generation = c.generation(), navigation = c.navigation();
    const live = () => token === run && generation === c.generation() && navigation === c.navigation() && current === c.game();
    playing = true;
    c.show(s.from, true);
    c.view.sync(current.positionAfter(s.from));
    c.refresh();
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!live()) return;
    for (let i = s.from; i < s.to; i++) {
      if (!c.motion() || matchMedia('(prefers-reduced-motion: reduce)').matches) break;
      const { pos, move } = current.history[i], kind = momentKind(pos, move);
      const hit = kind === 'shove' || kind === 'shoveGuard' ? snd.shove
        : kind === 'chain' || kind === 'reaver' ? snd.chain
        : move.captures.length || move.selfRemove ? snd.capture : null;
      if (kind === 'shot' || kind === 'deathTouch' || kind === 'strikeCapture' || kind === 'lob' || kind === 'strike') snd.shot();
      else if (kind === 'swap' || kind === 'swapKing') snd.swap();
      else if (!hit) snd.move();
      let struck = false;
      const contact = () => { if (live() && !struck) { struck = true; hit?.(); } };
      await c.view.animateMove(pos, move, contact);
      if (!live()) return;
      contact();
      c.view.sync(current.positionAfter(i + 1));
      if (inCheck(current.positionAfter(i + 1))) snd.check();
    }
    playing = false;
    c.show(null, false);
    c.view.sync(current.pos);
    c.refresh();
  }

  button.onclick = () => { void replay(); };
  return {
    state,
    load(params: URLSearchParams, seenPlies: number): void {
      game = c.game();
      try {
        const army = params.get('army'), lans = params.get('moves')?.split('_').filter(Boolean) ?? [];
        if (army) game.newGame(army); else game.load(fromFen(params.get('fen')!));
        complete = game.playLan(lans) === lans.length;
        if (!complete) alert('Part of this game link could not be read; the game stops before that move.');
        finishLinkedTurn(game);
        turn = previouslyTurn(game.history, game.pos.turn);
        fresh = game.history.length > seenPlies;
      } catch (error) {
        alert(`This game link could not be read: ${(error as Error).message}`);
        game.newGame();
        turn = null;
        complete = false;
      }
    },
    position() {
      if (fresh && previouslyPlayback(turn, options()).play && turn) {
        playing = true;
        c.show(turn.from, true);
        return c.game().positionAfter(turn.from);
      }
      return c.game().pos;
    },
    async start(): Promise<void> {
      const play = fresh && previouslyPlayback(turn, options()).play;
      played = true;
      if (playing) {
        playing = false;
        c.show(null, false);
        if (!play) { c.view.sync(c.game().pos); c.refresh(); }
      }
      if (play) await replay();
    },
    cancel(): void {
      run++;
      if (playing) {
        playing = false;
        c.view.skip();
        c.show(null, false);
        c.view.sync(c.game().pos);
        c.refresh();
      }
    },
    clear(): void {
      run++;
      game = null; turn = null; playing = false; played = false; fresh = false;
      c.view.skip();
    },
  };
}
