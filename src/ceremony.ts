import './ceremony.css';
import type { Game } from './game';
import { moveNumbers } from './move-text';
import type { Position } from './rules/engine';
import type { BoardView } from './render/PaintedView';
import { ceremonyMoveLabel } from './ceremony-game';

type History = Game['history'];

/** Phase 2 supplies the live game guard and opens the result after `done`. */
export function startCeremony({ view, board, moments, history, final, king, showPly, motion, live }: {
  view: BoardView;
  board: HTMLElement;
  moments: HTMLElement;
  history: History;
  final: Position;
  king: number | null;
  showPly: (ply: number) => void;
  motion: boolean;
  live: () => boolean;
}): { done: Promise<boolean>; skip: () => void; cancel: () => void } {
  motion &&= !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const words = document.createElement('div');
  words.className = 'kd-words';
  words.textContent = 'King Down';
  words.hidden = true;
  words.setAttribute('aria-hidden', 'true');
  board.append(words);
  const caption = document.createElement('div');
  caption.className = 'ceremony-caption';
  caption.textContent = 'The final blow · Tap to skip';
  caption.hidden = !motion;
  board.append(caption);
  moments.replaceChildren();
  let blow = history.length - 1;
  while (blow >= 0 && history[blow].move.pass) blow--;
  let stopped = false, completed = false, resume: (() => void) | null = null;

  const tiles = (): void => {
    moments.replaceChildren();
    if (blow < 0) return;
    const special = history.map((h, ply) => ({ h, ply })).filter(({ h, ply }) => ply !== blow && !h.move.pass
      && (h.move.power || h.move.captures.length || h.move.swap || h.move.shove || h.move.promo));
    const winner = history[blow].pos.turn;
    special.sort((a, b) => Number(b.h.pos.turn === winner) - Number(a.h.pos.turn === winner));
    const plies = [blow, ...special.slice(0, 2).map(h => h.ply)].sort((a, b) => a - b);
    const numbers = moveNumbers(history.map(h => h.pos.turn));
    const head = document.createElement('p');
    head.className = 'tiles-head';
    head.textContent = 'Moves to look at again';
    const row = document.createElement('div');
    row.className = 'ceremony-tiles';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', head.textContent);
    for (const [i, ply] of plies.entries()) {
      const h = history[ply], button = document.createElement('button');
      button.type = 'button';
      button.className = `ceremony-tile${h.pos.turn !== winner ? ' theirs' : ''}${motion ? ' is-in' : ''}`;
      button.style.setProperty('--i', String(i));
      button.dataset.ply = String(ply);
      const number = document.createElement('b'), label = document.createElement('span');
      number.textContent = `Move ${numbers[ply]}${ply === blow ? ' · Final blow' : ''}`;
      label.textContent = ceremonyMoveLabel(h.pos, h.move);
      button.append(number, label);
      button.onclick = () => showPly(ply);
      row.append(button);
    }
    moments.append(head, row);
  };
  const cleanup = (): void => {
    caption.remove();
    board.removeEventListener('pointerdown', onTap, true);
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('visibilitychange', onHidden);
  };
  const cancel = (): void => {
    completed = false;
    if (stopped) { words.remove(); return; }
    stopped = true;
    // A stale wait must not stop a move in the next game.
    if (live()) view.skip();
    resume?.();
    words.remove();
    cleanup();
  };
  const skip = (): void => {
    if (stopped) return;
    if (!live()) { cancel(); return; }
    stopped = completed = true;
    view.skip();
    resume?.();
    view.sync(final);
    view.setFallen(king, false);
    words.hidden = false;
    words.classList.remove('is-in');
    motion = false;
    tiles();
    cleanup();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.target instanceof Element && e.target.closest('dialog[open]')) return;
    if (e.target instanceof Element && e.target.closest('button') && [' ', 'Enter'].includes(e.key)) return;
    if (!['Escape', ' ', 'Enter'].includes(e.key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    skip();
  };
  const onTap = (e: PointerEvent): void => {
    if (e.target instanceof Element && e.target.closest('button')) return;
    skip();
  };
  const onHidden = (): void => { if (document.hidden) skip(); };
  const wait = (ms: number): Promise<void> => new Promise(resolve => {
    const timer = setTimeout(() => { resume = null; resolve(); }, ms);
    resume = () => { clearTimeout(timer); resume = null; resolve(); };
  });
  const current = (): boolean => {
    if (!live()) cancel();
    return !stopped;
  };
  board.addEventListener('pointerdown', onTap, true);
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('visibilitychange', onHidden);

  const done = (async (): Promise<boolean> => {
    try {
      if (!live()) { cancel(); return false; }
      if (!motion || document.hidden) { skip(); return completed; }
      view.setFallen(null);
      await wait(120);
      if (!current()) return completed;
      if (blow >= 0) {
        const h = history[blow];
        view.sync(h.pos);
        await view.animateMove(h.pos, h.move, undefined, 0.5);
        if (!current()) return completed;
      }
      view.sync(final);
      caption.remove();
      view.setFallen(king);
      await wait(650);
      if (!current()) return completed;
      words.hidden = false;
      words.classList.add('is-in');
      await wait(900);
      if (!current()) return completed;
      tiles();
      stopped = completed = true;
      return true;
    } finally { cleanup(); }
  })();
  return { done, skip, cancel };
}
