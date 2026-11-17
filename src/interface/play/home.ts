/**
 * Play, the games screen (launch decision 25), its piece card, and the New game panel (decision 26). The data and the
 * actions come from main.ts; this file draws them. One New game panel serves Computer and Player.
 */
import { button, choiceGroup, closeX, icon, setButtonState } from '../ui/kit.js';
import { KINGS, LETTERS, type KingName, type Color, type PieceType, type Rules } from '../../rules/engine';
import type { DraftTurn } from './turn';
import { panelText, pieces, text } from './texts';
import { sideText, sideLine, type SideChoice } from './sides';
import { miniBoard, savedPreview, stateText } from './mini-board';
import { cardLocked, selectCard, selectPiece, onlinePanelOptions, DOUBLE_KINDS, changeDraft, restorePanel, kingChoices, LEVELS, poolLetters, poolLocked, shownKing, type GameOptions, type NewGameDraft, type PanelMemory } from './new-game';
import { hasCards, hasPowers, typeName, typeOfFlags, type GameType, type Level } from './saved';
import { DEAL_CARDS, POOL_KINDS } from '../../match/setup';
import { RELEASED_CARDS } from '../../content/cards';
import { cardText, powerText, ruleLine, POWER_NAME } from '../../powers-ui';
import { nameSearch, sendPersonLink, type PersonHost } from '../people/screens/person';
import { nameSheet, signInSheet } from '../people/screens/sign-in';
import type { PeopleSheet } from '../people/screens/sheet';
import { ObsoleteAction } from '../people/server';
import { ms } from './motion';
import { computerPortrait, profilePortrait } from '../people/host/portrait';
import { deadlineLine, gameOrder, type HomeInvite, type PersonGame } from '../people/host/games';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content = '') => {
  const node = document.createElement(tag); node.className = className; node.textContent = content; return node;
};
export const homeText = {
  yourGame: 'Your game', turn: 'Turn',
  startGame: 'Start game', side: 'Your pieces',
  // Launch decision 46: the levels stay; each line is true (runs/launch/opponent/report.md).
  levels: { casual: 'The easiest level. A good level for a first game.', clever: 'Much stronger than Friendly. It makes some mistakes.', club: 'The strongest level. Much stronger than Focused.' } as Record<Level, string>,
} as const;
export { typeName };
export const cardSummary = (pool: readonly string[]) => panelText.cardLine(RELEASED_CARDS.filter(card => pool.includes(card.id)).map(card => card.name));
export const levelName = (level: Level) => `${text[level]} ${text.computer.toLowerCase()}`;
/** The setup line on Play: level, game type and side choice. */
export const summaryLine = (c: { level: Level; setup: GameType; sideChoice: SideChoice }) => `${text[c.level]} · ${typeName[c.setup]} · ${sideText[c.sideChoice === 'dark' ? 'dark' : 'light']}`;

export interface Art {
  /** The rest still of a piece type of one side; the king follows the rules of its game. */
  figure(type: number, side: Color, rules: Pick<Rules, 'kings'>): HTMLImageElement;
  /** The symbol picture of a piece code, in its army colours. */
  symbol(code: number): string;
  card(k: number): HTMLImageElement;
}
export interface PlayData {
  gamesList?: { expanded: boolean };
  resume: { draft: DraftTurn; level: Level; player: Color } | null;
  next: NewGameDraft;
  status: string;
  people: PersonGame[];
  invites?: HomeInvite[];
  onPersonGame(id: string): void;
  onAcceptInvite?(id: string): void;
  onDeclineInvite?(id: string): void;
  onInvitePlayer?(id: string, source: HTMLElement): void;
  onDismissInvite?(id: string): void;
  offer(fallback: HTMLButtonElement): HTMLElement | null;
  onContinue(source: HTMLButtonElement): void;
  onChange(source: HTMLButtonElement): void;
  onRule(type: PieceType): void;
}
/** The closed list shows three rows and a half-row cue. */
export const gamesListView = (count: number, expanded: boolean) => ({ collapsed: count > 3 && !expanded, shown: count > 3 && !expanded ? 4 : count });

/** The approved home: a hero with no game, else one list of games. */
export function playScreen(d: PlayData, art: Art): { element: HTMLElement; focus(): void } {
  const home = el('section', 'play-home');
  const title = el('h1', '', text.title); title.tabIndex = -1;
  const start = el('div', 'home-start'), more = el('div', 'home-more');
  const rows: { mine: boolean; deadline: string | null; state: PersonGame['state']; row: HTMLElement }[] = [];
  if (d.resume) {
    const { draft, level, player } = d.resume, preview = savedPreview(draft, player);
    const row = el('button', 'home-game-row'); row.type = 'button'; row.dataset.kind = 'computer';
    const face = el('img', 'profile-portrait'); face.src = computerPortrait(level); face.alt = ''; face.width = face.height = 44;
    const copy = el('span', 'home-game-copy'); copy.append(el('strong', '', levelName(level)), el('span', '', stateText[preview.state]));
    row.append(miniBoard(preview, art.symbol), face, copy, icon('next')); row.addEventListener('click', () => d.onContinue(row));
    rows.push({ mine: preview.state !== 'computer', deadline: null, state: 'playing', row });
  }
  for (const game of d.people) {
    const row = el('button', 'home-game-row'); row.type = 'button'; row.dataset.game = game.id;
    const copy = el('span', 'home-game-copy'), left = game.state === 'playing' ? deadlineLine(game.deadline) : '';
    copy.append(el('strong', '', game.name), el('span', '', [game.status, left].filter(Boolean).join(' · ')));
    const board = game.preview ? miniBoard(game.preview, art.symbol) : el('span', 'mini-board empty-board'); board.setAttribute('aria-hidden', 'true');
    row.append(board, profilePortrait(game.name, game.avatar), copy, icon('next')); row.addEventListener('click', () => d.onPersonGame(game.id));
    rows.push({ ...game, row });
  }
  for (const invite of d.invites ?? []) {
    const row = el('div', 'home-game-row home-invite-row'); row.dataset.invite = invite.id; row.dataset.inviteKind = invite.kind;
    const copy = el('span', 'home-game-copy'); copy.append(el('strong', '', invite.name), el('span', '', invite.line));
    const board = el('span', 'mini-board empty-board'); board.setAttribute('aria-hidden', 'true');
    const actions = el('div', 'home-invite-actions');
    if (invite.kind === 'incoming') actions.append(
      button('Accept', { kind: 'main', onPress: () => d.onAcceptInvite?.(invite.id) }),
      button('Decline', { onPress: () => d.onDeclineInvite?.(invite.id) }),
    );
    else actions.append(button('Dismiss', { onPress: () => d.onDismissInvite?.(invite.id) }));
    if (invite.kind === 'incoming' && d.onInvitePlayer) {
      const player: HTMLButtonElement = button('Player options', { onPress: () => d.onInvitePlayer!(invite.id, player) }); actions.append(player);
    }
    row.append(board, profilePortrait(invite.name, invite.avatar), copy, actions);
    rows.push({ mine: invite.kind === 'incoming', deadline: null, state: invite.kind === 'incoming' ? 'setup' : 'finished', row });
  }
  rows.sort(gameOrder); home.dataset.state = rows.length ? 'saved' : 'new'; home.append(title);
  let main: HTMLButtonElement;
  if (rows.length) {
    const top = button(text.newGame, { onPress: () => d.onChange(top) }); top.classList.add('home-top-new'); home.append(top);
    start.append(el('h2', '', text.yourGames));
    const state = d.gamesList ?? { expanded: false }, list = el('ul', 'home-game-list');
    list.id = 'your-games';
    const draw = () => {
      const { collapsed, shown } = gamesListView(rows.length, state.expanded); list.dataset.collapsed = String(collapsed);
      list.replaceChildren(...rows.map(({ row }, i) => { const li = el('li'); li.hidden = i >= shown; li.inert = collapsed && i >= 3; li.append(row); return li; }));
    };
    draw(); start.append(list);
    if (rows.length > 3 && !state.expanded) {
      const all = button(text.showAllGames, { icon: 'down', onPress: () => {
        state.expanded = true; draw(); all.remove(); rows[3].row.focus({ preventScroll: true });
      } });
      all.classList.add('all-games'); all.setAttribute('aria-controls', list.id); all.setAttribute('aria-expanded', 'false'); start.append(all);
    }
    main = button(text.newGame, { onPress: () => d.onChange(main) }); main.classList.add('home-side-new'); more.append(main);
  } else {
    main = button(text.newGame, { kind: 'main', onPress: () => d.onChange(main) }); main.classList.add('home-hero-new');
    const hero = el('div', 'home-hero'), picture = el('picture'), source = el('source'), img = el('img');
    source.media = '(max-width: 599px)'; source.srcset = [400, 600, 800, 1122].map(w => `/interface/home-hero-portrait-${w}.webp ${w}w`).join(', '); source.sizes = 'calc(100vw - 40px)';
    img.src = '/interface/home-hero-wide-640.webp'; img.srcset = [640, 960, 1280, 1672].map(w => `/interface/home-hero-wide-${w}.webp ${w}w`).join(', '); img.sizes = '(min-width: 1120px) 1056px, calc(100vw - 40px)';
    img.width = 1672; img.height = 941; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.fetchPriority = 'low';
    picture.append(source, img); hero.append(picture, main); home.append(hero, el('p', 'home-intro', text.intro));
    const summary = el('div', 'home-summary'); summary.append(el('p', '', summaryLine(d.next))); start.append(summary);
  }
  start.append(...(d.status ? [el('p', 'home-note', d.status)] : []), ...[d.offer(main)].filter((node): node is HTMLElement => !!node));
  const columns = el('div', 'home-columns'); columns.append(start, more); home.append(columns);
  return { element: home, focus() {
    title.focus({ preventScroll: true });
  } };
}

export interface PanelData {
  next: NewGameDraft;
  memory?: PanelMemory | null;
  people(): Promise<PersonHost>;
  remember(value: PanelMemory | null): void;
  onStart(draft: NewGameDraft): Promise<void>;
  onInvite(draft: NewGameDraft): void;
  onClose(): void;
}
/** One body-mounted modal. Its draft survives home refresh and sign-in. */
export function newGamePanel(d: PanelData, art: Art): { element: HTMLDialogElement; open(source: HTMLElement): void; close(): void } {
  const dialog = el('dialog', 'kd-dialog new-game-panel'), heading = el('h2', '', text.newGame); heading.id = 'new-game-title';
  dialog.setAttribute('aria-labelledby', heading.id);
  const saved = d.memory;
  let draft = saved ? restorePanel(saved) : d.next, opponent = saved?.opponent ?? 'computer', section = saved?.section ?? null;
  let cardError = '';
  let opener: HTMLElement | null = null, starting = false, busy = false, actionId = 0;
  const head = el('div', 'panel-head'), body = el('div', 'panel-body'), foot = el('div', 'panel-foot');
  const back = button(panelText.back, { icon: 'back' }); back.hidden = true;
  head.append(back, heading, closeX(text.close, () => close()));
  const status = el('p', 'panel-status'); status.setAttribute('role', 'status');
  const start: HTMLButtonElement = button(homeText.startGame, { kind: 'main', onPress: () => { if (opponent === 'computer') void begin(); else void person('link'); } });
  const byName = button(panelText.byName, { onPress: () => void person('name') }); byName.classList.add('text-button');
  foot.append(status, byName, start);
  const memory = (): PanelMemory => ({ setup: draft.setup, level: draft.level, sideChoice: draft.sideChoice, options: draft.options, opponent, section, deal: { back: draft.back, player: draft.player, rules: draft.rules } });
  const edit = (change: Parameters<typeof changeDraft>[1]) => { draft = changeDraft(draft, change); };
  const options = (change: Partial<GameOptions>) => edit({ options: { ...draft.options, ...change } });
  const key = (node: HTMLElement, name: string) => { node.dataset.focus = name; return node; };
  const check = (name: string, checked: boolean, change: (checked: boolean) => void, locked = false) => {
    const label = el('label', 'panel-check'), input = el('input'); input.type = 'checkbox'; input.checked = checked; input.disabled = locked; input.setAttribute('aria-label', name); key(input, name);
    label.append(input); input.addEventListener('change', () => { change(input.checked); draw(); }); return label;
  };
  function slider(name: string, stops: readonly string[], selected: () => number, change: (at: number) => void, description: () => string, side = false) {
    const box = el('section', `level-control${side ? ' side-control' : ''}`);
    const track = el('div', 'level-track'), input = el('input', 'level-range'), labels = el('div', 'level-labels'), line = el('p', 'level-line');
    input.type = 'range'; input.min = '0'; input.max = String(stops.length - 1); input.step = '1'; input.setAttribute('aria-label', name); key(input, side ? 'side' : 'level');
    const sync = () => { const at = selected(); input.value = String(at); input.setAttribute('aria-valuetext', stops[at]); box.dataset.level = String(at); line.textContent = description(); labels.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(at === i))); };
    const set = (at: number) => { change(at); sync(); };
    input.addEventListener('input', () => set(+input.value));
    input.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); set(event.key === 'Home' ? 0 : event.key === 'End' ? stops.length - 1 : Math.max(0, Math.min(stops.length - 1, selected() + (['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : -1))));
    });
    labels.append(...stops.map((label, i) => { const b = button(label, { onPress: () => set(i) }); b.dataset.stop = String(i); return b; }));
    track.append(el('span', 'level-flow'), input); box.append(track, labels, line); sync(); return box;
  }
  function piecesSection() {
    const box = el('div', 'panel-section'), list = el('div', 'pool-list');
    const lock = el('p', 'panel-note', panelText.poolLock); lock.id = 'pool-lock';
    for (const letter of POOL_KINDS) for (const copy of (DOUBLE_KINDS.includes(letter) ? [1, 2] : [1]) as (1 | 2)[]) {
      const type = LETTERS.indexOf(letter) as PieceType, name = pieces[type].name + (DOUBLE_KINDS.includes(letter) ? copy === 1 ? ' x1' : ' 2nd' : ''), row = el('div', 'pool-row'), locked = poolLocked(draft.options.pool, letter, draft.options.seconds, copy);
      row.dataset.letter = letter;
      const figure = art.figure(type, opponent === 'person' ? 0 : draft.player, draft.game.rules); figure.alt = '';
      const label = el('span', '', name);
      const toggle = check(panelText.use(name), (copy === 1 ? draft.options.pool : draft.options.seconds ?? DOUBLE_KINDS).includes(letter), on => edit({ options: selectPiece(draft.options, letter, copy, on) }), locked);
      if (locked) { toggle.querySelector('input')!.setAttribute('aria-describedby', lock.id); row.dataset.locked = 'true'; }
      row.append(figure, label, toggle); list.append(row);
    }
    lock.hidden = !list.querySelector('[data-locked]');
    const arrangement = choiceGroup(panelText.arrangement, [{ value: 'random', label: panelText.random }, { value: 'manual', label: panelText.manual }], draft.options.arrangement);
    arrangement.addEventListener('kd-change', event => { options({ arrangement: (event as CustomEvent).detail.value }); draw(); });
    box.append(list, lock, arrangement, el('p', 'panel-note', panelText.manualLine)); return box;
  }
  function powersSection() {
    const box = el('div', 'panel-section'), grid = el('div', 'king-grid'), chosen = shownKing(draft.setup, draft.options.king), legal = kingChoices(hasCards(draft.setup) ? 'both' : 'powers');
    grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', panelText.yourKing);
    for (const king of Object.keys(KINGS) as KingName[]) {
      const available = legal.filter(k => k.king === king), b = button(king, { disabledReason: available.length ? '' : panelText.unavailable, onPress: () => { options({ king: available[0] }); draw(); } });
      b.classList.add('king-choice'); b.setAttribute('aria-pressed', String(chosen.king === king)); key(b, king); b.dataset.king = king;
      const img = el('img'); img.src = `/ui/emblems/${king.toLowerCase()}.webp`; img.alt = ''; b.prepend(img); grid.append(b);
    }
    const powers = choiceGroup(panelText.power, legal.filter(k => k.king === chosen.king).map(k => ({ value: k.power, label: POWER_NAME[k.power] })), chosen.power);
    powers.addEventListener('kd-change', event => { options({ king: { king: chosen.king, power: (event as CustomEvent).detail.value } }); draw(); });
    box.append(grid, powers, el('p', 'panel-note', ruleLine(powerText(chosen.power, draft.game.rules))));
    return box;
  }
  function cardsSection() {
    const box = el('div', 'panel-section'), line = el('p', 'panel-note card-count', cardSummary(draft.options.cardPool)); line.setAttribute('role', 'status');
    box.append(line);
    const grid = el('div', 'panel-card-grid');
    for (const [i, card] of RELEASED_CARDS.entries()) {
      const tile = el('div', 'panel-card'), face = el('button', 'panel-card-art'); face.type = 'button'; face.setAttribute('aria-label', `${card.name} ${text.rule}`); key(face, card.id);
      const img = art.card(i); img.alt = ''; face.append(img, el('span', '', card.name));
      face.addEventListener('click', () => {
        back.hidden = false; back.onclick = () => { draw(); body.querySelector<HTMLElement>(`[data-focus="${card.id}"]`)?.focus(); };
        heading.textContent = card.name; body.replaceChildren(img.cloneNode(), el('p', 'card-rule', ruleLine(cardText(card.id, draft.game.rules)))); body.classList.add('panel-rule'); foot.hidden = true; heading.focus();
      });
      const toggle = check(panelText.use(card.name), draft.options.cardPool.includes(card.id), on => {
        cardError = !on && cardLocked(draft.options.cardPool, card.id) ? panelText.needFour : '';
        options({ cardPool: selectCard(draft.options.cardPool, card.id, on) });
      });
      tile.append(face, toggle); grid.append(tile);
    }
    box.append(grid); return box;
  }
  function draw() {
    actionId++;
    const active = document.activeElement as HTMLElement | null, focus = active?.dataset.focus, radio = active?.getAttribute('role') === 'radio' ? active.textContent : null, scroll = body.scrollTop;
    heading.textContent = text.newGame; back.hidden = true; back.onclick = null; foot.hidden = false; body.classList.remove('panel-rule');
    busy = false;
    const who = choiceGroup(panelText.opponent, [{ value: 'computer', label: text.computer }, { value: 'person', label: panelText.player }], opponent); who.classList.add('opponent-choice');
    who.addEventListener('kd-change', event => { opponent = (event as CustomEvent).detail.value; draw(); });
    const rows = el('section', 'game-options'); rows.append(el('h3', 'group-title', panelText.options));
    for (const name of ['pieces', 'powers', 'cards'] as const) {
      const on = name === 'pieces' || (name === 'powers' ? hasPowers(draft.setup) : hasCards(draft.setup)), row = el('div', 'option-row'), group = el('div', 'option-group');
      if (!on && section === name) section = null;
      const king = shownKing(draft.setup, draft.options.king);
      const summary = name === 'pieces' ? `${poolLetters(draft.options.pool, draft.options.seconds).length === poolLetters(POOL_KINDS).length ? panelText.allPieces : `${poolLetters(draft.options.pool, draft.options.seconds).length} pieces`} · ${draft.options.arrangement === 'random' ? panelText.random : panelText.manual}`
        : name === 'powers' ? `${king.king} · ${POWER_NAME[king.power]}` : cardSummary(draft.options.cardPool);
      const title = el('button', 'option-title'); title.type = 'button'; key(title, `open-${name}`); title.dataset.section = name;
      title.append(el('strong', '', panelText[name]), el('small', '', summary)); title.setAttribute('aria-expanded', String(on && section === name)); title.setAttribute('aria-controls', `options-${name}`); title.disabled = !on;
      title.addEventListener('click', () => { section = section === name ? null : name; draw(); });
      if (name !== 'pieces') row.append(check(panelText[name], on, checked => {
        if (name === 'cards') { cardError = ''; if (checked) options({ cardPool: DEAL_CARDS }); }
        edit({ setup: typeOfFlags(name === 'powers' ? checked : hasPowers(draft.setup), name === 'cards' ? checked : hasCards(draft.setup)) });
        if (checked) section = name;
      }));
      row.append(title); if (on) row.append(icon('down')); group.append(row);
      const preferred = draft.options.king;
      if (name === 'powers' && on && hasCards(draft.setup) && preferred && (preferred.king !== king.king || preferred.power !== king.power)) {
        const nameOf = (k: typeof king) => `${k.king} · ${POWER_NAME[k.power]}`;
        const note = el('p', 'panel-note king-change', panelText.changedKing(nameOf(preferred), nameOf(king))); note.setAttribute('role', 'status'); group.append(note);
      }
      if (section === name) { const content = name === 'pieces' ? piecesSection() : name === 'powers' ? powersSection() : cardsSection(); content.id = `options-${name}`; group.append(content); }
      rows.append(group);
    }
    body.replaceChildren(who);
    if (opponent === 'computer') {
      body.append(slider(text.level, LEVELS.map(level => text[level]), () => LEVELS.indexOf(draft.level), at => edit({ level: LEVELS[at] }), () => homeText.levels[draft.level]));
      body.append(slider(homeText.side, [sideText.light, sideText.dark], () => draft.player, at => {
        edit({ sideChoice: at ? 'dark' : 'light' });
        body.querySelectorAll<HTMLElement>('.pool-row').forEach(row => { const img = art.figure(LETTERS.indexOf(row.dataset.letter!), draft.player, draft.game.rules); img.alt = ''; row.querySelector('img')?.replaceWith(img); });
      }, () => sideLine(draft.sideChoice), true));
    }
    body.append(rows); byName.hidden = opponent !== 'person'; status.textContent = cardError; status.classList.toggle('card-error', !!cardError); status.setAttribute('role', cardError ? 'alert' : 'status');
    setButtonState(start, { label: opponent === 'computer' ? homeText.startGame : panelText.send, reason: '' });
    body.scrollTop = scroll;
    if (focus || radio) queueMicrotask(() => { const target = [...body.querySelectorAll<HTMLElement>('[data-focus], [role="radio"]')].find(n => focus ? n.dataset.focus === focus : n.textContent === radio); target?.focus({ preventScroll: true }); });
  }
  // The existing sign-in and name views render inside this panel, with the same history layer.
  const sheet: PeopleSheet = {
    element: dialog, get isOpen() { return dialog.open; }, close: () => close(),
    show(view) { heading.textContent = view.title; body.replaceChildren(...view.body); foot.hidden = true; back.hidden = false; back.onclick = view.back ?? (() => draw()); body.scrollTop = 0; heading.focus(); },
  };
  async function person(action: 'name' | 'link') {
    if (busy) return;
    const submitted = draft, own = ++actionId, current = () => dialog.open && own === actionId;
    const redraw = () => { if (current()) draw(); };
    const activeSheet: PeopleSheet = { element: dialog, get isOpen() { return current(); },
      show: view => { if (current()) sheet.show(view); }, close: () => { if (current()) close(); } };
    busy = true; status.textContent = panelText.loading;
    try {
      const host = await d.people(); if (!current()) return;
      d.remember(memory());
      const named = () => { if (!current()) return; if (!host.me()?.handle) nameSheet(activeSheet, host, redraw); else draw(); };
      if (!host.me()) { signInSheet(activeSheet, host, { kind: 'person' }, named); return; }
      if (!host.me()!.handle) { nameSheet(activeSheet, host, redraw); return; }
      const invited = () => { if (!current()) throw new ObsoleteAction(); d.onInvite(submitted); };
      const scoped = { ...host, toast: (message: string) => { if (current()) host.toast(message); },
        createLink: async (rules: GameType) => { const link = await host.createLink(rules, onlinePanelOptions(submitted.options)); invited(); return link; },
        invite: async (handle: string, rules: GameType) => { await host.invite(handle, rules, onlinePanelOptions(submitted.options)); invited(); } };
      if (action === 'name') nameSearch(activeSheet, scoped, submitted.setup, redraw);
      else await sendPersonLink(activeSheet, scoped, submitted.setup, redraw);
    } catch { if (current()) status.textContent = panelText.onlineFailed; }
    finally { if (current()) busy = false; }
  }
  dialog.append(head, body, foot);
  const shut = () => { if (!dialog.open) return; actionId++; d.remember(null); dialog.dispatchEvent(new CustomEvent('kd-before-close', { bubbles: true })); dialog.close(); if (opener?.isConnected) opener.focus(); };
  const close = (history = true) => { if (!dialog.open || starting) return; shut(); if (history) d.onClose(); };
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  async function begin() {
    if (starting || !dialog.open) return;
    starting = true;
    const swallow = (event: Event) => { if ((event.target as Element).closest('.play-game')) return; event.preventDefault(); event.stopPropagation(); };
    document.addEventListener('click', swallow, true); setTimeout(() => document.removeEventListener('click', swallow, true), ms('--dur-sheet-in') + 300);
    try { shut(); await d.onStart(draft); } finally { starting = false; }
  }
  return { element: dialog, open(source) { opener = source; draw(); dialog.showModal(); heading.tabIndex = -1; heading.focus(); }, close: () => close(false) };
}
