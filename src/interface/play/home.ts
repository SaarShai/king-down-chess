import { button, icon } from '../ui/kit.js';
import { colorOf, typeOf, type Color, type Rules } from '../../rules/engine';
import type { DraftTurn } from './turn';
import { panelText, text } from './texts';
import { sideText, type SideChoice } from './sides';
import { miniBoard, savedPreview, replayMiniBoard, stateText, type SavedPreview } from './mini-board';
import type { NewGameDraft } from './new-game';
import { typeName, type GameType, type Level } from './saved';
import { RELEASED_CARDS } from '../../content/cards';
import { computerPortrait, profilePortrait } from '../people/host/portrait';
import { deadlineLine, gameOrder, type HomeInvite, type PersonGame } from '../people/host/games';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content = '') => {
  const node = document.createElement(tag); node.className = className; node.textContent = content; return node;
};
export const homeText = {
  yourGame: 'Your game', turn: 'Turn',
  startGame: 'Start game', side: 'Your side',
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
  previews: Map<string, string>;
}
/** The closed list shows three rows and a half-row cue. */
export const gamesListView = (count: number, expanded: boolean) => ({ collapsed: count > 3 && !expanded, shown: count > 3 && !expanded ? 4 : count });

export function playScreen(d: PlayData, art: Art): { element: HTMLElement; focus(): void } {
  const home = el('section', 'play-home'), hero = el('div', 'home-hero'), brand = el('header', 'home-brand');
  const title = el('h1', '', text.title); title.tabIndex = -1;
  const crown = icon('play'); crown.removeAttribute('data-icon');
  crown.setAttribute('viewBox', '0 0 40 24');
  crown.querySelector('path')!.setAttribute('d', 'M5 19 3 6.5l9.5 6.2L20 2.5l7.5 10.2L37 6.5 35 19zM6 22h28');
  brand.append(crown, title);
  const picture = el('picture'), wide = el('source'), img = el('img');
  wide.media = '(min-aspect-ratio: 5/4), (min-width: 600px) and (max-height: 910px)';
  wide.srcset = '/interface/daylight-hero-wide-960.webp 960w, /interface/daylight-hero-wide-1672.webp 1672w';
  wide.sizes = '70vw';
  img.src = '/interface/daylight-hero-portrait-600.webp';
  img.srcset = '/interface/daylight-hero-portrait-600.webp 600w, /interface/daylight-hero-portrait-1122.webp 1122w';
  img.sizes = '100vw'; img.alt = ''; img.decoding = 'async'; img.fetchPriority = 'high';
  picture.append(wide, img); hero.append(picture, brand); home.append(hero);

  const start = el('div', 'home-start');
  const rows: { mine: boolean; deadline: string | null; state: PersonGame['state']; row: HTMLElement }[] = [];
  const games = [...d.people].sort(gameOrder);
  const primary = d.resume ? undefined : games.find(game => game.state === 'playing' && game.preview);
  for (const game of games) {
    if (game === primary) continue;
    const row = el('button', 'home-game-row'); row.type = 'button'; row.dataset.game = game.id; row.dataset.mine = String(game.mine);
    const left = game.state === 'playing' ? deadlineLine(game.deadline) : '';
    row.append(profilePortrait(game.name, game.avatar), el('strong', '', game.name), el('span', '', [game.status, left].filter(Boolean).join(' · ')), icon('next'));
    row.addEventListener('click', () => d.onPersonGame(game.id));
    rows.push({ ...game, row });
  }
  for (const invite of d.invites ?? []) {
    const row = el('div', 'home-game-row home-invite-row'); row.dataset.invite = invite.id; row.dataset.inviteKind = invite.kind;
    const copy = el('div', 'home-game-copy'); copy.append(el('strong', '', invite.name), el('span', '', invite.line));
    const actions = el('div', 'home-invite-actions');
    if (invite.kind === 'incoming') actions.append(
      button('Accept', { kind: 'main', onPress: () => d.onAcceptInvite?.(invite.id) }),
      button('Decline', { onPress: () => d.onDeclineInvite?.(invite.id) }),
    );
    else actions.append(button('Dismiss', { onPress: () => d.onDismissInvite?.(invite.id) }));
    if (invite.kind === 'incoming' && d.onInvitePlayer) {
      const player: HTMLButtonElement = button('Player options', { onPress: () => d.onInvitePlayer!(invite.id, player) }); actions.append(player);
    }
    row.append(profilePortrait(invite.name, invite.avatar), copy, actions);
    rows.push({ mine: invite.kind === 'incoming', deadline: null, state: invite.kind === 'incoming' ? 'setup' : 'finished', row });
  }
  const card = el('article', 'home-card');
  const newGame = button(d.resume || primary || rows.length ? text.newGame : text.play, { kind: d.resume || primary ? 'quiet' : 'main', onPress: () => d.onChange(newGame) });
  newGame.classList.add(d.resume || primary || rows.length ? 'home-side-new' : 'home-hero-new');
  let main = newGame;
  if (d.resume || primary) {
    const local = d.resume, preview = local ? savedPreview(local.draft, local.player) : primary!.preview!;
    const name = local ? text.computer : primary!.name;
    const face = local ? el('img', 'profile-portrait') : profilePortrait(name, primary!.avatar);
    if (face instanceof HTMLImageElement && local) { face.src = computerPortrait(local.level); face.alt = ''; }
    const seat = el('div', 'home-seat'), copy = el('div', 'home-game-copy'), state = el('div', 'home-state');
    copy.append(el('h2', '', name));
    if (local) copy.append(el('span', '', text[local.level]));
    const status = el('strong', '', local ? stateText[preview.state] : primary!.status);
    status.dataset.mine = String(local ? preview.state !== 'computer' : primary!.mine);
    state.append(status, el('span', '', `Move ${preview.turn}`));
    seat.append(face, copy, state);
    const rules = local?.draft.game.context.rules;
    const board = miniBoard(preview, code => rules ? art.figure(typeOf(code), colorOf(code), rules).src : art.symbol(code));
    if (rules) board.classList.add('mini-painted');
    card.append(board, seat); start.append(card);
    const resume = button(text.resume, { kind: 'main', onPress: () => local ? d.onContinue(resume) : d.onPersonGame(primary!.id) });
    resume.classList.add('home-continue');
    if (local) resume.dataset.saved = 'computer';
    else resume.dataset.game = primary!.id;
    main = resume; start.append(resume);
    rememberMove(d.previews, local ? 'computer' : primary!.id, preview, board);
  } else {
    card.classList.add('home-welcome');
    const summary = button(summaryLine(d.next), { icon: 'next', onPress: () => d.onChange(newGame) });
    summary.classList.add('home-summary');
    card.append(newGame, summary, el('p', 'home-intro', text.intro)); start.append(card);
  }
  if (rows.length) {
    rows.sort(gameOrder);
    const state = d.gamesList ?? { expanded: false }, list = el('ul', 'home-game-list');
    list.id = 'your-games'; list.setAttribute('aria-label', text.yourGames);
    const draw = () => {
      const { collapsed, shown } = gamesListView(rows.length, state.expanded); list.dataset.collapsed = String(collapsed);
      list.replaceChildren(...rows.map(({ row }, i) => {
        const li = el('li'); li.hidden = i >= (collapsed ? shown - 1 : shown); li.append(row); return li;
      }));
    };
    draw(); start.append(list);
    if (rows.length > 3 && !state.expanded) {
      const all = button(text.showAllGames, { icon: 'down', onPress: () => {
        state.expanded = true; draw(); all.remove(); (rows[3].row.querySelector('button') ?? rows[3].row).focus();
      } });
      all.classList.add('all-games'); all.setAttribute('aria-controls', list.id); start.append(all);
    }
  }
  if (main !== newGame) start.append(newGame);
  if (d.status) start.append(el('p', 'home-note', d.status));
  const offer = d.offer(main); if (offer) start.append(offer);
  home.dataset.state = main === newGame ? 'new' : 'saved';
  home.append(start);
  return { element: home, focus: () => title.focus({ preventScroll: true }) };
}

function rememberMove(played: Map<string, string>, id: string, preview: SavedPreview, board: HTMLElement) {
  const last = preview.last;
  if (!last) return;
  const key = `${last.before.ply}:${last.before.board.join(',')}:${last.move.from}:${last.move.to}`;
  if (played.get(id) === key) return;
  requestAnimationFrame(() => {
    if (!board.isConnected || played.get(id) === key) return;
    played.set(id, key); replayMiniBoard(board, preview);
  });
}
