import { GameRules } from '../../game-rules';
import { call, client, gameActionsBlocked, memory, navigate, routeView, queue } from '../../account-game/runtime';
import type { Job } from '../queue';
import { art } from '../../account-game/art';
import { board, highlight } from '../board-view';
import { ending } from '../ending';

import { LETTERS, NAMES, PLAIN_KINGS, sqName } from '../../rules/engine';
import type { KingChoice } from '../../rules/rules';
import { seatChoicesNeeded, validateChoice, type Choice } from '../../match/setup';
import type { View } from '../../match/protocol';
import { ICONS } from '../../account/profile';
import { POWER_NAME } from '../../powers-ui';
import type { Page } from '../../account-game/state';
import { playerBlockButton } from './board-actions';
import { kingSheet } from './setup';
import { legalSwaps, seatChoice, seatFen, seatIndex, seatSquare, shuffleOrder, submitReady, swapOrder } from './seat-model';
import { onStop } from './friend';
import './seat.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => (document.querySelector(`#seat-screen [data-seat-id="${id}"]`) ?? document.getElementById(id))! as T;
const strips = Object.fromEntries(['strip-me','strip-them'].map(id => [id, document.querySelector(`[data-seat-id="${id}"]`)!.innerHTML]));
let stopped = false, veilFrame = 0;
let pickTimer: ReturnType<typeof setTimeout> | undefined;
let game = '', choice: Choice | null = null, selected: number | null = null, sending = false, picking = false;
let home: { parent: HTMLElement; next: ChildNode | null; click: typeof board.onSquareClick; drag: typeof board.onDragSelect; hover: typeof board.onSquareHover; key: HTMLElement['onkeydown']; label: string | null } | undefined;
let closeMenu: (() => void) | undefined, cursor = 0;
const current = () => !stopped && !queue.closed() && client.state.screen === 'seat' && memory.view?.game_id === game ? memory.view : undefined;
const locked = () => stopped || queue.closed() || sending || picking || $<HTMLButtonElement>('seat-menu').disabled || gameActionsBlocked() || !!current()?.ready?.[current()!.seat];
const uuid = () => crypto.randomUUID().replaceAll('-', '');

function release() {
  closeMenu?.();
  if (!home) return;
  home.parent.insertBefore($('board'), home.next);
  if (home.parent.id === 'game-table') home.parent.dataset.empty = String(!memory.view?.fen);
  board.onSquareClick = home.click; board.onDragSelect = home.drag; board.onSquareHover = home.hover; $('board').onkeydown = home.key;
  if (home.label === null) $('board').removeAttribute('aria-label'); else $('board').setAttribute('aria-label', home.label);
  board.setPreview(null);
  $('seat-veil-layer')?.remove(); home = undefined;
}
function ownBoard(view: View) {
  if (home) return;
  const node = $('board');
  home = { parent: node.parentElement!, next: node.nextSibling, click: board.onSquareClick, drag: board.onDragSelect, hover: board.onSquareHover, key: node.onkeydown, label: node.getAttribute('aria-label') };
  $('seat-board-slot').replaceWith(node);
  board.onSquareClick = square => tap(square); board.onDragSelect = square => tap(square, false); board.onSquareHover = () => {};
  cursor = seatSquare(view.seat, view.seat === 1 ? 7 : 0);
  node.onkeydown = event => {
    const v = current(); if (!v || locked()) return;
    const delta = ({ ArrowLeft: -1, ArrowRight: 1 } as Record<string, number>)[event.key];
    if (delta) { event.preventDefault(); cursor = seatSquare(v.seat, Math.max(0, Math.min(7, (cursor % 8) + delta * (v.seat === 1 ? -1 : 1)))); board.setPreview(cursor); node.setAttribute('aria-label', `Your back rank, ${sqName(cursor)}. Enter selects a piece.`); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); tap(cursor); }
  };
  const layer = document.createElement('div'); layer.id = 'seat-veil-layer'; layer.className = 'board-layer';
  layer.innerHTML = `<div class="veil"><span>Their side stays hidden until ${view.opponent?.computer ? 'you are' : 'both players are'} ready.</span></div>`; node.append(layer);
  void board.ready().then(placeVeil);
}
function placeVeil() {
  const view = current(); if (!view || !home) return;
  const layer = $('seat-veil-layer'); if (!layer) return;
  const a = board.screenOf(view.seat === 0 ? 56 : 7), b = board.screenOf(view.seat === 0 ? 63 : 0), tile = Math.abs(b.x - a.x) / 7, rect = $('board').getBoundingClientRect();
  const veil = layer.firstElementChild as HTMLElement;
  Object.assign(veil.style, { left: `${Math.min(a.x,b.x) - rect.left - tile / 2}px`, top: `${a.y - rect.top - tile / 2}px`, width: `${tile * 8}px`, height: `${tile * 4}px` });
}
function tap(square: number, swap = true) {
  const view = current(); if (!view?.options?.arrangement || !choice || locked() || view.status !== 'setup') return;
  const index = seatIndex(view.seat, square); if (index === null) return;
  if (swap && selected !== null) { if (selected !== square) choice.order = swapOrder(choice.order, selected % 8, index); selected = null; }
  else selected = square;
  render();
}
function locks() {
  const view = current(); if (!view?.options || !choice) return;
  const error = validateChoice(view.options, { army: view.draw!, hand: view.deal ?? [] }, choice, view.setup_admission), lock = locked();
  for (const [id, blocked] of [['seat-shuffle', lock], ['seat-king', lock], ['seat-ready', lock || !!error]] as const) {
    const button = $<HTMLButtonElement>(id); button.setAttribute('aria-disabled', String(blocked)); if (button.disabled !== blocked) button.disabled = blocked;
  }
}
function render() {
  const view = current(); if (!choice || !view?.options || view.status !== 'setup') return;
  const needs = seatChoicesNeeded(view.options), ready = !!view.ready?.[view.seat], other = view.seat === 0 ? 1 : 0;
  for (const [id, marker] of [['strip-me','seat-me-name'],['strip-them','seat-them-name']]) if (!$(marker)) $(id).innerHTML = strips[id];
  $('seat-king').onclick = () => void pickKing();
  $('game-table').dataset.empty = 'false'; $('seat-ready').classList.toggle('primary', !ready);
  const days = view.setup_deadline_at ? Math.max(0, Math.ceil((Date.parse(view.setup_deadline_at) - Date.parse(view.server_now)) / 86400000)) : null;
  const them = view.opponent?.computer ? `Computer · ${view.level ? view.level[0].toUpperCase() + view.level.slice(1) : 'Club'}` : view.opponent?.handle ?? 'Opponent';
  $('seat-them-name').textContent = them; $('seat-them-name').title = them; $('seat-them-line').textContent = `${view.ready?.[other] ? 'Ready' : 'Choosing'}${ready && days !== null ? ` · ${days} ${days === 1 ? 'day' : 'days'} left` : ''}`;
  $<HTMLImageElement>('seat-them-picture').src = art(`ui/kings/${PLAIN_KINGS[other].toLowerCase()}${other ? '-b' : ''}.webp`);
  $('seat-me-name').textContent = memory.me?.handle ?? 'You'; $('seat-me-name').title = $('seat-me-name').textContent;
  $<HTMLImageElement>('seat-me-picture').src = art(ICONS[memory.me?.icon ?? (view.seat === 0 ? 'spirit' : 'shadow')]);
  $('seat-me-line').textContent = choice.king ? `${choice.king.king} · ${POWER_NAME[choice.king.power]}` : view.seat === 0 ? 'White · Spirit King' : 'Black · Shadow King';
  $('strip-me').classList.toggle('is-turn', !ready); $('seat-king').hidden = !needs.king; $('seat-shuffle').hidden = !needs.order;
  if (choice.king) $<HTMLImageElement>('seat-king').querySelector('img')!.src = art(`ui/emblems/${choice.king.king.toLowerCase()}.webp`);
  const error = validateChoice(view.options, { army: view.draw!, hand: view.deal ?? [] }, choice, view.setup_admission);
  const piece = selected === null ? '' : NAMES[LETTERS.indexOf(choice.order[selected % 8])];
  $('seat-context').textContent = ready ? 'Waiting for the other player.' : error ?? (selected === null ? needs.order ? 'Select one back-rank piece, then another, to swap them.' : 'Choose your king, then press Ready.' : `Select a marked piece to swap the ${piece} with it.`);
  $('seat-note').textContent = ready ? days === null ? '' : `${them} has ${days} ${days === 1 ? 'day' : 'days'} to choose.` : choice.order.includes('G') && needs.order ? 'The guard stays next to the king.' : '';
  $('last-move').textContent = '';
  const kings: [KingChoice | null, KingChoice | null] = [null,null]; kings[view.seat] = choice.king; const context = new GameRules({ kings }); board.setRules(context);
  const pos = context.fromFen(seatFen(choice.order, view.seat)); pos.turn = view.seat; board.sync(pos); board.flip(view.seat === 1);
  highlight({ selected: ready ? null : selected, swaps: !ready && selected !== null ? legalSwaps(view.options, { army: view.draw!, hand: view.deal ?? [] }, choice, view.seat, selected, view.setup_admission) : [] });
  locks(); scheduleVeil();
}
async function finish(next: View, origin?: Job) {
  if (stopped || queue.closed() || next.game_id !== game || client.state.screen !== 'seat') return;
  if (next.status === 'playing') {
    const full = next.rules ? next : await call('kingdown_get', {}, { retain: true, route: false, origin }); if (!full || !current()) return;
    release();
    routeView(full);
  } else if (next.status === 'finished' || next.status === 'aborted') {
    $('seat-context').textContent = ending(next); release(); routeView(next);
  } else routeView(next);
}
async function ready() {
  const view = current(); if (!view?.options || !choice || locked() || validateChoice(view.options, { army: view.draw!, hand: view.deal ?? [] }, choice, view.setup_admission)) return;
  sending = true; locks();
  try {
    const next = await submitReady(view, { ...choice }, { send: args => call('kingdown_choose', args, true, false, false), read: () => call('kingdown_get', {}, false, false, false), pending: gameActionsBlocked, id: uuid });
    if (next) await finish(next);
  } finally { sending = false; render(); }
}
async function pickKing() {
  const view = current(); if (!view?.options || !choice?.king || locked()) return;
  picking = true; locks();
  try { const pick = await kingSheet(view.options, choice.king, view.setup_admission); if (current()?.game_id === view.game_id && choice && !current()?.ready?.[view.seat]) choice.king = pick; }
  // The sheet gives focus back while the coin is still locked, and a disabled coin cannot take it.
  finally { picking = false; render(); if (current() && (!document.activeElement || document.activeElement === document.body)) $('seat-king').focus({ preventScroll: true }); }
}
function menu(confirm = false) {
  closeMenu?.(); const view = current(); if (!view) return;
  const dialog = document.createElement('dialog'), scrim = document.createElement('div'), page = document.querySelector<HTMLElement>('.page-sheet')!, focus = document.activeElement as HTMLElement;
  dialog.id = 'seat-menu-sheet'; dialog.className = 'over-sheet'; dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-labelledby', 'seat-menu-title'); scrim.className = 'scrim';
  dialog.innerHTML = `<header class="sheet-head"><h2 id="seat-menu-title">${confirm ? 'Abort this game?' : 'Menu'}</h2><button id="seat-menu-close" aria-label="Close">×</button></header><div class="sheet-body">${confirm ? '<p>The game ends with no result.</p><button id="seat-abort-confirm">Abort</button><button id="seat-abort-cancel" class="primary">Cancel</button>' : `${view.abort_open ? '<button id="seat-abort" class="menu-row">Abort</button>' : ''}<button id="seat-settings" class="menu-row">Settings</button>`}</div>`;
  page.inert = true; $('app-frame').append(scrim, dialog); dialog.show(); client.state.sheet = confirm ? 'seat-abort' : 'seat-menu'; client.save();
  const close = () => { dialog.remove(); scrim.remove(); page.inert = false; closeMenu = undefined; document.removeEventListener('keydown', key); if (stopped || queue.closed()) return; client.state.sheet = undefined; client.save(); focus?.focus({preventScroll:true}); };
  const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'Tab') { const buttons = [...dialog.querySelectorAll<HTMLButtonElement>('button')], i = buttons.indexOf(document.activeElement as HTMLButtonElement); if (event.shiftKey && i <= 0 || !event.shiftKey && i === buttons.length - 1) { event.preventDefault(); buttons[event.shiftKey ? buttons.length - 1 : 0].focus(); } } };
  document.addEventListener('keydown', key); closeMenu = close; $('seat-menu-close').onclick = scrim.onclick = close;
  if (confirm) { $('seat-abort-cancel').onclick = close; $('seat-abort-confirm').onclick = async () => { const v = current(); if (!v?.abort_open || sending || gameActionsBlocked()) return; close(); sending = true; locks(); try { const next = await call('kingdown_abort', { game_id: v.game_id, command_id: uuid(), expected_revision: v.revision }, true, false, false); if (next) await finish(next); } finally { sending = false; render(); } }; }
  else { if (view.abort_open) $('seat-abort').onclick = () => menu(true); $('seat-settings').onclick = () => { close(); navigate('settings'); }; }
  if (!confirm) for (const block of playerBlockButton(view, close)) { block.className = 'menu-row'; $('seat-settings').before(block); }
  $('seat-menu-close').focus();
}

/** The continuation of a resent Seat command (design §5.2): Seat finishes with the reply. */
export async function finishSeat(next: View, origin: Job) {
  sending = true; locks();
  try { await finish(next, origin); } finally { sending = false; render(); }
}
// The store's subscriber replaces the data-page, #status and #seat-ready observers. The ResizeObserver stays: it measures layout.
export function seatSync(page: Page) {
  if (stopped || queue.closed()) return;
  if (page.screen !== 'seat') { release(); return; }
  if (current()?.status === 'setup' && !sending) seatScreen();
  else locks();
}
function scheduleVeil() { if (!current()) return; cancelAnimationFrame(veilFrame); veilFrame = requestAnimationFrame(placeVeil); }
const observer = new ResizeObserver(scheduleVeil); observer.observe($('board'));
onStop(() => { stopped = true; observer.disconnect(); cancelAnimationFrame(veilFrame); clearTimeout(pickTimer); release(); choice = null; selected = null; });
$('seat-ready').onclick = () => void ready(); $('seat-menu').onclick = () => menu(); $('seat-king').onclick = () => void pickKing();
$('seat-shuffle').onclick = () => { const view = current(); if (view?.options?.arrangement && choice && !locked()) { choice.order = shuffleOrder(view); selected = null; render(); } };
export function seatScreen() {
  if (stopped || queue.closed()) return;
  const view = memory.view; if (client.state.screen !== 'seat' || !view) return;
  if (!view.options) { release(); routeView(view); return; }
  if (view.status !== 'setup') {
    game = view.game_id;
    if (!gameActionsBlocked() && !sending && view.options && Object.values(seatChoicesNeeded(view.options)).some(Boolean)) { sending = true; void finish(view).finally(() => { sending = false; }); }
    return;
  }
  const own = seatChoice(view, memory.settings?.last_setup?.king ?? null); if (!own) return;
  if (game !== view.game_id || !choice) { game = view.game_id; choice = own; selected = view.options.arrangement && !view.ready?.[view.seat] && own.order.includes('N') ? seatSquare(view.seat, own.order.indexOf('N')) : null; }
  else if (view.ready?.[view.seat]) { choice = own; selected = null; }
  if (!$('seat-board-slot') && !home) { const slot = document.createElement('div'); slot.id = 'seat-board-slot'; $('game-table').prepend(slot); }
  ownBoard(view); render();
  if (!closeMenu && ['seat-menu','seat-abort'].includes(client.state.sheet ?? '')) menu(client.state.sheet === 'seat-abort');
  else if (!picking && client.state.sheet === 'king') { clearTimeout(pickTimer); pickTimer = setTimeout(() => { if (client.state.sheet === 'king' && !locked()) void pickKing(); }, 0); }
}
