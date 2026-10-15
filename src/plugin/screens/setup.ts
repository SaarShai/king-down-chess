import { call, client, memory, navigate, routeView, start } from '../app';
import { art } from '../art';
import type { WidgetHost } from '../client';
import { DEAL_CARDS, POOL_KINDS, type Options } from '../../match/setup';
import { LETTERS, NAMES } from '../../rules/engine';
import { DEFAULT_RULES, POWERS_BALANCED, KINGS, type KingChoice, type KingName, type CardName, type PowerName } from '../../rules/rules';
import { POWER_NAME, cardText, powerText, powerOptions, powersRules } from '../../powers-ui';
import type { View, InboxEntry } from '../../match/protocol';
import { availablePowers, cardLocked, cleanKing, createArguments, pieceLocked, quickSetup, readSetup, setupOptions, shownKing, soloChoice, withCard, withPiece, withToggle, type SetupState } from './setup-model';
import './setup.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
const icon = (name: string) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const image = (path: string, cls = '') => `<img class="${cls}" src="${art(path)}" alt="">`;
const name = (word: string) => word[0].toUpperCase() + word.slice(1);
const webWords = (words: string) => words.replace(/captured/g, 'taken').replace(/captures/g, 'takes').replace(/capture/g, 'take');
const cardName = (card: CardName) => POWER_NAME[card as PowerName] ?? card.replace(/([A-Z])/g, ' $1').trim();
const levelLines = { beginner: 'New to King Down? Start here.', casual: 'Makes some mistakes.', club: 'Plays well. Keep your pieces safe.', strong: 'Thinks longer. Plays stronger.' };
const pieceLines = { A: 'Shoots without moving.', L: 'Jumps over its own pieces.', G: 'Only a king takes it.', M: 'Swaps with a friend.', S: 'Bites in a chain.', O: 'Shoves a neighbour.', R: 'Moves in straight lines.', B: 'Moves on diagonals.', N: 'Jumps in an L.', Q: 'Moves in any line.' };
const kingRules = powersRules({ ...DEFAULT_RULES, ...POWERS_BALANCED });
const faces: readonly CardName[] = ['Freeze','IceWall','Sacrifice','March','Leap','Salvation','Mimic','Vault','SkyLift'];
const mounted = (window as Window & { openai?: WidgetHost }).openai?.widgetState?.privateContent;
const restored = mounted?.pending;
let draft: SetupState | undefined, starting = false, recovering = false, ownCommand = false, restoreHandled = false, closeSheet: (() => void) | undefined;
const restoredSetup = () => !restoreHandled && restored?.screen === 'play' && !!memory.settings?.last_setup && (restored.name === 'kingdown_choose' || !!restored.args.options);
const ownPending = () => ownCommand || restoredSetup();
async function readGames() {
  const result = await client.call('kingdown_games', {}, { background: true });
  if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
  memory.games = result._meta?.games as InboxEntry[] ?? [];
}

function segment(id: string, title: string, values: readonly string[]) {
  return `<fieldset id="${id}" class="seg"><legend>${title}</legend><div class="seg-row">${values.map(value => `<label><input type="radio" name="${id}" value="${value}" aria-label="${name(value)}"><span>${name(value)}</span></label>`).join('')}</div></fieldset>`;
}
function toggle(key: string, symbol: string, title: string, line: string, sheet = '', sub = false) {
  return `<label id="${key}-row" class="check toggle${sub ? ' sub' : ''}"><input id="setup-toggle-${key}" type="checkbox" aria-label="${title}"><span class="t-ico">${icon(symbol)}</span><span class="grow">${title}<small id="${key}-line">${line}</small></span>${sheet ? `<button type="button" id="setup-${sheet}" class="all" aria-label="Choose ${sheet}"></button>` : ''}</label>`;
}
function build() {
  $('setup-body').innerHTML = `<fieldset class="modes"><legend class="sr-only">Who you play</legend>${(['solo','friend','random'] as const).map(kind => `<label class="mode"><input type="radio" name="setup-mode" value="${kind}" aria-label="${{ solo: 'Computer', friend: 'A friend', random: 'A random player' }[kind]}"><span class="mode-art${kind === 'random' ? ' emblem-fan' : ''}">${kind === 'random' ? ['frost','flame','stratus'].map(k => image(`ui/emblems/${k}.webp`)).join('') : image('ui/kings/spirit.webp') + (kind === 'friend' ? image('ui/kings/shadow-b.webp', 'face-left') : '')}</span><span class="mode-text"><b>${{ solo: 'Computer', friend: 'A friend', random: 'A random player' }[kind]}</b></span></label>`).join('')}</fieldset>
    <button id="play-open" class="menu-row has-lead"><span class="row-art fan">${['frost','flame','stratus'].map(k => image(`ui/emblems/${k}.webp`)).join('')}</span><span class="row-title">Open games</span><span class="line">Join a game that another player opened.</span><i aria-hidden="true">›</i></button>
    <div id="play-join"><h3 class="group-head">Join with a code</h3><form id="join-form" class="code-row"><input id="token" class="field" aria-label="Game code" placeholder="K7QX2M" autocapitalize="characters" autocomplete="off" spellcheck="false" enterkeyhint="go" required maxlength="300"><button id="join" type="submit">Join</button></form></div>
    ${segment('setup-level', 'Computer level', ['beginner','casual','club','strong'])}<p id="level-line" class="seg-line"></p>
    ${segment('setup-colour', 'You play', ['white','black','random'])}<h3 class="group-head">The game</h3>
    ${toggle('fairy', 'fairy', 'Fairy pieces', '', 'pieces')}
    ${toggle('arrangement', 'arrange', 'Arrangement', 'Each player orders their own back rank.', '', true)}
    ${toggle('classic', 'classic', 'Classic chess', '', '', true)}
    ${toggle('cards', 'cards', 'Cards', 'Both players get the same 4 cards.', 'cards')}
    ${toggle('kingPowers', 'powers', 'King powers', 'Each king brings one power.')}
    <div id="setup-your-king" class="king-pick your-king"><div class="coin-row"><button id="setup-king" class="coin" data-state="always" aria-label="Choose your king"><img alt=""></button></div><div class="grow"><h3>Your king</h3><div id="setup-king-name"></div><p id="setup-power-text" class="power-text"></p></div><span class="chev" aria-hidden="true">›</span></div>
    <div id="setup-kings-off" class="kings-off">${image('ui/kings/spirit.webp')}${image('ui/kings/shadow-b.webp', 'face-left')}<p>King powers are off. White plays the Spirit King, Black the Shadow King.</p></div>`;
  $('setup-body').querySelectorAll<HTMLInputElement>('input[name="setup-mode"]').forEach(input => { input.onchange = () => { draft!.kind = memory.kind = input.value as SetupState['kind']; render(); }; });
  for (const key of ['level', 'colour'] as const) $('setup-body').querySelectorAll<HTMLInputElement>(`input[name="setup-${key}"]`).forEach(input => { input.onchange = () => { draft = { ...draft!, [key]: input.value }; render(); }; });
  for (const key of ['fairy','arrangement','classic','cards','kingPowers'] as const) $<HTMLInputElement>(`setup-toggle-${key}`).onchange = event => { draft = withToggle(draft!, key, (event.target as HTMLInputElement).checked); render(); };
  for (const sheet of ['pieces','cards'] as const) $(`setup-${sheet}`).onclick = event => { event.preventDefault(); event.stopPropagation(); poolSheet(sheet); };
  $('setup-king').onclick = () => void pickKing();
  $('setup-start').onclick = () => void launch();
  $('play-open').onclick = () => navigate('lobby');
  $('join-form').onsubmit = event => { event.preventDefault(); memory.code = $<HTMLInputElement>('token').value.trim(); navigate('join'); };
}
function render() {
  if (!draft) return;
  const o = draft.options;
  for (const key of ['mode','level','colour'] as const) $('setup-body').querySelectorAll<HTMLInputElement>(`input[name="setup-${key}"]`).forEach(input => { input.checked = input.value === (key === 'mode' ? draft!.kind : draft![key]); });
  $('setup-level').hidden = $('level-line').hidden = draft.kind !== 'solo'; $('play-open').hidden = draft.kind !== 'random'; $('play-join').hidden = draft.kind !== 'friend'; $('level-line').textContent = levelLines[draft.level];
  for (const key of ['fairy','arrangement','classic','cards','kingPowers'] as const) $<HTMLInputElement>(`setup-toggle-${key}`).checked = o[key];
  $('arrangement-row').hidden = !o.fairy; $('classic-row').hidden = o.fairy; $('setup-pieces').hidden = !o.fairy; $('setup-cards').hidden = !o.cards;
  $('fairy-line').textContent = o.fairy ? 'Draw 7 pieces from the King Down pool.' : 'Only the chess pieces.';
  $('classic-line').textContent = o.classic ? 'The normal start, castling, en passant.' : 'The chess pieces in a random order.';
  $('setup-pieces').textContent = `${o.pool.length} kinds ›`; $('setup-cards').textContent = `${o.cardPool.length} cards ›`;
  $('setup-your-king').hidden = !o.kingPowers; $('setup-kings-off').hidden = o.kingPowers;
  const pick = shownKing(draft); $<HTMLImageElement>('setup-king').querySelector('img')!.src = art(`ui/emblems/${pick.king.toLowerCase()}.webp`);
  $('setup-king-name').innerHTML = `<b>${pick.king}</b> · ${POWER_NAME[pick.power]}`;
  $('setup-power-text').textContent = powerText(pick.power, kingRules, true);
  $<HTMLButtonElement>('setup-start').disabled = starting || recovering || !!client.state.pending;
}
function sheet(name: string, title: string, done: () => void) {
  closeSheet?.();
  const frame = $('app-frame'), scrim = document.createElement('div'), dialog = document.createElement('dialog'), page = frame.querySelector<HTMLElement>('.page-sheet')!, focus = document.activeElement as HTMLElement | null;
  scrim.className = 'scrim'; dialog.id = 'menu-sheet'; dialog.className = 'over-sheet setup-sheet'; dialog.setAttribute('aria-labelledby', 'menu-title'); dialog.setAttribute('aria-modal', 'true');
  dialog.innerHTML = `<header class="sheet-head"><h2 id="menu-title">${title}</h2><button id="menu-close" aria-label="Close">×</button></header><div class="sheet-body"></div><footer class="new-game-foot"><p class="foot-count"></p><button id="setup-done" class="primary">Done</button></footer>`;
  page.inert = true; frame.append(scrim, dialog); dialog.show(); client.state.sheet = name; client.save();
  const close = () => { dialog.close(); dialog.remove(); scrim.remove(); page.inert = false; closeSheet = undefined; if (client.state.sheet === name) client.state.sheet = undefined; client.save(); document.removeEventListener('keydown', key); done(); focus?.focus(); };
  const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'Tab') { const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')]; const index = controls.indexOf(document.activeElement as HTMLElement); if (event.shiftKey && index <= 0 || !event.shiftKey && index === controls.length - 1) { event.preventDefault(); controls[event.shiftKey ? controls.length - 1 : 0]?.focus(); } } };
  document.addEventListener('keydown', key); $('menu-close').onclick = $('setup-done').onclick = scrim.onclick = close; closeSheet = close;
  $('menu-close').focus(); return dialog;
}
function poolSheet(kind: 'pieces' | 'cards') {
  const dialog = sheet(kind, kind === 'pieces' ? 'Fairy pieces' : 'Cards', render), body = dialog.querySelector<HTMLElement>('.sheet-body')!, count = dialog.querySelector('.foot-count')!;
  const draw = () => {
    const scroll = body.scrollTop, focus = (document.activeElement as HTMLInputElement)?.value, o = draft!.options;
    if (kind === 'pieces') {
      const letters = Object.keys(pieceLines).filter(letter => POOL_KINDS.includes(letter)) as (keyof typeof pieceLines)[];
      body.innerHTML = `<p class="sheet-lead">The draw takes 7 pieces from the checked kinds. The king and the pawns are always in.</p><p class="lock-note" ${letters.some(k => pieceLocked(o, k)) ? '' : 'hidden'}>${icon('lock')}<span>Keep at least 7 pieces in the pool. Check another kind to free a lock.</span></p><div class="pick-list">${letters.map(letter => { const n = NAMES[LETTERS.indexOf(letter)], locked = pieceLocked(o, letter); return `<label class="check pick${locked ? ' locked' : ''}"><span class="pick-art">${image(`ui/pieces/${n}-w.webp`)}</span><span class="grow">${image(`ui/icons/${n}.svg`, 'pi')} ${name(n)}<small>${pieceLines[letter]}</small></span>${locked ? `<span class="lock">${icon('lock')}</span>` : ''}<input type="checkbox" value="${letter}" aria-label="${name(n)}" ${o.pool.includes(letter) ? 'checked' : ''} ${locked ? 'disabled' : ''}></label>`; }).join('')}</div>`;
      count.textContent = `${o.pool.length} of ${POOL_KINDS.length} kinds`;
    } else {
      body.innerHTML = `<p class="sheet-lead">The deal takes 4 cards from the checked cards. Both players get the same 4.</p><p class="lock-note" ${o.cardPool.length === 4 ? '' : 'hidden'}>${icon('lock')}<span>4 cards are checked. Check another card to free a lock.</span></p><div class="card-grid">${DEAL_CARDS.map(card => `<label class="card-face${o.cardPool.includes(card) ? '' : ' out'}"><span class="cf-art">${image(`ui/cards/${faces.includes(card) ? card.toLowerCase() : 'back'}.webp`, faces.includes(card) ? '' : 'back')}</span><span class="cf-text"><b>${cardName(card)}</b><small>${webWords(cardText(card, o.kingPowers ? kingRules : DEFAULT_RULES))}</small></span><input type="checkbox" value="${card}" aria-label="${cardName(card)}" ${o.cardPool.includes(card) ? 'checked' : ''} ${cardLocked(o, card) ? 'disabled' : ''}></label>`).join('')}</div>`;
      count.textContent = `${o.cardPool.length} of ${DEAL_CARDS.length} · at least 4`;
    }
    body.querySelectorAll<HTMLInputElement>('input').forEach(input => { input.onchange = () => { draft = kind === 'pieces' ? withPiece(draft!, input.value, input.checked) : withCard(draft!, input.value as CardName, input.checked); render(); draw(); }; });
    body.scrollTop = scroll; body.querySelector<HTMLInputElement>(`input[value="${focus}"]`)?.focus({ preventScroll: true });
  }; draw();
}
export function kingSheet(options: Options, pick: KingChoice): Promise<KingChoice> {
  const cleaned = cleanKing(options, pick) ?? shownKing({ colour: 'white', king: null });
  let chosen = cleaned.king === pick.king && cleaned.power === pick.power ? pick : cleaned;
  return new Promise(resolve => {
    const dialog = sheet('king', 'Your king', () => resolve(chosen)), body = dialog.querySelector<HTMLElement>('.sheet-body')!, count = dialog.querySelector('.foot-count')!, groups = powerOptions(kingRules);
    const draw = () => {
      const powers = groups.find(group => group.king === chosen.king)!.options, allowed = availablePowers(options, chosen.king);
      body.innerHTML = `${options.cards ? `<p class="lock-note">${icon('cards')}<span>Cards are on, so only the powers that are always on can play.</span></p>` : ''}<div id="king-picker"><div class="king-pick"><h3>King · <span class="who">${chosen.king}</span></h3><div class="emblems" role="group" aria-label="King">${(Object.keys(KINGS) as KingName[]).map(king => { const out = !availablePowers(options, king).length; return `<button class="emblem${out ? ' is-out' : ''}" data-king="${king}" aria-pressed="${king === chosen.king}" aria-disabled="${out}" ${out ? 'disabled' : ''} title="${king} king: ${KINGS[king].map(p => POWER_NAME[p]).join(' or ')}">${image(`ui/emblems/${king.toLowerCase()}.webp`)}<span class="em-name">${king}</span></button>`; }).join('')}</div><div class="power-choice two">${powers.map(power => { const p = power.value.split(':')[1] as PowerName, out = !allowed.includes(p); return `<button data-power="${p}" title="${webWords(power.title)}" aria-pressed="${chosen.power === p}" aria-disabled="${out}" ${out ? 'disabled' : ''}>${power.label}</button>`; }).join('')}</div><p class="power-text"><b>${POWER_NAME[chosen.power]}:</b> ${powerText(chosen.power, kingRules, true)}.${options.cards ? ' Always on.' : ''}</p>${powers.filter(power => !allowed.includes(power.value.split(':')[1] as PowerName)).map(power => `<p class="power-text off"><b>${POWER_NAME[power.value.split(':')[1] as PowerName]}</b> has uses, so it cannot play with cards.</p>`).join('')}</div></div>`;
      count.textContent = `${chosen.king} · ${POWER_NAME[chosen.power]}`;
      body.querySelectorAll<HTMLButtonElement>('[data-king]').forEach(button => { button.onclick = () => { const king = button.dataset.king as KingName, [power] = availablePowers(options, king); if (power) { chosen = { king, power }; draw(); body.querySelector<HTMLButtonElement>(`[data-king="${king}"]`)?.focus(); } }; });
      body.querySelectorAll<HTMLButtonElement>('[data-power]').forEach(button => { button.onclick = () => { const power = button.dataset.power as PowerName; if (allowed.includes(power)) { chosen = { king: chosen.king, power }; draw(); body.querySelector<HTMLButtonElement>(`[data-power="${power}"]`)?.focus(); } }; });
    }; draw();
  });
}
async function pickKing() {
  const shown = shownKing(draft!), picked = await kingSheet(setupOptions(draft!.options), shown);
  if (draft!.king || picked !== shown) draft!.king = picked;
  render();
}
async function finish(view: View, pick = draft!.king) {
  const choice = soloChoice(view, pick);
  if (choice) { ownCommand = true; const next = await call('kingdown_choose', { ...choice, command_id: crypto.randomUUID().replaceAll('-', '') }, true, false, false); if (!next) return; view = next; }
  if (view.status === 'playing' && !view.rules) { const full = await call('kingdown_get', {}, true, false, false); if (!full) return; view = full; }
  ownCommand = false; routeView(view);
}
async function launch(setup = draft) {
  if (!setup || starting || client.state.pending) return;
  starting = true; ownCommand = true; render();
  try {
    const last_setup = { ...setup, options: setupOptions(setup.options) }, saved = await client.call('kingdown_settings', { last_setup });
    if (saved.isError) throw new Error(saved.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    memory.settings = saved._meta?.settings as typeof memory.settings;
    const view = await start(last_setup.kind, createArguments(last_setup), { route: false }); if (view) await finish(view, last_setup.king);
  } catch (error) { $('error').textContent = $('home-error').textContent = String(error); }
  finally { starting = false; if (!client.state.pending) ownCommand = false; render(); }
}
/** The home card's Play now: a computer game from the last setup, with no hall. */
export function playNow() { if (memory.settings) void launch(quickSetup(memory.settings.last_setup)); }
async function recoverStart() {
  const pending = client.state.pending;
  if (!draft || !pending || recovering) return;
  const active = starting; recovering = true; ownCommand = true; render();
  try {
    await readGames();
    const view = await call(pending.name, pending.args, true, false, false, true);
    if (!active && view) await finish(view);
  } catch (error) { $('error').textContent = String(error); }
  finally { recovering = false; render(); }
}
new MutationObserver(() => {
  if (client.state.screen !== 'play' && !(client.state.screen === 'seat' && client.state.sheet === 'king')) {
    if (closeSheet) closeSheet();
    else if (['pieces','cards','king'].includes(client.state.sheet ?? '')) { client.state.sheet = undefined; client.save(); }
  }
  if (!restoredSetup() || client.state.pending || !memory.view) return;
  if (['board','friend','wait'].includes(client.state.screen)) { restoreHandled = true; return; }
  if (client.state.screen !== 'seat' || memory.view.kind !== 'solo' || memory.view.status !== 'setup') return;
  restoreHandled = true; ownCommand = true; draft ??= readSetup(memory.settings!.last_setup);
  setTimeout(() => { void readGames().then(() => finish(memory.view!)).catch(error => { $('error').textContent = String(error); }); }, 0);
}).observe(document.body, { attributes: true, attributeFilter: ['data-page'] });
document.addEventListener('click', event => {
  if (!(event.target as HTMLElement).closest('#retry') || client.state.screen !== 'play' || !ownPending()) return;
  const pending = client.state.pending;
  if (['kingdown_create','kingdown_find'].includes(pending?.name ?? '')) { event.preventDefault(); event.stopImmediatePropagation(); void recoverStart(); }
  else if (['kingdown_choose','kingdown_get'].includes(pending?.name ?? '')) { event.preventDefault(); event.stopImmediatePropagation(); void call(pending!.name, pending!.args, true, false, false, true).then(async view => { if (view) await finish(view); render(); }); }
}, true);
export function setupScreen() {
  if (!memory.settings) return;
  if (!draft) {
    draft = readSetup(memory.settings.last_setup);
    draft.kind = client.state.pending?.name === 'kingdown_find' ? 'random' : client.state.pending?.args.kind as SetupState['kind'] ?? draft.kind;
    memory.kind = draft.kind;
  } else draft.kind = memory.kind;
  if (!$('setup-body').childElementCount) build();
  render();
  if (client.state.sheet === 'pieces' || client.state.sheet === 'cards') poolSheet(client.state.sheet);
  else if (client.state.sheet === 'king') void pickKing();
  if (!starting && !recovering && restoredSetup() && !client.state.pending?.error && ['kingdown_create','kingdown_find'].includes(client.state.pending?.name ?? '')) void recoverStart();
}
