/**
 * Arrange mode (index.html #arrange): before the game each side orders its own back rank. Tap a
 * piece, then another, to swap them; Randomize deals a random legal order. Each side presses Ready;
 * Start game is open once both are ready. A computer side arranges itself with Randomize.
 */
import type { Side } from './game';
import { LETTERS, NAMES, type Color, type PieceType } from './rules/engine';
import { arrangementError, randomArrangement } from './rules/setup';
import { pieceIcon } from './piece-icons';

const SIDE = ['White', 'Black'] as const;

/** Swap squares `i` and `j` of a back-rank string. */
export const swapAt = (row: string, i: number, j: number): string => {
  const a = [...row];
  [a[i], a[j]] = [a[j], a[i]];
  return a.join('');
};

export function arrangeDialog(): { open(army: string, sides: readonly [Side, Side], start: (white: string, black: string) => void): void } {
  const dlg = document.getElementById('arrange') as HTMLDialogElement;
  let army = '', rows: [string, string] = ['', ''], ready = [false, false], picked: [number | null, number | null] = [null, null];
  let players: readonly [Side, Side] = ['human', 'human'], done: (w: string, b: string) => void = () => {};

  for (const c of [0, 1] as const) {
    const box = document.getElementById(`arrange-${c}`)!;
    box.innerHTML = `<h3>${SIDE[c]}'s back rank <span class="who"></span></h3>`
      + `<div class="arrange-row" role="group" aria-label="${SIDE[c]}'s back rank">${[...'abcdefgh'].map((f, i) =>
        `<button type="button" class="arrange-sq ${(i + c) % 2 ? 'light' : 'dark'}" data-i="${i}"><span class="piece"></span><span class="file">${f}</span></button>`).join('')}</div>`
      + `<div class="arrange-tools"><button type="button" class="randomize">Randomize</button>`
      + `<button type="button" class="ready" aria-pressed="false">Ready</button></div>`
      + `<p class="arrange-error" aria-live="polite"></p>`;
    for (const b of box.querySelectorAll<HTMLButtonElement>('.arrange-sq')) b.onclick = () => {
      const i = +b.dataset.i!, p = picked[c];
      if (p == null) picked[c] = i;
      else { picked[c] = null; if (p !== i) { rows[c] = swapAt(rows[c], p, i); ready[c] = false; } }
      render();
    };
    box.querySelector<HTMLButtonElement>('.randomize')!.onclick = () => { rows[c] = randomArrangement(army); picked[c] = null; ready[c] = false; render(); };
    box.querySelector<HTMLButtonElement>('.ready')!.onclick = () => { ready[c] = !ready[c] && !arrangementError(rows[c], army); picked[c] = null; render(); };
  }
  document.getElementById('arrange-start')!.onclick = () => { dlg.close('start'); done(rows[0], rows[1]); };

  function render(): void {
    for (const c of [0, 1] as const) {
      const box = document.getElementById(`arrange-${c}`)!, ai = players[c] === 'ai', err = arrangementError(rows[c], army);
      box.querySelector('.who')!.textContent = ai ? '· computer' : players[0] === players[1] ? '' : '· you';
      box.querySelectorAll<HTMLButtonElement>('.arrange-sq').forEach((b, i) => {
        const t = LETTERS.indexOf(rows[c][i]) as PieceType;
        b.querySelector('.piece')!.innerHTML = pieceIcon(t, c) || rows[c][i];
        b.title = `${NAMES[t]} on ${'abcdefgh'[i]}${c ? 8 : 1}`;
        b.setAttribute('aria-label', b.title);
        b.setAttribute('aria-pressed', String(picked[c] === i));
        b.disabled = ai;
      });
      box.querySelector<HTMLButtonElement>('.randomize')!.disabled = ai;
      const r = box.querySelector<HTMLButtonElement>('.ready')!;
      r.disabled = ai || !!err;
      r.setAttribute('aria-pressed', String(ready[c]));
      r.textContent = ready[c] ? 'Ready ✓' : 'Ready';
      box.querySelector('.arrange-error')!.textContent = err ?? '';
    }
    (document.getElementById('arrange-start') as HTMLButtonElement).disabled = !(ready[0] && ready[1]);
  }

  return {
    open(a, sides, start): void {
      army = a; players = sides; done = start; dlg.returnValue = '';
      rows = [a, a]; picked = [null, null];
      // A computer side uses its own Randomize and is ready at once.
      ready = sides.map((s, c) => { if (s === 'ai') rows[c as Color] = randomArrangement(a); return s === 'ai'; });
      render();
      dlg.showModal();
    },
  };
}
