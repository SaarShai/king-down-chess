import { LETTERS, type PieceType } from '../rules/engine';
import { pieceIcon } from '../piece-icons';
import { homeState, todayDeal, type HomeInput } from './home';
import './home.css';

/** Home uses the table's board and Menu. Its rows have the same size as play. */
export function initHome(actions: {
  read: () => HomeInput;
  continue: () => void;
  rematch: () => void;
  review: () => void;
  newGame: () => void;
  today: () => void;
}) {
  const $ = (id: string): HTMLElement => document.getElementById(id)!;
  const table = $('game-table'), menu = $('menu-btn');
  const parts = [...table.querySelectorAll<HTMLElement>('[data-home-part]')];
  let visible = false;
  function refresh(): void {
    if (!visible) return;
    const state = homeState(actions.read());
    $('home-opponent').textContent = state.opponent;
    $('home-progress').textContent = state.progress;
    $('home-result').textContent = state.result;
    $('home-result').hidden = !state.result;
    $('home-main').querySelector('.label')!.textContent = state.action;
    $('home-detail').textContent = state.detail;
    $('home-review').hidden = !state.review;
    $('last-move').innerHTML = '<span></span>';
    $('last-move').querySelector('span')!.textContent = state.lastMove || 'No moves yet.';
    const today = todayDeal(new Date());
    $('home-date').textContent = today.label;
    $('home-army').innerHTML = [...today.army].map(p => pieceIcon(LETTERS.indexOf(p) as PieceType)).join('');
  }
  function close(): void {
    if (visible) {
      try { sessionStorage.setItem('kingdown.title-seen', '1'); } catch { /* Home still closes. */ }
    }
    visible = false;
    delete table.dataset.home;
    parts.forEach(p => { p.hidden = true; });
    $('table-bar').append(menu);
  }
  function open(): void {
    visible = true;
    table.dataset.home = '';
    parts.forEach(p => { p.hidden = false; });
    $('home-head').append(menu);
    refresh();
    $('home-main').focus({ preventScroll: true });
  }
  function resume(): void {
    close();
    actions.continue();
    $('board').focus({ preventScroll: true });
  }
  $('home-main').onclick = () => homeState(actions.read()).review ? actions.rematch() : resume();
  $('home-new').onclick = actions.newGame;
  $('home-today').onclick = actions.today;
  $('home-review').onclick = () => { close(); actions.review(); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  return { get visible() { return visible; }, open, close, refresh, resume };
}
