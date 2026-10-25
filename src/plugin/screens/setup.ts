import { actions, call, client, memory, navigate, queue, routeView, start, store } from '../../account-game/runtime';
import type { Job, JobOptions } from '../queue';
import { art } from '../../account-game/art';
import { cardArt } from '../card-face';
import { errorText } from '../../account-game/types';
import { ALWAYS_ON, DEAL_CARDS, POOL_KINDS, validate, type Options } from '../../match/setup';
import { LETTERS, NAMES } from '../../rules/engine';
import type { SetupAdmission } from '../../match/setup';
import { DEFAULT_RULES, POWERS_BALANCED, KINGS, type KingChoice, type KingName, type CardName, type PowerName } from '../../rules/rules';
import { POWER_NAME, cardName, cardCost, cardText, powerText, powerTitle, powerOptions, powersRules, ruleLine } from '../../powers-ui';
import type { View } from '../../match/protocol';
import { locks, type Page } from '../../account-game/state';
import { availablePowers, cleanKing, createArguments, gameSetup, pieceLocked, quickSetup, rankedOffered, readSetup, setupOptions, shownKing, soloChoice, withCard, withPiece, withToggle, withMode, type SetupState } from './setup-model';
import { onStop } from './friend';
import { RANKED_RULES, RANKED_HELP } from '../../account-game/rating-policy';
import { MENU_LEVELS, LEVEL_NAMES, LEVEL_LINES, menuLevel, levelPosition, levelSlider } from '../../level-ui';
import './setup.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
const icon = (name: string) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const image = (path: string, cls = '') => `<img class="${cls}" src="${art(path)}" alt="">`;
const name = (word: string) => word[0].toUpperCase() + word.slice(1);
export const ANY_RULES = 'Join the oldest open game, whatever its rules.';
const pieceLines = { A: 'Shoots without moving.', L: 'Jumps over its own pieces.', G: 'Only a king takes it.', M: 'Swaps with a friend.', S: 'Bites in a chain.', O: 'Shoves a neighbour.', R: 'Moves in straight lines.', B: 'Moves on diagonals.', N: 'Jumps in an L.', Q: 'Moves in any line.' };
/** The rules of a game with king powers; a game without them plays DEFAULT_RULES (src/match/worker.ts). */
export const kingRules = powersRules({ ...DEFAULT_RULES, ...POWERS_BALANCED });
let stopped = false;
let cardMode: 'all' | 'four' = 'all', allCardPool: CardName[] = [...DEAL_CARDS];
const sectionOpen = { fairy: true, cards: true };
const pieceLetters = Object.keys(pieceLines).filter(letter => POOL_KINDS.includes(letter)) as (keyof typeof pieceLines)[];
// anyRules: 'Any rules' under Random (owner item D1 a). It applies to this start only and is not saved.
let draft: SetupState | undefined, anyRules = false, starting = false, late = false, closeSheet: (() => void) | undefined;
export const setupBusy = () => starting || locks(store.page()).start;
/** A start of this screen runs: Start is busy, and no other start or game command waits on it. */
export const setupStarting = () => starting;
function segment(id: string, title: string, values: readonly string[]) {
  return `<fieldset id="${id}" class="seg"><legend>${title}</legend><div class="seg-row">${values.map(value => `<label><input type="radio" name="${id}" value="${value}" aria-label="${name(value)}"><span>${name(value)}</span></label>`).join('')}</div></fieldset>`;
}
function toggle(key: string, symbol: string, title: string, line: string, sub = false) {
  return `<label id="${key}-row" class="check toggle${sub ? ' sub' : ''}"><input id="setup-toggle-${key}" type="checkbox" aria-label="${title}"><span class="t-ico">${icon(symbol)}</span><span class="grow">${title}<small id="${key}-line">${line}</small></span></label>`;
}
function section(key: 'fairy' | 'cards', title: string, body: string) {
  return `<section id="${key}-row" class="setup-section"><div class="section-head"><button id="${key}-heading" type="button" aria-expanded="false" aria-controls="${key}-body"><span class="t-ico">${icon(key)}</span><span class="grow">${title}<small id="${key}-count"></small></span><span class="chev" aria-hidden="true">›</span></button><label class="section-switch"><input id="setup-toggle-${key}" type="checkbox" aria-label="${title}"></label></div><div id="${key}-body" class="section-body" hidden>${body}</div></section>`;
}
function pieceList() {
  return `<p class="quiet-line">The draw takes 7 pieces from the checked kinds. The king and the pawns are always in.</p><p class="lock-note" hidden>${icon('lock')}<span>Keep at least 7 pieces in the pool. Check another kind to free a lock.</span></p><div class="pick-list">${pieceLetters.map(letter => {
    const n = NAMES[LETTERS.indexOf(letter)];
    return `<label class="check pick"><span class="pick-art">${image(`ui/pieces/${n}-w.webp`)}</span><span class="grow">${image(`ui/icons/${n}.svg`, 'pi')} ${name(n)}<small>${pieceLines[letter]}</small></span><span class="lock" hidden>${icon('lock')}</span><input type="checkbox" value="${letter}" aria-label="${name(n)}"></label>`;
  }).join('')}</div>`;
}
function cardTiles() {
  return `<div id="setup-card-pool" class="card-grid" role="group" aria-label="Card pool">${DEAL_CARDS.map(card => `<div class="setup-card" data-card="${card}"><button id="setup-card-${card}" type="button" class="card-face" aria-haspopup="dialog" aria-label="${cardName(card)}"><span class="cf-art">${cardArt(card)}</span><span class="cf-text"><b>${cardName(card)}</b></span></button><label class="card-use"><input type="checkbox" value="${card}" aria-label="Use ${cardName(card)}"></label></div>`).join('')}</div>`;
}
function build() {
  $('setup-body').innerHTML = `<fieldset class="modes"><legend class="sr-only">Who you play</legend>${(['solo','friend','random'] as const).map(kind => `<label class="mode"><input type="radio" name="setup-mode" value="${kind}" aria-label="${{ solo: 'Artificial', friend: 'A friend', random: 'Random' }[kind]}">${icon({ solo: 'brain', friend: 'smiling-pawn', random: 'die' }[kind])}<span class="mode-text"><b>${{ solo: 'Artificial', friend: 'A friend', random: 'Random' }[kind]}</b></span></label>`).join('')}</fieldset>
    <details id="setup-options"><summary>Game options</summary>
    ${segment('setup-rating', 'Game mode', ['casual','ranked'])}<p id="setup-rating-line" class="quiet-line">${rankedOffered() ? 'Casual does not change ratings. Ranked uses your existing rating.' : 'A game with a random player is Casual. Casual does not change ratings.'}</p><p id="setup-ranked-rules" class="quiet-line" hidden>${RANKED_RULES} ${RANKED_HELP}</p>
    ${toggle('anyRules', 'globe', 'Any rules', ANY_RULES)}
    <button id="play-open" class="menu-row has-lead"><span class="row-art fan">${['frost','flame','stratus'].map(k => image(`ui/emblems/${k}.webp`)).join('')}</span><span class="row-title">Open games</span><span class="line">Join a game that another player opened.</span><i aria-hidden="true">›</i></button>
    <div id="play-join"><h3 class="group-head">Join with a code</h3><form id="join-form" class="code-row"><input id="token" class="field" aria-label="Game code" placeholder="K7QX2M" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="go" required maxlength="300"><button id="join" type="submit">Join</button></form></div>
    ${levelSlider('setup-level')}<p id="level-line" class="seg-line"></p>
    <h3 id="setup-game-heading" class="group-head">The game</h3><fieldset id="setup-colour" class="seg colour-switch"><legend class="sr-only">Colour</legend><div class="seg-row">${['white','black'].map(value => `<label><input type="radio" name="setup-colour" value="${value}" aria-label="${name(value)}"><span>${name(value)}</span></label>`).join('')}</div></fieldset>
    ${section('fairy', 'Fairy pieces', segment('setup-sorting', 'First rank sorting', ['Random', 'Player']) + pieceList())}
    ${toggle('classic', 'classic', 'Classic chess', '', true)}
    ${section('cards', 'Cards', segment('setup-card-mode', 'Choose cards', ['Use all cards', 'Pick four']) + '<p id="setup-card-status" class="quiet-line" role="status"></p><p id="setup-card-lock" class="lock-note" hidden>' + icon('lock') + '<span>Keep at least 4 cards checked. Check another card to free a lock.</span></p>' + cardTiles())}
    ${toggle('kingPowers', 'powers', 'King powers', 'Each king brings one power.')}
    <div id="setup-your-king" class="king-pick your-king"><div class="coin-row"><button id="setup-king" class="coin" data-state="always" aria-label="Choose your king"><img alt=""></button></div><div class="grow"><h3>Your king</h3><div id="setup-king-name"></div><p id="setup-power-text" class="power-text"></p></div><span class="chev" aria-hidden="true">›</span></div>
    </details>`;
  $('setup-body').querySelectorAll<HTMLInputElement>('input[name="setup-mode"]').forEach(input => { input.onchange = () => { draft = withMode({ ...draft!, kind: memory.kind = input.value as SetupState['kind'] }, draft!.mode); anyRules = false; render(); }; });
  $('setup-body').querySelectorAll<HTMLInputElement>('input[name="setup-rating"]').forEach(input => { input.onchange = () => { draft = withMode(draft!, input.value as SetupState['mode']); anyRules = false; cardMode = 'all'; render(); }; });
  $<HTMLInputElement>('setup-level').oninput = event => { draft = { ...draft!, level: MENU_LEVELS[+(event.target as HTMLInputElement).value] }; render(); };
  $('setup-body').querySelectorAll<HTMLInputElement>('input[name="setup-colour"]').forEach(input => { input.onchange = () => { draft = { ...draft!, colour: input.value as 'white' | 'black' }; render(); }; });
  for (const key of ['fairy','classic','cards','kingPowers'] as const) $<HTMLInputElement>(`setup-toggle-${key}`).onchange = event => {
    const on = (event.target as HTMLInputElement).checked; draft = withToggle(draft!, key, on);
    if (key === 'fairy' || key === 'cards') sectionOpen[key] = on;
    if (key === 'cards' && on && draft.options.cardPool.length > 4) cardMode = 'all';
    render();
  };
  $<HTMLInputElement>('setup-toggle-anyRules').onchange = event => { anyRules = (event.target as HTMLInputElement).checked; render(); };
  for (const key of ['fairy', 'cards'] as const) $(`${key}-heading`).onclick = () => { if (draft!.options[key]) { sectionOpen[key] = !sectionOpen[key]; render(); } };
  $('setup-sorting').querySelectorAll<HTMLInputElement>('input').forEach(input => { input.onchange = () => { draft = withToggle(draft!, 'arrangement', input.value === 'Player'); render(); }; });
  $('fairy-body').querySelectorAll<HTMLInputElement>('.pick-list input').forEach(input => { input.onchange = () => { draft = withPiece(draft!, input.value, input.checked); render(); }; });
  $('setup-card-mode').querySelectorAll<HTMLInputElement>('input').forEach(input => { input.onchange = () => {
    if (input.value === 'Pick four') { allCardPool = [...draft!.options.cardPool]; cardMode = 'four'; }
    else cardMode = 'all';
    draft = { ...draft!, options: { ...draft!.options, cardPool: cardMode === 'four' ? [] : [...allCardPool] } }; render();
  }; });
  $('setup-card-pool').querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.onclick = () => cardSheet(button.closest<HTMLElement>('[data-card]')!.dataset.card as CardName); });
  $('setup-card-pool').querySelectorAll<HTMLInputElement>('input').forEach(input => { input.onchange = () => changeCard(input.value as CardName, input.checked); });
  $('setup-king').onclick = () => void pickKing();
  $('setup-start').onclick = () => void launch();
  $('play-open').onclick = () => navigate('lobby');
  $('join-form').onsubmit = event => { event.preventDefault(); memory.code = $<HTMLInputElement>('token').value.trim(); navigate('join'); };
}
function render() {
  if (stopped || queue.closed()) return;
  if (!draft) return;
  const setup = client.state.pending?.quick ? quickSetup(memory.settings?.last_setup) : currentSetup(), o = setup.options;
  for (const key of ['mode','colour'] as const) $('setup-body').querySelectorAll<HTMLInputElement>(`input[name="setup-${key}"]`).forEach(input => { input.checked = input.value === (key === 'mode' ? setup.kind : setup[key]); });
  $<HTMLInputElement>('setup-level').value = String(levelPosition(setup.level));
  $('setup-level').setAttribute('aria-valuetext', LEVEL_NAMES[setup.level]);
  $('setup-level-control').hidden = $('level-line').hidden = setup.kind !== 'solo'; $('play-open').hidden = setup.kind !== 'random'; $('play-join').hidden = setup.kind !== 'friend'; $('level-line').textContent = LEVEL_LINES[setup.level];
  const ranked = setup.mode === 'ranked';
  $('setup-rating').hidden = setup.kind !== 'random' || !rankedOffered(); $('setup-rating-line').hidden = setup.kind !== 'random';
  $('setup-body').querySelectorAll<HTMLInputElement>('input[name="setup-rating"]').forEach(input => { input.checked = input.value === setup.mode; });
  $('setup-ranked-rules').hidden = !ranked;
  for (const id of ['setup-colour','setup-game-heading','fairy-row','cards-row','kingPowers-row']) $(id).hidden = ranked;
  $('anyRules-row').hidden = setup.kind !== 'random' || ranked; $<HTMLInputElement>('setup-toggle-anyRules').checked = anyRules;
  for (const key of ['fairy','classic','cards','kingPowers'] as const) $<HTMLInputElement>(`setup-toggle-${key}`).checked = o[key];
  $('classic-row').hidden = ranked || o.fairy;
  $('classic-line').textContent = o.classic ? 'The normal start, castling, en passant.' : 'The chess pieces in a random order.';
  for (const key of ['fairy', 'cards'] as const) {
    const open = !ranked && o[key] && sectionOpen[key];
    $(`${key}-body`).hidden = !open;
    $(`${key}-heading`).setAttribute('aria-expanded', String(open));
    $(`${key}-heading`).setAttribute('aria-disabled', String(!o[key]));
  }
  $('fairy-count').textContent = `${o.pool.length} kinds`;
  $('cards-count').textContent = cardMode === 'four' ? `${o.cardPool.length} of 4` : `${o.cardPool.length} cards`;
  $('setup-sorting').querySelectorAll<HTMLInputElement>('input').forEach(input => { input.checked = input.value === (o.arrangement ? 'Player' : 'Random'); });
  $('fairy-body').querySelector<HTMLElement>('.lock-note')!.hidden = !pieceLetters.some(k => pieceLocked(o, k));
  $('fairy-body').querySelectorAll<HTMLInputElement>('.pick-list input').forEach(input => {
    const locked = pieceLocked(o, input.value), row = input.closest('label')!;
    input.checked = o.pool.includes(input.value); input.disabled = locked;
    row.classList.toggle('locked', locked); row.querySelector<HTMLElement>('.lock')!.hidden = !locked;
  });
  $('setup-card-mode').querySelectorAll<HTMLInputElement>('input').forEach(input => { input.checked = input.value === (cardMode === 'four' ? 'Pick four' : 'Use all cards'); });
  $('setup-card-status').textContent = o.cardPool.length < 4 ? `Pick ${4 - o.cardPool.length} more card${o.cardPool.length === 3 ? '' : 's'}.` : '';
  $('setup-card-status').hidden = o.cardPool.length >= 4;
  $('setup-card-lock').hidden = cardMode !== 'all' || o.cardPool.length > 4;
  $('setup-card-pool').querySelectorAll<HTMLInputElement>('input').forEach(input => {
    input.checked = o.cardPool.includes(input.value as CardName); input.disabled = cardLocked(input.value as CardName);
    input.closest('.setup-card')!.classList.toggle('out', !input.checked);
  });
  $('setup-your-king').hidden = !o.kingPowers;
  const pick = shownKing(setup); $<HTMLImageElement>('setup-king').querySelector('img')!.src = art(`ui/emblems/${pick.king.toLowerCase()}.webp`);
  $('setup-king-name').innerHTML = `<b>${pick.king}</b> · ${POWER_NAME[pick.power]}`;
  $('setup-power-text').textContent = ruleLine(powerText(pick.power, kingRules));
  // The button is disabled and busy at once (F5). Its words are the owner's items W3 b ('Starting…' after 1 s) and W6 a
  // ('Start game' again while the error and Retry show).
  const button = $<HTMLButtonElement>('setup-start'), busy = starting && !client.state.pending?.error;
  // The app's one action update locks every start control (setup-start, hall-play, games-start) while a start waits.
  actions();
  button.setAttribute('aria-busy', String(busy));
  button.textContent = busy && late ? 'Starting…' : 'Start game';
}
function sheet(name: string, title: string, done: () => void) {
  closeSheet?.();
  const frame = $('app-frame'), scrim = document.createElement('div'), dialog = document.createElement('dialog'), page = frame.querySelector<HTMLElement>('.page-sheet')!, focus = document.activeElement as HTMLElement | null;
  scrim.className = 'scrim'; dialog.id = 'menu-sheet'; dialog.className = 'over-sheet setup-sheet'; dialog.setAttribute('aria-labelledby', 'menu-title'); dialog.setAttribute('aria-modal', 'true');
  dialog.innerHTML = `<header class="sheet-head"><h2 id="menu-title">${title}</h2><button id="menu-close" aria-label="Close">×</button></header><div class="sheet-body"></div><footer class="new-game-foot"><p class="foot-count"></p><button id="setup-done" class="primary">Done</button></footer>`;
  page.inert = true; frame.append(scrim, dialog); dialog.show(); client.state.sheet = name; client.save();
  const close = () => { dialog.close(); dialog.remove(); scrim.remove(); page.inert = false; closeSheet = undefined; document.removeEventListener('keydown', key); if (stopped || queue.closed()) { done(); return; } if (client.state.sheet === name) client.state.sheet = undefined; client.save(); done(); focus?.focus(); };
  const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'Tab') { const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')]; const index = controls.indexOf(document.activeElement as HTMLElement); if (event.shiftKey && index <= 0 || !event.shiftKey && index === controls.length - 1) { event.preventDefault(); controls[event.shiftKey ? controls.length - 1 : 0]?.focus(); } } };
  document.addEventListener('keydown', key); $('menu-close').onclick = $('setup-done').onclick = scrim.onclick = close; closeSheet = close;
  $('menu-close').focus(); return dialog;
}
function cardLocked(card: CardName) {
  const pool = draft!.options.cardPool;
  return cardMode === 'four' ? pool.length >= 4 && !pool.includes(card) : pool.length <= 4 && pool.includes(card);
}
function changeCard(card: CardName, on: boolean) {
  if (!cardLocked(card)) draft = withCard(draft!, card, on, cardMode === 'four');
  render();
}
function cardSheet(card: CardName) {
  if (!draft || draft.mode === 'ranked' || !draft.options.cards) return;
  $<HTMLDetailsElement>('setup-options').open = true;
  const tile = () => $(`setup-card-${card}`);
  tile().focus();
  const dialog = sheet(`card:${card}`, cardName(card), () => { if (!stopped && !queue.closed()) { render(); tile().focus({ preventScroll: true }); } });
  const body = dialog.querySelector<HTMLElement>('.sheet-body')!, rules = draft.options.kingPowers ? kingRules : DEFAULT_RULES;
  body.innerHTML = `<div class="card-face"><span class="cf-art">${cardArt(card)}</span><span class="cf-text"><b>${cardName(card)}</b><small>${ruleLine(cardText(card, rules))}</small><span class="cf-cost">${cardCost(card, rules)}</span></span></div><label class="check"><input type="checkbox" aria-label="Use ${cardName(card)}"><span>Use ${cardName(card)}</span></label><p class="lock-note" hidden></p>`;
  const input = body.querySelector<HTMLInputElement>('input')!, note = body.querySelector<HTMLElement>('.lock-note')!;
  const sync = () => {
    input.checked = draft!.options.cardPool.includes(card); input.disabled = cardLocked(card);
    note.hidden = !input.disabled; note.textContent = cardMode === 'four' ? 'Uncheck another card to use this card.' : 'Keep at least 4 cards checked. Check another card to free a lock.';
    dialog.querySelector('.foot-count')!.textContent = cardMode === 'four' ? `${draft!.options.cardPool.length} of 4` : `${draft!.options.cardPool.length} cards`;
  };
  input.onchange = () => { changeCard(card, input.checked); sync(); }; sync();
}
export function kingSheet(options: Options, pick: KingChoice, admission?: SetupAdmission): Promise<KingChoice> {
  if (stopped || queue.closed()) return Promise.resolve(pick);
  const cleaned = cleanKing(options, pick, 'white', admission) ?? shownKing({ colour: 'white', king: null });
  let chosen = cleaned.king === pick.king && cleaned.power === pick.power ? pick : cleaned;
  return new Promise(resolve => {
    const dialog = sheet('king', 'Your king', () => resolve(chosen)), body = dialog.querySelector<HTMLElement>('.sheet-body')!, count = dialog.querySelector('.foot-count')!;
    const kingNames = [...new Set([...(Object.keys(KINGS) as KingName[]), ...(admission?.kings.map(p => p.king) ?? [])])];
    const groups = admission ? kingNames.map(king => {
      const powers = [...new Set([...(KINGS[king] ?? []), ...admission.kings.filter(p => p.king === king).map(p => p.power)])];
      return { king, options: powers.map(power => ({ value: `${king}:${power}`, label: powerTitle(power, kingRules), title: powerText(power, kingRules) })) };
    }) : powerOptions(kingRules);
    const draw = () => {
      const powers = groups.find(group => group.king === chosen.king)!.options, allowed = availablePowers(options, chosen.king, admission);
      body.innerHTML = `${options.cards ? `<p class="lock-note">${icon('cards')}<span>Cards are on, so only the powers that are always on can play.</span></p>` : ''}<div id="king-picker"><div class="king-pick"><h3>King · <span class="who">${chosen.king}</span></h3><div class="emblems" role="group" aria-label="King">${kingNames.map(king => { const out = !availablePowers(options, king, admission).length; return `<button class="emblem${out ? ' is-out' : ''}" data-king="${king}" aria-pressed="${king === chosen.king}" aria-disabled="${out}" ${out ? 'disabled' : ''} title="${king} king: ${groups.find(group => group.king === king)!.options.map(p => POWER_NAME[p.value.split(':')[1] as PowerName]).join(' or ')}">${image(`ui/emblems/${king.toLowerCase()}.webp`)}<span class="em-name">${king}</span></button>`; }).join('')}</div><div class="power-choice two">${powers.map(power => { const p = power.value.split(':')[1] as PowerName, out = !allowed.includes(p); return `<button data-power="${p}" title="${ruleLine(power.title)}" aria-pressed="${chosen.power === p}" aria-disabled="${out}" ${out ? 'disabled' : ''}>${power.label}</button>`; }).join('')}</div><p class="power-text"><b>${POWER_NAME[chosen.power]}:</b> ${ruleLine(powerText(chosen.power, kingRules))}${options.cards ? ' Always on.' : ''}</p>${powers.filter(power => !allowed.includes(power.value.split(':')[1] as PowerName)).map(power => `<p class="power-text off"><b>${POWER_NAME[power.value.split(':')[1] as PowerName]}</b> ${options.cards && !ALWAYS_ON.includes(power.value.split(':')[1] as PowerName) ? 'has uses, so it cannot play with cards.' : 'is not available in this game.'}</p>`).join('')}</div></div>`;
      count.textContent = `${chosen.king} · ${POWER_NAME[chosen.power]}`;
      body.querySelectorAll<HTMLButtonElement>('[data-king]').forEach(button => { button.onclick = () => { const king = button.dataset.king as KingName, [power] = availablePowers(options, king, admission); if (power) { const changed = king !== chosen.king; chosen = { king, power }; draw(); const pick = body.querySelector<HTMLButtonElement>(`[data-king="${king}"]`); pick?.focus(); if (changed) pick?.classList.add('is-flip'); } }; });
      body.querySelectorAll<HTMLButtonElement>('[data-power]').forEach(button => { button.onclick = () => { const power = button.dataset.power as PowerName; if (allowed.includes(power)) { chosen = { king: chosen.king, power }; draw(); body.querySelector<HTMLButtonElement>(`[data-power="${power}"]`)?.focus(); } }; });
    }; draw();
  });
}
async function pickKing() {
  const shown = shownKing(draft!), picked = await kingSheet(setupOptions(draft!.options), shown);
  if (stopped || queue.closed()) return;
  if (draft!.king || picked !== shown) draft!.king = picked;
  render();
}
/** The later steps keep the start's scope, so their error and Retry stay on Play after the player leaves. */
async function finish(view: View, pick: KingChoice | null, origin: Job, scope: Pick<JobOptions, 'screen' | 'quick'>) {
  const choice = soloChoice(view, pick);
  if (choice) { const next = await call('kingdown_choose', { ...choice, command_id: crypto.randomUUID().replaceAll('-', '') }, { retain: true, route: false, origin, king: pick, ...scope }); if (!next) return; view = next; }
  if (view.status === 'playing' && !view.rules) { const full = await call('kingdown_get', {}, { retain: true, route: false, origin, king: pick, ...scope }); if (!full) return; view = full; }
  routeView(view);
}
async function launch(setup = draft, saveSetup = true) {
  if (!setup || setupBusy()) return;
  if (validate(setupOptions(setup.options)) || setup === draft && setup.options.cards && cardMode === 'four' && setup.options.cardPool.length !== 4) {
    sectionOpen.cards = true; $<HTMLDetailsElement>('setup-options').open = true; render();
    $('setup-card-status').scrollIntoView({ block: 'nearest' }); return;
  }
  const origin = queue.command('write', 'kingdown_create', {}), scope = { screen: 'play', quick: !saveSetup } as const;
  starting = true; render();
  // A quick start shows no words; after 1 s the button says 'Starting…'. After 5 s, Back is a safe way out: the start stays
  // pending, and Start sends no second Create. The 10 s command limit (client.ts) ends the call with Retry.
  const exits = document.querySelectorAll<HTMLButtonElement>('#page-back, [data-screen="play"] [data-nav]');
  const words = setTimeout(() => { if (!queue.current(origin)) return; late = true; render(); }, 1_000);
  let left = false; const leave = () => { left = true; };
  exits.forEach(button => button.addEventListener('click', leave));
  const wait = setTimeout(() => { if (!queue.current(origin)) return; exits.forEach(button => { button.dataset.free = ''; button.disabled = false; }); }, 5_000);
  const cleanup = () => { exits.forEach(button => button.removeEventListener('click', leave)); clearTimeout(words); clearTimeout(wait); };
  const unstop = onStop(cleanup);
  try {
    const last_setup = { ...setup, options: setupOptions(setup.options) };
    if (saveSetup) {
      const saved = await client.call('kingdown_settings', { last_setup });
      if (!queue.current(origin)) return;
      if (saved.isError) throw new Error(saved.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      memory.settings = saved._meta?.settings as typeof memory.settings;
    }
    if (left) return;
    const args = { ...createArguments(last_setup), ...(last_setup.kind === 'random' && last_setup.mode === 'casual' && anyRules && { any_rules: true }) };
    await start(last_setup.kind, args, { route: false, origin, king: last_setup.king, ...scope, then: (view, origin) => finish(view, last_setup.king, origin, scope) });
  } catch (error) { if (queue.current(origin) && !left) store.dispatch({ type: 'error', text: errorText(error) }); }
  finally { cleanup(); unstop(); starting = late = false; if (!queue.closed()) { exits.forEach(button => { delete button.dataset.free; }); render(); } }
}
/** The continuation of a resent start or setup step (design §5.2): it finishes the start. */
export const finishStart = (view: View, origin: Job, king: KingChoice | null, scope: Pick<JobOptions, 'screen' | 'quick'>) => finish(view, king, origin, scope);
/** Play now starts a computer game and keeps the saved setup. */
export function playNow() { if (memory.settings) void launch(quickSetup(memory.settings.last_setup), false); }
// The store's subscriber replaces the data-page and #retry observers.
export function setupSync(page: Page) {
  if (stopped || queue.closed()) return;
  if (page.screen !== 'play' && !(page.screen === 'seat' && client.state.sheet === 'king')) {
    if (closeSheet) closeSheet();
    else if (['pieces','cards','king'].includes(client.state.sheet ?? '') || client.state.sheet?.startsWith('card:')) { client.state.sheet = undefined; client.save(); }
  }
  if (page.screen === 'play' && $('setup-body').childElementCount) render();

}
/** An exact four-card saved pool opens as Pick four. */
function readDraft() {
  draft = currentSetup(); draft.level = menuLevel(draft.level); cardMode = draft.options.cardPool.length === 4 ? 'four' : 'all'; allCardPool = cardMode === 'all' ? [...draft.options.cardPool] : [...DEAL_CARDS];
  return draft;
}
/** End New game opens the hall with the setup of the game that ended (the same card rule as a saved setup). */
export function draftFromGame(view: View) {
  draft = gameSetup(view); draft.level = menuLevel(draft.level); cardMode = draft.options.cardPool.length === 4 ? 'four' : 'all'; allCardPool = cardMode === 'all' ? [...draft.options.cardPool] : [...DEAL_CARDS]; memory.kind = draft.kind;
}
/** A retained Find owns its mode and rules even when a lobby remount does not open Play. */
export function currentSetup(): SetupState {
  const setup = draft ?? readSetup(memory.settings?.last_setup), pending = client.state.pending;
  return pending?.name === 'kingdown_find' ? readSetup({ ...setup, kind: 'random', mode: pending.args.mode === 'ranked' ? 'ranked' : 'casual', options: pending.args.options ?? setup.options, colour: pending.args.colour ?? setup.colour, king: pending.king === undefined ? setup.king : pending.king }) : setup;
}
export function setupScreen() {
  if (stopped || queue.closed()) return;
  if (!memory.settings) return;
  if (!draft) {
    draft = readDraft();
    if (!client.state.pending?.quick) draft.kind = client.state.pending?.name === 'kingdown_find' ? 'random' : client.state.pending?.args.kind as SetupState['kind'] ?? draft.kind;
    draft = withMode(draft, draft.mode);
    anyRules = client.state.pending?.name === 'kingdown_find' && client.state.pending.args.any_rules === true;
    memory.kind = draft.kind;
  } else draft = withMode({ ...draft, kind: memory.kind }, draft.mode);
  if (!$('setup-body').childElementCount) build();
  render();
  if (!closeSheet) {
    if (client.state.sheet === 'pieces' || client.state.sheet === 'cards') { client.state.sheet = undefined; client.save(); }
    else if (client.state.sheet?.startsWith('card:')) {
      const card = client.state.sheet.slice(5) as CardName;
      if (DEAL_CARDS.includes(card) && draft.mode !== 'ranked') { draft = withToggle(draft, 'cards', true); sectionOpen.cards = true; render(); cardSheet(card); }
      else { client.state.sheet = undefined; client.save(); }
    }
    else if (client.state.sheet === 'king') void pickKing();
  }
}

onStop(() => { stopped = true; closeSheet?.(); draft = undefined; });
