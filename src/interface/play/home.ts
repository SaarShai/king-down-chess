/**
 * Play, the games screen (launch decision 25), its piece card, and the New game panel (decision 26). The data and the
 * actions come from main.ts; this file draws them. One New game panel serves Computer and Person.
 */
import { button, choiceGroup, closeX, icon, setButtonState } from '../ui/kit.js';
import { KINGS, LETTERS, type KingName, type Color, type PieceType, type Rules } from '../../rules/engine';
import type { DraftTurn } from './turn';
import { panelText, pieces, text } from './texts';
import { newPieces } from './learning';
import { sideText, type SideChoice } from './sides';
import { miniBoard, savedPreview, stateText } from './mini-board';
import { armyTypes, cardLocked, changeDraft, restorePanel, kingChoices, LEVELS, levelKey, poolLetters, poolLocked, shownKing, type GameOptions, type NewGameDraft, type PanelMemory } from './new-game';
import { hasCards, hasPowers, typeName, typeOfFlags, type GameType, type Level } from './saved';
import { DEAL_CARDS, POOL_KINDS } from '../../match/setup';
import { RELEASED_CARDS } from '../../content/cards';
import { cardText, powerText, ruleLine, POWER_NAME } from '../../powers-ui';
import { nameSearch, sendPersonLink, type PersonHost } from '../people/screens/person';
import { nameSheet, signInSheet } from '../people/screens/sign-in';
import type { PeopleSheet } from '../people/screens/sheet';
import { calm, ms } from './motion';
import { computerPortrait, profilePortrait } from '../people/host/portrait';
import { deadlineLine, gameOrder, type HomeInvite, type PersonGame } from '../people/host/games';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content = '') => {
  const node = document.createElement(tag); node.className = className; node.textContent = content; return node;
};
export const homeText = {
  army: 'Your next army', tap: 'Tap a figure to read its rule.', yourGame: 'Your game', turn: 'Turn',
  startGame: 'Start game', side: 'Your pieces',
  ends: (opponent: string) => `This ends your game against the ${opponent}.`,
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
    main = button(text.newGame, { kind: 'main', onPress: () => d.onChange(main) }); main.classList.add('home-hero-new');
    const hero = el('div', 'home-hero'), picture = el('picture'), source = el('source'), img = el('img');
    source.media = '(max-width: 599px)'; source.srcset = [400, 600, 800, 1122].map(w => `/interface/home-hero-portrait-${w}.webp ${w}w`).join(', '); source.sizes = 'calc(100vw - 40px)';
    img.src = '/interface/home-hero-wide-640.webp'; img.srcset = [640, 960, 1280, 1672].map(w => `/interface/home-hero-wide-${w}.webp ${w}w`).join(', '); img.sizes = '(min-width: 1120px) 1056px, calc(100vw - 40px)';
    img.width = 1672; img.height = 941; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.fetchPriority = 'low';
    picture.append(source, img); hero.append(picture, main); home.append(hero, el('p', 'home-intro', text.intro));
    const summary = el('div', 'home-summary'); summary.append(el('p', '', summaryLine(d.next))); start.append(summary);
    army = armyRow(d.next, art, d.onRule);
    const block = el('section', 'home-army-block'); block.append(el('h2', 'group-title', homeText.army), army.element, el('p', 'home-hint', homeText.tap)); more.append(block);
  }
  start.append(...(d.status ? [el('p', 'home-note', d.status)] : []), ...[d.offer(main)].filter((node): node is HTMLElement => !!node));
  const columns = el('div', 'home-columns'); columns.append(start, more); home.append(columns);
  return { element: home, focus() {
    const type = ruleFrom; ruleFrom = null;
    if (type != null && army?.focus(type)) { home.dataset.restore = 'true'; return; }
    title.focus({ preventScroll: true });
  } };
}

export interface PanelData {
  next: NewGameDraft;
  memory?: PanelMemory | null;
  people(): Promise<PersonHost>;
  remember(value: PanelMemory | null): void;
  current(): { key: string; line: string };
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
  let cardMode = saved?.cardMode ?? (draft.options.cardPool.length === 4 ? 'four' : 'all'), picked = saved?.picked ?? (cardMode === 'four' ? [...draft.options.cardPool] : []);
  let opener: HTMLElement | null = null, starting = false, shownKey = '', busy = false;
  const head = el('div', 'panel-head'), body = el('div', 'panel-body'), foot = el('div', 'panel-foot');
  const back = button(panelText.back, { icon: 'back' }); back.hidden = true;
  head.append(back, heading, closeX(text.close, () => close()));
  const warning = el('p', 'panel-warning'), status = el('p', 'panel-status'); status.setAttribute('role', 'status');
  const start: HTMLButtonElement = button(homeText.startGame, { kind: 'main', onPress: () => { if (opponent === 'computer') void begin(); else void person('link'); } });
  const byName = button(panelText.byName, { onPress: () => void person('name') }); byName.classList.add('text-button');
  const setWarning = () => { const now = d.current(); shownKey = now.key; warning.textContent = now.line; warning.hidden = opponent === 'person' || !now.line; };
  foot.append(warning, status, byName, start);
  const memory = (): PanelMemory => ({ setup: draft.setup, level: draft.level, sideChoice: draft.sideChoice, options: draft.options, opponent, section, cardMode, picked, deal: { back: draft.back, player: draft.player, rules: draft.rules } });
  const edit = (change: Parameters<typeof changeDraft>[1]) => { draft = changeDraft(draft, change); };
  const options = (change: Partial<GameOptions>) => edit({ options: { ...draft.options, ...change } });
  const key = (node: HTMLElement, name: string) => { node.dataset.focus = name; return node; };
  const check = (name: string, checked: boolean, change: (checked: boolean) => void, locked = false) => {
    const label = el('label', 'panel-check'), input = el('input'); input.type = 'checkbox'; input.checked = checked; input.disabled = locked; input.setAttribute('aria-label', name); key(input, name);
    label.append(input); input.addEventListener('change', () => { change(input.checked); draw(); }); return label;
  };
  function levelSlider() {
    const box = el('section', 'level-control'), label = el('h3', '', text.level); label.id = 'computer-level';
    const track = el('div', 'level-track'), input = el('input', 'level-range'), labels = el('div', 'level-labels'), line = el('p', 'level-line');
    input.type = 'range'; input.min = '0'; input.max = '2'; input.step = '1'; input.setAttribute('aria-labelledby', label.id); key(input, 'level');
    const sync = () => { const at = LEVELS.indexOf(draft.level); input.value = String(at); input.setAttribute('aria-valuetext', text[draft.level]); box.dataset.level = String(at); line.textContent = homeText.levels[draft.level]; labels.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(at === i))); };
    input.addEventListener('input', () => { edit({ level: LEVELS[+input.value] }); sync(); });
    input.addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); edit({ level: levelKey(draft.level, event.key) }); sync(); });
    labels.append(...LEVELS.map((level, i) => { const b = button(text[level], { onPress: () => { edit({ level }); sync(); } }); b.dataset.stop = String(i); return b; }));
    track.append(el('span', 'level-flow'), input); box.append(label, track, labels, line); sync(); return box;
  }
  function piecesSection() {
    const box = el('div', 'panel-section'), list = el('div', 'pool-list');
    const fixed = el('p', 'panel-note', panelText.always), lock = el('p', 'panel-note', panelText.poolLock); lock.id = 'pool-lock';
    for (const letter of POOL_KINDS) {
      const type = LETTERS.indexOf(letter) as PieceType, name = pieces[type].name, row = el('div', 'pool-row'), locked = poolLocked(draft.options.pool, letter);
      const figure = art.figure(type, draft.player, draft.game.rules); figure.alt = '';
      const label = el('span', '', name), count = el('span', 'pool-count', `×${poolLetters([letter]).length}`);
      const toggle = check(panelText.use(name), draft.options.pool.includes(letter), on => options({ pool: on ? [...draft.options.pool, letter] : draft.options.pool.filter(k => k !== letter) }), locked);
      if (locked) { toggle.querySelector('input')!.setAttribute('aria-describedby', lock.id); row.dataset.locked = 'true'; }
      row.append(figure, label, count, toggle); list.append(row);
    }
    lock.hidden = !POOL_KINDS.some(k => poolLocked(draft.options.pool, k));
    const arrangement = choiceGroup(panelText.arrangement, [{ value: 'random', label: panelText.random }, { value: 'manual', label: panelText.manual }], draft.options.arrangement);
    arrangement.addEventListener('kd-change', event => { options({ arrangement: (event as CustomEvent).detail.value }); draw(); });
    const army = el('section', 'panel-army-block'); army.append(el('h3', '', opponent === 'computer' ? homeText.army : panelText.exampleArmy), armyPictures(draft, art));
    box.append(fixed, list, lock, arrangement, el('p', 'panel-note', panelText.manualLine), army); return box;
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
    const box = el('div', 'panel-section'), mode = choiceGroup(panelText.chooseCards, [{ value: 'all', label: panelText.allCards }, { value: 'four', label: panelText.four }], cardMode);
    mode.addEventListener('kd-change', event => { cardMode = (event as CustomEvent).detail.value; options({ cardPool: cardMode === 'all' ? DEAL_CARDS : picked.length === 4 ? picked : DEAL_CARDS }); draw(); });
    box.append(mode, el('p', 'panel-note', panelText.shared));
    if (cardMode === 'four') {
      const count = el('p', 'card-count', panelText.count(picked.length)); count.setAttribute('role', 'status'); box.append(count);
      const grid = el('div', 'panel-card-grid');
      for (const [i, card] of RELEASED_CARDS.entries()) {
        const tile = el('div', 'panel-card'), face = el('button', 'panel-card-art'); face.type = 'button'; face.setAttribute('aria-label', `${card.name} ${text.rule}`); key(face, card.id);
        const img = art.card(i); img.alt = ''; face.append(img, el('span', '', card.name));
        face.addEventListener('click', () => {
          back.hidden = false; back.onclick = () => { draw(); body.querySelector<HTMLElement>(`[data-focus="${card.id}"]`)?.focus(); };
          heading.textContent = card.name; body.replaceChildren(img.cloneNode(), el('p', 'card-rule', ruleLine(cardText(card.id, draft.game.rules)))); body.classList.add('panel-rule'); foot.hidden = true; heading.focus();
        });
        const toggle = check(panelText.use(card.name), picked.includes(card.id), on => { picked = on ? [...picked, card.id] : picked.filter(c => c !== card.id); if (picked.length === 4) options({ cardPool: picked }); }, cardLocked(picked, card.id));
        tile.append(face, toggle); grid.append(tile);
      }
      box.append(grid);
    }
    return box;
  }
  function draw() {
    const active = document.activeElement as HTMLElement | null, focus = active?.dataset.focus, radio = active?.getAttribute('role') === 'radio' ? active.textContent : null, scroll = body.scrollTop;
    heading.textContent = text.newGame; back.hidden = true; back.onclick = null; foot.hidden = false; body.classList.remove('panel-rule');
    busy = false;
    const who = choiceGroup(panelText.opponent, [{ value: 'computer', label: text.computer }, { value: 'person', label: panelText.person }], opponent); who.classList.add('opponent-choice');
    who.addEventListener('kd-change', event => { opponent = (event as CustomEvent).detail.value; draw(); });
    const rows = el('section', 'game-options'); rows.append(el('h3', 'group-title', panelText.options));
    for (const name of ['pieces', 'powers', 'cards'] as const) {
      const on = name === 'pieces' || (name === 'powers' ? hasPowers(draft.setup) : hasCards(draft.setup)), row = el('div', 'option-row'), group = el('div', 'option-group');
      if (!on && section === name) section = null;
      const king = shownKing(draft.setup, draft.options.king);
      const summary = name === 'pieces' ? `${draft.options.pool.length === POOL_KINDS.length ? panelText.allPieces : `${poolLetters(draft.options.pool).length} pieces`} · ${draft.options.arrangement === 'random' ? panelText.random : panelText.manual}`
        : name === 'powers' ? `${king.king} · ${POWER_NAME[king.power]}` : cardMode === 'all' ? panelText.allCards : panelText.count(picked.length);
      const title = el('button', 'option-title'); title.type = 'button'; key(title, `open-${name}`); title.dataset.section = name;
      title.append(el('strong', '', panelText[name]), el('small', '', summary)); title.setAttribute('aria-expanded', String(on && section === name)); title.setAttribute('aria-controls', `options-${name}`); title.disabled = !on;
      title.addEventListener('click', () => { section = section === name ? null : name; draw(); });
      if (name !== 'pieces') row.append(check(panelText[name], on, checked => edit({ setup: typeOfFlags(name === 'powers' ? checked : hasPowers(draft.setup), name === 'cards' ? checked : hasCards(draft.setup)) })));
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
      const sides = choiceGroup(homeText.side, (['light', 'dark', 'random'] as SideChoice[]).map(value => ({ value, label: sideText[value] })), draft.sideChoice); sides.classList.add('side-choice');
      sides.addEventListener('kd-change', event => { edit({ sideChoice: (event as CustomEvent).detail.value }); draw(); });
      body.append(levelSlider(), sides);
    }
    body.append(rows); byName.hidden = opponent !== 'person'; setWarning(); status.textContent = '';
    setButtonState(start, { label: opponent === 'computer' ? homeText.startGame : panelText.send, reason: hasCards(draft.setup) && cardMode === 'four' && picked.length !== 4 ? panelText.needFour : '' });
    body.scrollTop = scroll;
    if (focus || radio) queueMicrotask(() => { const target = [...body.querySelectorAll<HTMLElement>('[data-focus], [role="radio"]')].find(n => focus ? n.dataset.focus === focus : n.textContent === radio); target?.focus({ preventScroll: true }); });
  }
  // The existing sign-in and name views render inside this panel, with the same history layer.
  const sheet: PeopleSheet = {
    element: dialog, get isOpen() { return dialog.open; }, close: () => close(),
    show(view) { heading.textContent = view.title; body.replaceChildren(...view.body); foot.hidden = true; back.hidden = false; back.onclick = view.back ?? (() => draw()); body.scrollTop = 0; heading.focus(); },
  };
  async function person(action: 'name' | 'link') {
    if (busy || hasCards(draft.setup) && cardMode === 'four' && picked.length !== 4) return;
    busy = true; status.textContent = panelText.loading;
    try {
      const host = await d.people(); if (!dialog.open) return;
      d.remember(memory());
      const named = () => { if (!host.me()?.handle) nameSheet(sheet, host, () => draw()); else draw(); };
      if (!host.me()) { signInSheet(sheet, host, { kind: 'person' }, named); return; }
      if (!host.me()!.handle) { nameSheet(sheet, host, () => draw()); return; }
      const scoped = { ...host, createLink: async (rules: GameType) => { const link = await host.createLink(rules, draft.options); d.onInvite(draft); return link; }, invite: async (handle: string, rules: GameType) => { await host.invite(handle, rules, draft.options); d.onInvite(draft); } };
      if (action === 'name') nameSearch(sheet, scoped, draft.setup, () => draw());
      else await sendPersonLink(sheet, scoped, draft.setup, () => draw());
    } catch { status.textContent = panelText.onlineFailed; }
    finally { busy = false; }
  }
  dialog.append(head, body, foot);
  const shut = () => { if (!dialog.open) return; d.remember(null); dialog.dispatchEvent(new CustomEvent('kd-before-close', { bubbles: true })); dialog.close(); if (opener?.isConnected) opener.focus(); };
  const close = (history = true) => { if (!dialog.open || starting) return; shut(); if (history) d.onClose(); };
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  async function begin() {
    if (starting || !dialog.open || hasCards(draft.setup) && cardMode === 'four' && picked.length !== 4) return;
    if (d.current().key !== shownKey) { setWarning(); warning.animate([{ opacity: .2 }, { opacity: 1 }], { duration: calm() ? 1 : ms('--dur-msg-in') }); return; }
    starting = true;
    const swallow = (event: Event) => { if ((event.target as Element).closest('.play-game')) return; event.preventDefault(); event.stopPropagation(); };
    document.addEventListener('click', swallow, true); setTimeout(() => document.removeEventListener('click', swallow, true), ms('--dur-sheet-in') + 300);
    try { shut(); await d.onStart(draft); } finally { starting = false; }
  }
  return { element: dialog, open(source) { opener = source; draw(); dialog.showModal(); heading.tabIndex = -1; heading.focus(); }, close: () => close(false) };
}
