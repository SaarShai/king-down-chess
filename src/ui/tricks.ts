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
  for (const [button, dot, name] of [['menu-btn', 'menu-seal-dot', 'Menu'], ['extra-row', 'extra-seal-dot', 'Extra'], ['tricks-row', 'tricks-seal-dot', 'Tricks']]) {
    document.getElementById(dot)!.hidden = !seals.unseen;
    document.getElementById(button)!.setAttribute('aria-label', seals.unseen ? `${name}, new seal` : name);
  }
  const count = `${seals.found.length} of ${TRICKS.length} found`;
  document.getElementById('tricks-count')!.textContent = count;
  document.getElementById('tricks-intro')!.textContent = `${count}. Each trick you find gets a seal.`;
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
export function awardTurnSeals(game: Game, start: number, sides: readonly [Side, Side], linkSide: Color | null): string[] {
  const found = tricksInTurn(game.history, start, sides, linkSide).filter(id => saveSeal(id));
  refreshTricks();
  return found.map(id => TRICKS.find(t => t.id === id)!.name);
}
