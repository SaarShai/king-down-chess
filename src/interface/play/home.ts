/**
 * Play, the games screen (launch decision 25), its piece card, and the New game panel (decision 26). The data and the
 * actions come from main.ts; this file draws them. Decisions 51 and 52: the "Play a person" row stays; the side choice
 * is "Your pieces".
 */
import { button, icon } from '../ui/kit.js';
import { A, K, type Color, type PieceType, type Rules } from '../../rules/engine';
import type { DraftTurn } from './turn';
import { pieces, text } from './texts';
import { newPieces } from './learning';
import { sideText, type SideChoice } from './sides';
import { listRow, pictureChoice, segmented } from './menus';
import { miniBoard, savedPreview, stateText } from './mini-board';
import { armyTypes, changeDraft, type NewGameDraft } from './new-game';
import { typeName, type GameType, type Level } from './saved';
import { calm, ms } from './motion';
import { computerPortrait, profilePortrait } from '../people/host/portrait';
import { deadlineLine, gameOrder, type HomeInvite, type PersonGame } from '../people/host/games';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content = '') => {
  const node = document.createElement(tag); node.className = className; node.textContent = content; return node;
};
export const homeText = {
  play: 'Play the computer', change: 'Change', army: 'Your next army', tap: 'Tap a figure to read its rule.', yourGame: 'Your game', turn: 'Turn',
  person: 'Play a person', personLine: 'Opens the online game.', startGame: 'Start game', gameType: 'Game type', side: 'Your pieces',
  ends: (opponent: string) => `This ends your game against the ${opponent}.`,
  types: { pieces: 'New pieces. No powers or cards.', powers: 'Each king gets a random power.', cards: 'Each king gets an always-on power. Both players get the same four cards.' } as Record<GameType, string>,
  // Launch decision 46: the levels stay; each line is true (runs/launch/opponent/report.md).
  levels: { casual: 'The easiest level. A good level for a first game.', clever: 'Much stronger than Friendly. It makes some mistakes.', club: 'The strongest level. Much stronger than Focused.' } as Record<Level, string>,
} as const;
export { typeName };
export const levelName = (level: Level) => `${text[level]} ${text.computer.toLowerCase()}`;
/** The setup line on Play: level, game type and side choice. */
export const summaryLine = (c: { level: Level; setup: GameType; sideChoice: SideChoice }) => `${text[c.level]} · ${typeName[c.setup]} · ${sideText[c.sideChoice]}`;

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
  onPerson(source: HTMLElement): void;
  onPersonGame(id: string): void;
  onAcceptInvite?(id: string): void;
  onDeclineInvite?(id: string): void;
  onInvitePlayer?(id: string, source: HTMLElement): void;
  onDismissInvite?(id: string): void;
  offer(fallback: HTMLButtonElement): HTMLElement | null;
  onPlay(source: HTMLButtonElement): void;
  onContinue(source: HTMLButtonElement): void;
  onChange(source: HTMLButtonElement): void;
  onRule(type: PieceType): void;
}
/** The piece type whose Full rule the person opened from Play: Back returns to its figure. */
let ruleFrom: PieceType | null = null;

/** A failed army picture keeps its piece name in view. */
function armyImage(item: HTMLElement, img: HTMLImageElement, name: string) {
  const fallback = el('span', 'army-fallback', name); fallback.hidden = true;
  img.addEventListener('error', () => { img.hidden = true; fallback.hidden = false; });
  item.append(img, fallback);
}

/** The army of the next game: each type one time, 44 px targets; a tap shows the piece card under the row. */
function armyRow(draft: NewGameDraft, art: Art, onRule: (type: PieceType) => void): { element: HTMLElement; focus(type: PieceType): boolean } {
  const box = el('div', 'home-army-box'), row = el('div', 'home-army'); row.setAttribute('role', 'group'); row.setAttribute('aria-label', homeText.army);
  let card: HTMLElement | null = null, opener: HTMLButtonElement | null = null;
  const close = (focus = true) => { card?.remove(); card = null; opener?.setAttribute('aria-expanded', 'false'); if (focus) opener?.focus(); opener = null; document.removeEventListener('pointerdown', outside, true); };
  const outside = (event: Event) => { if (card && !card.contains(event.target as Node) && !row.contains(event.target as Node)) close(false); };
  const show = (type: PieceType, source: HTMLButtonElement) => {
    if (opener === source) { close(); return; }
    close(false); opener = source; source.setAttribute('aria-expanded', 'true');
    card = el('section', 'piece-card'); card.id = `piece-card-${type}`; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', pieces[type].name);
    const head = el('div', 'piece-card-head'), name = el('h3', '', pieces[type].name); name.tabIndex = -1;
    if (newPieces.has(type)) name.append(el('span', 'new-tag', 'New'));
    head.append(art.figure(type, draft.player, draft.game.rules), name, button(text.close, { onPress: () => close() }));
    const full = button(text.fullRule, { icon: 'next', onPress: () => { ruleFrom = type; onRule(type); } });
    card.append(head, el('p', '', pieces[type].short), full);
    card.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } });
    box.append(card);
    // The arrow points at the tapped figure; the card stays inside the row's width.
    const at = source.getBoundingClientRect(), left = box.getBoundingClientRect().left;
    card.style.setProperty('--arrow', `${Math.round(at.left + at.width / 2 - left)}px`);
    source.setAttribute('aria-controls', card.id);
    document.addEventListener('pointerdown', outside, true);
    name.focus({ preventScroll: true }); card.scrollIntoView({ block: 'nearest' });
  };
  const items = armyTypes(draft.game, draft.player).map(({ type, count }) => {
    const item = el('button', 'army-figure'); item.type = 'button'; item.dataset.type = String(type);
    item.setAttribute('aria-label', count > 1 ? `${pieces[type].name}, ${count}` : pieces[type].name); item.setAttribute('aria-expanded', 'false');
    armyImage(item, art.figure(type, draft.player, draft.game.rules), pieces[type].name);
    item.addEventListener('click', () => show(type, item));
    item.addEventListener('keydown', event => { if (event.key === 'Escape' && card) { event.preventDefault(); close(); } });
    return item;
  });
  row.append(...items); box.append(row);
  return { element: box, focus: type => { const item = items.find(node => node.dataset.type === String(type)); item?.focus(); return !!item; } };
}
/** The army of the panel: pictures only. */
function armyPictures(draft: NewGameDraft, art: Art): HTMLElement {
  const row = el('div', 'home-army panel-army'); row.setAttribute('role', 'list'); row.setAttribute('aria-label', homeText.army);
  for (const { type, count } of armyTypes(draft.game, draft.player)) {
    const item = el('span', 'army-figure'); item.setAttribute('role', 'listitem'); item.dataset.type = String(type);
    const img = art.figure(type, draft.player, draft.game.rules); img.alt = count > 1 ? `${pieces[type].name}, ${count}` : pieces[type].name;
    armyImage(item, img, pieces[type].name); row.append(item);
  }
  return row;
}

/** The closed list shows three rows and a half-row cue. */
export const gamesListView = (count: number, expanded: boolean) => ({ collapsed: count > 3 && !expanded, shown: count > 3 && !expanded ? 4 : count });

/** The approved home: a hero with no game, else one list of games. */
export function playScreen(d: PlayData, art: Art): { element: HTMLElement; focus(): void } {
  const home = el('section', 'play-home');
  const title = el('h1', '', text.title); title.tabIndex = -1;
  const start = el('div', 'home-start'), more = el('div', 'home-more');
  const person = listRow({ label: homeText.person, line: homeText.personLine, lead: icon('you'), onPress: () => d.onPerson(person) }); person.classList.add('home-person');
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
  let army: ReturnType<typeof armyRow> | null = null, main: HTMLButtonElement;
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
    main = button(text.play, { kind: 'main', onPress: () => d.onPlay(main) });
    const hero = el('div', 'home-hero'), picture = el('picture'), source = el('source'), img = el('img');
    source.media = '(max-width: 599px)'; source.srcset = [400, 600, 800, 1122].map(w => `/interface/home-hero-portrait-${w}.webp ${w}w`).join(', '); source.sizes = 'calc(100vw - 40px)';
    img.src = '/interface/home-hero-wide-640.webp'; img.srcset = [640, 960, 1280, 1672].map(w => `/interface/home-hero-wide-${w}.webp ${w}w`).join(', '); img.sizes = '(min-width: 1120px) 1056px, calc(100vw - 40px)';
    img.width = 1672; img.height = 941; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.fetchPriority = 'low';
    picture.append(source, img); hero.append(picture, main); home.append(hero, el('p', 'home-intro', text.intro));
    const summary = el('div', 'home-summary'), change = button(homeText.change, { onPress: () => d.onChange(change) }); change.classList.add('text-button', 'home-change');
    summary.append(el('p', '', summaryLine(d.next)), change); start.append(summary);
    army = armyRow(d.next, art, d.onRule);
    const block = el('section', 'home-army-block'); block.append(el('h2', 'group-title', homeText.army), army.element, el('p', 'home-hint', homeText.tap)); more.append(block);
  }
  start.append(...(d.status ? [el('p', 'home-note', d.status)] : []), ...[d.offer(main)].filter((node): node is HTMLElement => !!node));
  if (rows.length) more.append(person); else start.append(person); const columns = el('div', 'home-columns'); columns.append(start, more); home.append(columns);
  return { element: home, focus() {
    const type = ruleFrom; ruleFrom = null;
    if (type != null && army?.focus(type)) { home.dataset.restore = 'true'; return; }
    title.focus({ preventScroll: true });
  } };
}

export interface PanelData {
  next: NewGameDraft;
  /** The game that a start ends: an identity key ('' for none) and its red line. Read again at each press. */
  current(): { key: string; line: string };
  /** Start the shown candidate (after the panel closes). */
  onStart(draft: NewGameDraft): Promise<void>;
  /** The panel closes with no start (Close, the scrim, Escape): the history entry of the panel goes. */
  onClose(): void;
}
/**
 * The New game panel: a sheet from the bottom on a phone, a centred panel from 600 px. Its edits stay in the panel:
 * Close, the scrim, Escape and Back write nothing and keep the stored choices.
 */
export function newGamePanel(d: PanelData, art: Art): { element: HTMLDialogElement; open(source: HTMLElement): void; close(): void } {
  const dialog = el('dialog', 'kd-dialog new-game-panel'), heading = el('h2', '', text.newGame); heading.id = 'new-game-title';
  dialog.setAttribute('aria-labelledby', heading.id);
  let draft = d.next, opener: HTMLElement | null = null, starting = false, shownKey = '';
  const head = el('div', 'panel-head'), body = el('div', 'panel-body'), foot = el('div', 'panel-foot');
  head.append(heading, button(text.close, { onPress: () => close() }));
  const warning = el('p', 'panel-warning'), start: HTMLButtonElement = button(homeText.startGame, { kind: 'main', onPress: () => { void begin(); } });
  const setWarning = () => { const now = d.current(); shownKey = now.key; warning.textContent = now.line; warning.hidden = !now.line; };
  foot.append(warning, start);
  const draw = () => {
    const types = pictureChoice(homeText.gameType, (['pieces', 'powers', 'cards'] as GameType[]).map(value => ({ value, label: typeName[value], description: homeText.types[value], art: value === 'cards' ? art.card(0) : art.figure(value === 'pieces' ? A : K, 0, value === 'pieces' ? { kings: [null, null] } : { kings: [{ king: 'Frost', power: 'Freeze' }, null] }) })), draft.setup);
    const levels = segmented(text.level, (['casual', 'clever', 'club'] as Level[]).map(value => ({ value, label: text[value] })), draft.level);
    const levelLine = el('p', 'level-line', homeText.levels[draft.level]);
    const king = (side: Color) => art.figure(K, side, draft.game.rules);
    const sides = segmented(homeText.side, (['light', 'dark', 'random'] as SideChoice[]).map(value => {
      const box = el('span', 'side-kings'); box.append(...(value === 'random' ? [king(0), king(1)] : [king(value === 'dark' ? 1 : 0)]));
      return { value, label: sideText[value], art: box };
    }), draft.sideChoice);
    sides.classList.add('side-choice');
    const army = el('section', 'panel-army-block'), armyHead = el('h3', 'group-title', homeText.army); army.append(armyHead, armyPictures(draft, art));
    const change = (key: 'setup' | 'level' | 'sideChoice') => (event: Event) => {
      draft = changeDraft(draft, { [key]: (event as CustomEvent).detail.value });
      if (key === 'level') levelLine.textContent = homeText.levels[draft.level];
      else army.replaceChildren(armyHead, armyPictures(draft, art));
      if (key === 'setup') sides.querySelectorAll('.side-kings').forEach((box, i) => box.replaceChildren(...(i === 2 ? [king(0), king(1)] : [king(i as Color)])));
    };
    types.addEventListener('kd-change', change('setup')); levels.addEventListener('kd-change', change('level')); sides.addEventListener('kd-change', change('sideChoice'));
    types.dataset.setting = 'setup'; levels.dataset.setting = 'level'; sides.dataset.setting = 'side';
    body.replaceChildren(types, levels, levelLine, sides, army);
  };
  dialog.append(head, body, foot);
  // The departure motion of the kit's dialogs (play/motion.ts), then a native close that keeps no state.
  const shut = () => { if (!dialog.open) return; dialog.dispatchEvent(new CustomEvent('kd-before-close', { bubbles: true })); dialog.close(); if (opener?.isConnected) opener.focus(); };
  const close = (history = true) => { if (!dialog.open || starting) return; shut(); if (history) d.onClose(); };
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  /** The guard is set before any wait: a second press cannot deal, save or mount twice. */
  async function begin() {
    if (starting || !dialog.open) return;
    // Another tab can save or end a game while the panel is open: a changed game needs a new press.
    if (d.current().key !== shownKey) { setWarning(); warning.animate([{ opacity: .2 }, { opacity: 1 }], { duration: calm() ? 1 : ms('--dur-msg-in') }); return; }
    starting = true;
    // A double press: the second press must not land on the page under the closed panel (the Play tab on a phone).
    // The new game's controls take input at once.
    const swallow = (event: Event) => { if ((event.target as Element).closest('.play-game')) return; event.preventDefault(); event.stopPropagation(); };
    document.addEventListener('click', swallow, true); setTimeout(() => document.removeEventListener('click', swallow, true), ms('--dur-sheet-in') + 300);
    try { shut(); await d.onStart(draft); } finally { starting = false; }
  }
  return {
    element: dialog,
    open(source) { opener = source; draft = d.next; draw(); setWarning(); dialog.showModal(); heading.tabIndex = -1; heading.focus(); },
    close: () => close(false),
  };
}
