/**
 * Arrange mode: before the game each side orders its own back rank on the real board. Tap (or drag)
 * one of your back-rank pieces, then another, to swap them; Randomize deals a random legal order.
 * Each side presses Ready; Start game is open once both are ready. A computer side randomizes
 * itself and is ready at once. The controls sit in the panel (#arrange in index.html).
 */
import type { Side } from './game';
import { NAMES, LETTERS, file as fileOf, rank as rankOf, sq, type Color, type PieceType } from './rules/engine';
import { arrangementError, randomArrangement, startPosition } from './rules/setup';
import type { BoardView } from './render/PaintedView';

const SIDE = ['White', 'Black'] as const;

/** Swap squares `i` and `j` of a back-rank string. */
export const swapAt = (row: string, i: number, j: number): string => {
  const a = [...row];
  [a[i], a[j]] = [a[j], a[i]];
  return a.join('');
};

export interface ArrangeMode {
  readonly active: boolean;
  open(army: string, sides: readonly [Side, Side], start: (white: string, black: string) => void, cancel: () => void): void;
  /** Board taps while arranging. */
  click(sq: number): void;
  /** Drag start: pick without the tap toggle, so the drop swaps. */
  pick(sq: number): void;
}

export function arrangeMode(view: BoardView): ArrangeMode {
  const panel = document.getElementById('panel')!, box = document.getElementById('arrange')!;
  let army = '', rows: [string, string] = ['', ''], ready = [false, false], picked: number | null = null, active = false;
  let players: readonly [Side, Side] = ['human', 'human'], done: (w: string, b: string) => void = () => {}, quit = () => {};
  const $ = <T extends HTMLElement>(s: string) => box.querySelector<T>(s)!;

  const canMove = (c: Color): boolean => players[c] === 'human' && !ready[c];
  /** The side whose back rank holds `s`, if that side may still arrange it. */
  const ownerOf = (s: number): Color | null => {
    const c = rankOf(s) === 0 ? 0 : rankOf(s) === 7 ? 1 : null;
    return c != null && canMove(c) ? c : null;
  };
  const say = (t: string) => { $('.arrange-help').textContent = t; };

  for (const c of [0, 1] as const) {
    $(`.arrange-side[data-c="${c}"] .randomize`).onclick = () => { rows[c] = randomArrangement(army); ready[c] = false; picked = null; render(); };
    $(`.arrange-side[data-c="${c}"] .ready`).onclick = () => { ready[c] = !ready[c] && !arrangementError(rows[c], army); picked = null; render(); };
  }
  $('.arrange-start').onclick = () => { close(); done(rows[0], rows[1]); };
  $('.arrange-cancel').onclick = () => { close(); quit(); };

  function close(): void { active = false; box.hidden = true; panel.classList.remove('arranging'); }

  function render(): void {
    // The board drags only the side to move: make that the first side still arranging.
    const pos = startPosition(rows[0], rows[1]);
    pos.turn = canMove(0) ? 0 : 1;
    view.sync(pos);
    const c = picked == null ? null : ownerOf(picked);
    view.highlight({ selected: picked, swaps: c == null ? [] : [...Array(8).keys()].map(f => sq(f, c ? 7 : 0)).filter(s => s !== picked) });
    for (const c of [0, 1] as const) {
      const side = $(`.arrange-side[data-c="${c}"]`), ai = players[c] === 'ai', err = arrangementError(rows[c], army);
      side.querySelector('.who')!.textContent = ai ? ' · computer' : players[0] === players[1] ? '' : ' · you';
      side.querySelector<HTMLButtonElement>('.randomize')!.disabled = ai;
      const r = side.querySelector<HTMLButtonElement>('.ready')!;
      r.disabled = ai || !!err;
      r.setAttribute('aria-pressed', String(ready[c]));
      r.textContent = ready[c] ? 'Ready ✓' : 'Ready';
      side.querySelector('.arrange-error')!.textContent = err ?? '';
    }
    $<HTMLButtonElement>('.arrange-start').disabled = !(ready[0] && ready[1]);
  }

  return {
    get active() { return active; },
    open(a, sides, start, cancel): void {
      army = a; players = sides; done = start; quit = cancel; picked = null; active = true;
      rows = [a, a];
      // A computer side uses its own Randomize and is ready at once.
      ready = sides.map((s, c) => { if (s === 'ai') rows[c as Color] = randomArrangement(a); return s === 'ai'; });
      panel.classList.add('arranging'); document.getElementById('turn')!.textContent = 'Before the game'; document.getElementById('status')!.textContent = ''; box.hidden = false; panel.scrollTop = 0;
      say('Tap one of your back-rank pieces, then another, to swap them.');
      render();
    },
    click(s): void {
      const c = ownerOf(s), p = picked;
      if (c == null) {
        picked = null;
        const back = rankOf(s) === 0 || rankOf(s) === 7, side = rankOf(s) < 4 ? 0 : 1;
        say(!back ? 'Only the back-rank pieces move. The pawns stay in place.'
          : players[side] === 'ai' ? "That is the computer's rank." : `${SIDE[side]} is ready. Press Ready again to change the rank.`);
      } else if (p == null || ownerOf(p) !== c) { picked = s; const n = NAMES[LETTERS.indexOf(rows[c][fileOf(s)]) as PieceType]; say(`${n[0].toUpperCase() + n.slice(1)} picked. Tap another piece of this rank to swap.`); }
      else { picked = null; if (p !== s) rows[c] = swapAt(rows[c], fileOf(p), fileOf(s)); say(''); }
      render();
    },
    pick(s): void { if (ownerOf(s) != null) { picked = s; render(); } },
  };
}
