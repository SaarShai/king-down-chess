import { button, icon } from '../ui/kit.js';
import { colorOf, typeOf, type Color, type Rules } from '../../rules/engine';
import type { DraftTurn } from './turn';
import { panelText, text } from './texts';
import { sideText, type SideChoice } from './sides';
import { miniBoard, savedPreview, replayMiniBoard, stateText, type SavedPreview } from './mini-board';
import type { NewGameDraft } from './new-game';
import { typeName, type GameType, type Level } from './saved';
import { daylightCrown } from './shell';
import { ease, reducedMotion, tween, type Effect } from './fx';
import { RELEASED_CARDS } from '../../content/cards';
import { computerPortrait, profilePortrait } from '../people/host/portrait';
import { deadlineLine, gameOrder, type HomeInvite, type PersonGame } from '../people/host/games';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content = '') => {
  const node = document.createElement(tag); node.className = className; node.textContent = content; return node;
};
export const homeText = {
  yourGame: 'Your game', turn: 'Turn',
  types: { pieces: text.noPowers, powers: text.powersNote, cards: text.cardsNote, both: text.bothNote },
  startGame: 'Start game', side: 'Your side',
  // Launch decision 46: the levels stay; each line is true (runs/launch/opponent/report.md).
  levels: { casual: 'The easiest level. A good level for a first game.', clever: 'Much stronger than Friendly. It makes some mistakes.', club: 'The strongest level. Much stronger than Focused.' } as Record<Level, string>,
} as const;
export { typeName };
export const cardSummary = (pool: readonly string[]) => panelText.cardPoolLine(RELEASED_CARDS.filter(card => pool.includes(card.id)).map(card => card.name));
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
  onSignIn(source: HTMLButtonElement): void;
  showSignIn: boolean;
  previews: Map<string, string>;
}
/** Show three quiet rows until the player asks for the rest. */
export const gamesListView = (count: number, expanded: boolean) => ({ collapsed: count > 3 && !expanded, shown: expanded ? count : Math.min(3, count) });

export function playScreen(d: PlayData, art: Art): { element: HTMLElement; focus(): void } {
  const games = [...d.people].sort(gameOrder);
  const primary = d.resume ? undefined : games.find(game => game.state === 'playing' && game.preview);
  const hasGame = !!(d.resume || primary);
  const home = el('section', 'play-home'), hero = el('div', 'home-hero'), brand = el('header', 'home-brand');
  const title = el('h1', '', text.title); title.tabIndex = -1;
  brand.append(daylightCrown(), title);
  const picture = el('picture'), wide = el('source'), img = el('img');
  wide.media = hasGame ? '(min-aspect-ratio: 5/4), (min-width: 600px)' : '(min-aspect-ratio: 5/4), (min-width: 600px) and (max-height: 910px)';
  wide.srcset = '/interface/daylight-hero-wide-960.webp 960w, /interface/daylight-hero-wide-1672.webp 1672w';
  wide.sizes = '(min-aspect-ratio: 5/4) 70vw, 100vw';
  img.src = '/interface/daylight-hero-portrait-600.webp';
  img.srcset = '/interface/daylight-hero-portrait-600.webp 600w, /interface/daylight-hero-portrait-1122.webp 1122w';
  img.sizes = '100vw'; img.alt = ''; img.decoding = 'async'; img.fetchPriority = 'high';
  picture.append(wide, img); hero.append(picture, brand); home.append(hero);
  const signIn: HTMLButtonElement = button('Sign in', { kind: 'quiet', onPress: () => d.onSignIn(signIn) });
  signIn.classList.add('home-sign-in');
  signIn.setAttribute('aria-haspopup', 'dialog');
  signIn.hidden = !d.showSignIn;
  home.append(signIn);
  let x = 0, y = 0, drift: Effect | undefined;
  const driftTo = (toX: number, toY: number) => {
    if (reducedMotion()) return;
    drift?.cancel();
    const fromX = x, fromY = y;
    drift = tween(180, k => {
      x = fromX + (toX - fromX) * k; y = fromY + (toY - fromY) * k;
      picture.style.transform = `translate(${x}px, ${y}px)`;
    }, { done: () => { if (reducedMotion() || !toX && !toY) picture.style.removeProperty('transform'); } });
  };
  hero.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' && !event.buttons) return;
    const box = hero.getBoundingClientRect();
    driftTo(10 * (.5 - (event.clientX - box.left) / box.width), 8 * (.5 - (event.clientY - box.top) / box.height));
  });
  hero.addEventListener('pointerleave', () => driftTo(0, 0));
  hero.addEventListener('pointercancel', () => driftTo(0, 0));

  const start = el('div', 'home-start');
  const rows: { mine: boolean; deadline: string | null; state: PersonGame['state']; row: HTMLElement }[] = [];
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
      button('Accept', { onPress: () => d.onAcceptInvite?.(invite.id) }),
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
  const newGame = button(hasGame ? text.newGame : text.play, { kind: hasGame ? 'quiet' : 'main', onPress: () => d.onChange(newGame) });
  newGame.classList.add(hasGame ? 'home-side-new' : 'home-hero-new');
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
    const rules = local?.draft.game.context.rules ?? primary?.view.rules;
    const board = miniBoard(preview, code => rules ? art.figure(typeOf(code), colorOf(code), rules).src : art.symbol(code));
    if (rules) board.classList.add('mini-painted');
    card.append(board, seat); start.append(card);
    const resume = button(text.resume, { kind: 'main', onPress: () => {
      expandCard(card);
      if (local) d.onContinue(resume); else d.onPersonGame(primary!.id);
    } });
    resume.classList.add('home-continue');
    if (local) resume.dataset.saved = 'computer';
    else resume.dataset.game = primary!.id;
    main = resume; start.append(resume);
    rememberMove(d.previews, local ? 'computer' : primary!.id, preview, board);
  } else {
    card.classList.add('home-welcome');
    const summary = button(summaryLine(d.next), { icon: 'next', onPress: () => d.onChange(summary) });
    summary.classList.add('home-summary');
    card.append(newGame, summary, el('p', 'home-intro', `${text.intro} ${homeText.types[d.next.setup]}`)); start.append(card);
  }
  if (rows.length) {
    rows.sort(gameOrder);
    const state = d.gamesList ?? { expanded: false }, list = el('ul', 'home-game-list');
    list.id = 'your-games'; list.setAttribute('aria-label', text.yourGames);
    const draw = () => {
      const { collapsed, shown } = gamesListView(rows.length, state.expanded); list.dataset.collapsed = String(collapsed);
      list.replaceChildren(...rows.map(({ row }, i) => {
        const li = el('li'); li.hidden = i >= shown; li.append(row); return li;
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

function expandCard(card: HTMLElement): void {
  if (reducedMotion() || document.querySelector('.home-growing-card')) return;
  const box = card.getBoundingClientRect();
  const copy = card.cloneNode(true) as HTMLElement;
  copy.classList.add('home-growing-card'); copy.inert = true; copy.setAttribute('aria-hidden', 'true');
  document.body.append(copy);
  const draw = (k: number) => {
    Object.assign(copy.style, {
      left: `${box.left * (1 - k)}px`, top: `${box.top * (1 - k)}px`,
      width: `${box.width + (innerWidth - box.width) * k}px`,
      height: `${box.height + (innerHeight - box.height) * k}px`,
      opacity: String(1 - k ** 3),
    });
  };
  draw(0);
  tween(260, draw, { curve: ease.EASE, done: () => copy.remove() });
}
