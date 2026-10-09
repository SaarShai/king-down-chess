import type { Game } from './game';
import type { BoardView } from './render/PaintedView';
import type { Move } from './rules/engine';

/** W1 keeps the Undo floor; this control only plays the staged ply backward. */
export function connectMoveMoments(view: BoardView, c: {
  game(): Game;
  allowed(): boolean;
  chain(): boolean;
  generation(): number;
  motion(): boolean;
  reset(): void;
  lock(value: boolean): void;
  afterUndo(): void;
  refresh(): void;
}) {
  let endTell: (() => void) | null = null;
  const cancel = (): void => { endTell?.(); view.setLifted?.(null); view.skip(); };
  const undo = (): void => {
    if (!c.allowed()) return;
    const game = c.game(), post = game.pos, last = game.history.at(-1), chain = c.chain();
    c.reset();
    if (!chain) game.undo();
    const generation = c.generation();
    c.lock(true);
    const done = !chain && last && view.animateBack
      ? view.animateBack(game.pos, last.move, post)
      : (view.sync(game.pos), Promise.resolve());
    c.afterUndo();
    void done.then(() => {
      if (generation !== c.generation()) return;
      c.lock(false);
      c.refresh();
    });
  };
  const tell = async (move: Move): Promise<boolean> => {
    if (!view.setLifted || !c.motion() || document.hidden
      || move.pass || move.from === move.to || ['freeze', 'ward', 'sacrifice'].includes(move.power ?? '')) return true;
    const generation = c.generation(), game = c.game(), position = game.pos;
    view.setLifted(move.from);
    c.refresh();
    await new Promise<void>(resolve => {
      const done = (): void => { endTell = null; resolve(); };
      const timer = setTimeout(done, 200);
      endTell = () => { clearTimeout(timer); done(); };
    });
    if (generation !== c.generation() || game !== c.game() || position !== game.pos) return false;
    view.setLifted(null);
    return true;
  };
  return { undo, cancel, tell };
}
