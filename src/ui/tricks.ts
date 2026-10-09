import type { Game, Side } from '../game';
import { NAMES, type Color, type PieceType } from '../rules/engine';
import { pieceIcon } from '../piece-icons';
import { TRICKS, tricksInTurn } from '../tricks';
import { loadSeals, saveSeal, seeSeals } from '../trick-store';
import './tricks.css';

// The Menu demo's wax rim, with eighteen soft waves.
const WAX = Array.from({ length: 145 }, (_, i) => {
  const a = i / 144 * Math.PI * 2, r = 22.4 + 1.25 * Math.cos(a * 18);
  return `${i ? 'L' : 'M'}${(24 + r * Math.cos(a)).toFixed(2)} ${(24 + r * Math.sin(a)).toFixed(2)}`;
}).join('') + 'Z';

export function refreshTricks(): void {
  const seals = loadSeals();
  document.getElementById('menu-seal-dot')!.hidden = !seals.unseen;
  document.getElementById('menu-btn')!.setAttribute('aria-label', seals.unseen ? 'Menu, new seal' : 'Menu');
  document.getElementById('tricks-row')!.hidden = !seals.found.length;
  const rows = [...seals.found.map(id => TRICKS.find(t => t.id === id)!), ...TRICKS.filter(t => !seals.found.includes(t.id))];
  document.getElementById('tricks-list')!.innerHTML = rows.map(t => {
    const found = seals.found.includes(t.id);
    const seal = found ? `<span class="trick-seal" aria-hidden="true"><svg class="wax" viewBox="0 0 48 48"><path d="${WAX}"/><circle cx="24" cy="24" r="17.6"/></svg>${pieceIcon(NAMES.indexOf(t.seal) as PieceType)}</span>` : '';
    return `<li class="${found ? 'found-row' : 'riddle'}" data-trick="${t.id}"><span class="trick-figure"><img src="${import.meta.env.BASE_URL}${t.art}" alt="">${seal}</span>
      <div><span class="trick-kind">${found ? 'Found' : 'Riddle'}</span>${found ? `<b>${t.name}</b>` : ''}<p>${found ? t.found : t.riddle}</p></div></li>`;
  }).join('');
}

export function openTricksMenu(): void {
  seeSeals();
  refreshTricks();
}

/** W1 calls this only at a successful press, before the turn start moves. */
export function awardTurnSeals(game: Game, start: number, sides: readonly [Side, Side], linkSide: Color | null): void {
  for (const id of tricksInTurn(game.history, start, sides, linkSide)) saveSeal(id);
  refreshTricks();
}
