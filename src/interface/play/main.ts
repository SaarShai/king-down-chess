import { kingDisplayName } from '../../king-label';
import '../ui/tokens.css';
import '../ui/components.css';
import './play.css';
import './shell.css';
import './sides.css';
import './menus.css';
import './reading-b.css';
import { historyGroups, historyPreview, removedHistoryLine, type HistoryLine } from './history';
import { mountShell, type Route } from './shell';
import { guidePage, closeGuidePanel } from './guide';
import { button, closeX, icon, confirmDialog, errorState, liveRegion, setButtonState, targetChoice } from '../ui/kit.js';
import { turnControls } from '../ui/turn-controls';
import type { Board, Move, Pace, Position } from '../board-api';
import { Game, Engine } from '../../game';
import { gameJSON, readSave } from '../../screen/save';
import { skillPlan } from '../../ai/skill';
import { learningEntry, firstMinute, stepLine, subjectKey, type LearnSubject } from './learning';
import { learningPanel } from './learning-panel';
import { markHintSeen, readHints, resetHints } from './hints';
import { refusalForTap } from './refusals';
import { lastReplySteps, replayController, undoReplayState, type ReplayStep } from './replay';
import { S, L, K, A, G, M, O, PLAIN_KINGS, colorOf, findKing, sqName, typeOf, TAG_POWER, type Color, type PowerTag, type Rules, type Status } from '../../rules/engine';
import { toFen } from '../../rules/setup';
import { RELEASED_CARDS } from '../../content/cards';
import { POWER_NAME, POWER_TAG, cardName, coinState, usesAllowed } from '../../powers-ui';
import { DraftTurn, isDirect, armKey } from './turn';
import { Arrangement, ARRANGE_KEY, pendingArrangement } from './arrange';
import { actorMarks, mergeMarks, previewMarks, resultMarks, stateMarks, type MarkAction } from './marks';
import { pieces, powerLines, text, sentence, draftSentences, squareLabel, effectEndLines, stateDescriptions, routeLine, versusLine, resultText } from './texts';
import { readingText, checkLines, selectionLines, armedStep, cancelLine, freeLine, opponentLines, choiceLabel, choicePrompt, spentName, readingBText, arrangeText } from './texts';
import { calm, cardFly, disarm, ms, screenChange, seal, shake, token, unseal, setInterfaceMotion, time } from './motion';
import { gameLayout, type Form } from './layout';
import { finishKind, fitReader, readerNodes, readerView, resetFit, sentences, type ReaderModel } from './reader';
import { answerOffer, beforeNewGame, GAME_KEY, gameType, keepCopy, keptOffer, levelOf, readStored, SaveWriter, SKILLS, snapshot, storeChoice as store, storedChoice as stored, storedGameType, type GameType as Setup, type KeptOffer, type Level } from './saved';
import { arrowStep, cellOf, fileLabelRow, rankLabelColumn, sideText, SIDE_CHOICES, SIDE_KEY, squareAt, type SideChoice } from './sides';
import { changeDraft, createDraft, OPTIONS_KEY, PANEL_KEY, readPanel, readOptions, rulesFor, startOf, type NewGameDraft } from './new-game';
import { levelName as computerName, newGamePanel, playScreen, type Art } from './home';
import { gameMenu, menuEnter, menuText, youPage, type Settings } from './menus';
import { allowedAvatarUrl } from '../../account/public-config';
import { computerPortrait, profilePortrait } from '../people/host/portrait';
import type { OnlineHost } from '../people/host/index';
import { ObsoleteAction } from '../people/server';
import type { PeopleState } from '../people/controller';
import { seatKingUnsaved } from '../people/seat-king';
import { homeInvite, personGame, personTurn, personWords } from '../people/host/games';
import { timeWords } from '../people/words';
import { runPoll } from '../../plugin/poll';
import { blockedPlayers, deleteAccount, playerOptions, playerSafety } from '../people/screens/safety';
import { humanOpponent } from '../../plugin/screens/board-model';


const root = document.querySelector<HTMLElement>('#app')!;
const live = liveRegion(); document.body.append(live.element);
let announcement = 0;
const engine = new Engine({ waitReady: true, workClock: true });
interface Resource { subject: LearnSubject; hint?: string; side: Color; key: string | null; name: string; short: string; card: number | null; control: HTMLButtonElement }
// The game type and options of the next game (owner playtest section 2). 'kingdown.setup' held 'cards' for powers and cards before the four types.
let setup: Setup = storedGameType();
let options = readOptions((() => { try { return JSON.parse(localStorage.getItem(OPTIONS_KEY) ?? 'null'); } catch { return null; } })()), resources: Resource[] = [], shown: Resource | null = null;
let pieceView = stored('kingdown.piece-view', ['figures', 'symbols']), handView = stored('kingdown.hand', ['hand', 'ribbon']);
// The next game's side choice, and the side of the live game (launch decision 10). The computer plays the other side.
let sideChoice = stored(SIDE_KEY, SIDE_CHOICES) as SideChoice, player: Color = 0;
const cpu = () => (player ^ 1) as Color;
const fresh = () => firstMinute(draft, player);
/** A page fault with one safe next step (launch decision 12): the art, or the computer's move. */
let fault: 'art' | 'computer' | null = null;
// The four stored choices use the shared save fields.
const first = readStored(), kept = first.settings;
let level: Level = first.save || kept.skill !== undefined ? levelOf(kept.skill) : 'casual';
let motion: Pace = kept.pace === 'normal' || kept.pace === 'fast' || kept.pace === 'off' ? kept.pace : matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'normal';
let coords = typeof kept.coords === 'boolean' ? kept.coords : true, sound = typeof kept.sound === 'boolean' ? kept.sound : false;
// The board code (the renderer and the sounds) loads when a game starts or continues, or in idle time after home
// shows (launch decision 45): home does not wait for it.
let boardCode: typeof import('../board-api') | undefined, sfx: typeof import('../../render/sfx') | undefined, codeLoad: Promise<void> | undefined;
// The 56 kB stone board picture starts with the board code;
// the board then takes the same request (the same image mode).
const SKIN = '/interface/stone-refined-light.webp';
let skinUrl = SKIN;
const firstArt = new Set<string>();
let skinLoad: HTMLImageElement | undefined;
// After a failed load the next try fetches the module files again first: WebKit keeps a failed module in its memory
// cache across a reload (the boot fault of next.html does the same).
let codeFailed = false;
const refetchCode = () => Promise.race([Promise.all([...document.querySelectorAll<HTMLLinkElement>('link[rel=modulepreload]')].map(link => fetch(link.href, { cache: 'reload' }).catch(() => {}))), new Promise(done => setTimeout(done, 4000))]);
const loadBoardCode = () => { if (!skinLoad) { skinLoad = new Image(); skinLoad.fetchPriority = 'high'; skinLoad.src = SKIN; } return codeLoad ??= (codeFailed ? refetchCode() : Promise.resolve())
  .then(() => Promise.all([import('../board-api'), import('../../render/sfx')]))
  .then(([b, s]) => { boardCode = b; sfx = s; s.setSound(sound); }, error => { codeLoad = undefined; codeFailed = true; throw error; }); };
// Sound unlocks on the first press after the sound code is loaded.
const unlock = () => { if (sound && sfx) { sfx.unlockSound(); document.removeEventListener('pointerdown', unlock, true); document.removeEventListener('keydown', unlock, true); } };
document.addEventListener('pointerdown', unlock, true); document.addEventListener('keydown', unlock, true);
// `next` is the next game (its army, kings, cards and side, launch decision 26); `game` stays the live game, so
// Continue can open it when it could not save.
let next: NewGameDraft = createDraft({ setup, level, sideChoice, options }), game = next.game, draft = new DraftTurn(game), board: Board | undefined;
let arrangement: Arrangement | undefined, arrangementGame = '';
let gameLevel: Level = level, resigned: Color | null = null, liveGame = false;
const writer = new SaveWriter(line => { if (document.body.dataset.page === 'game') refuse(line); else announce(line); });
const prefs = () => ({ skill: SKILLS[gameLevel], coords, sound, pace: motion });
/** Write the live game: its handed-over plies and its whole staged steps (decision 2). */
const save = (step: boolean) => onlineActive ? void people?.saveDraft() : writer.game(snapshot(draft, resigned, player), prefs(), step);
let selected: number | null = null, inspected: number | null = null, cursor = 12;
let thinking = false, ended = false, generation = 0, reading: 'normal' | 'rule' | 'menu' | 'result' = 'normal';
// The opening (Roll call) while it runs; the end of a computer reply while its playback runs; a start in progress.
let opening: { end(): void } | null = null, endReply: (() => void) | null = null, starting = 0, endVersus: (() => void) | null = null;
let endCardFlight = () => {}, checkFrame = 0, checkPulse: { square: number; at: number } | null = null;
let selectTaps = 0, symbolsHint = false;
let lastActions: MarkAction[] = [], playingAction: MarkAction | null = null, markFocus: number | undefined, nextMarksAt = 0;
// The last input was a key: only keyboard focus on a square gives the candidate sentence (reading decision 22).
let keyed = false;
document.addEventListener('keydown', () => { keyed = true; }, true); document.addEventListener('pointerdown', () => { keyed = false; }, true);
let replySteps: ReplayStep[] = [];
const boardReplay = replayController();
let learning: { subject: LearnSubject; side: Color; cardIndex?: number } | null = null, panel: ReturnType<typeof learningPanel> | null = null;
let panelReturn: HTMLElement | null = null, ruleAnchor: DOMRect | null = null, ruleReturnLabel = '';
let last = '', notice = '', resultCause = '', choice: Move[] = [], choiceSquare = -1;
// The effect groups that the player opened, for this visit only (reading decision 18).

// Stage "readingb": the form of the layout, the persistent reader nodes, the open effects summary (its subject key),
// the computer's card group, and the computer's text while its reply plays.
let form: Form = 'tall', nodes = readerNodes(), rivalGroup: Resource | null = null, acting = '';
let screen: HTMLElement, boardBox: HTMLElement, boardHost: HTMLElement, reader: HTMLElement, detail: HTMLElement, choiceBox: HTMLElement;
let cells: HTMLButtonElement[] = [], choiceCancel: HTMLButtonElement;
let menuButton: HTMLButtonElement;
let historyStrip: HTMLElement, historyButton: HTMLButtonElement, scrollPanel: HTMLElement;
let scrollOpen: 'history' | null = null, floatingSource: HTMLElement | null = null, swallowedPointer = false;
let erased: HistoryLine | undefined, eraseTimer: ReturnType<typeof setTimeout> | undefined;
let stopPortrait = () => {};

let controls: ReturnType<typeof turnControls>;
let resignDialog: ReturnType<typeof confirmDialog>;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content = '') => {
  const node = document.createElement(tag); node.className = className; node.textContent = content; return node;
};
const nameOf = (code: number) => pieces[typeOf(code)]?.name ?? '';
// An <img> cannot read page CSS, so each symbol gets the existing game's army colours (APP/src/style.css:160-161) in its own copy.
const ARMY = [{ disc: '#fffcf4', ring: '#2b2621', glyph: '#2b2621' }, { disc: '#4a4850', ring: '#6e6a74', glyph: '#f3ead7' }];
const svgText = new Map<string, string>(), symbolImages = new Map<number, HTMLImageElement>();
function symbol(code: number): string {
  const file = `/ui/icons/${nameOf(code).toLowerCase()}.svg`, svg = svgText.get(file), army = ARMY[colorOf(code)];
  return svg ? `data:image/svg+xml,${encodeURIComponent(svg.replace('<svg ', '<svg width="96" height="96" ').replace('var(--pi-disc,#bccac8)', army.disc).replace('var(--pi-ring,currentColor)', army.ring).replaceAll('var(--pi-glyph,currentColor)', army.glyph))}` : file;
}
/** A full figure: the board's own rest still (public/ui/pieces), so one piece looks the same everywhere. */
const figure = (file: string) => { const img = el('img', 'play-figure'); img.src = `/ui/pieces/${file}.webp`; img.alt = ''; return img; };
const kingFile = (side: Color, rules: Pick<Rules, 'kings'> = game.context.rules) => `king-${(rules.kings[side]?.king ?? PLAIN_KINGS[side]).toLowerCase()}-${side ? 'b' : 'w'}`;
const levelName = (of = level) => computerName(of);
const image = (code: number) => { const img = el('img'); img.src = symbol(code); img.alt = ''; return img; };
const symbolImage = (code: number) => symbolImages.get(code & 31) ?? image(code);
const symbolLoad = new AbortController();
// A cancelled fetch during navigation must not start a fallback image in the departing page.
for (const event of ['beforeunload', 'pagehide']) addEventListener(event, () => symbolLoad.abort(), { once: true });
const symbolsReady = Promise.all(Object.keys(pieces).map(async type => {
  if ((window as Window & { kdLeaving?: boolean }).kdLeaving) return;
  const file = `/ui/icons/${pieces[+type].name.toLowerCase()}.svg`;
  try { svgText.set(file, await (await fetch(file, { signal: symbolLoad.signal })).text()); } catch { /* the plain file stays as a fallback */ }
  if (symbolLoad.signal.aborted) return;
  await Promise.all([0, 16].map(color => { const img = image(+type | color); symbolImages.set(+type | color, img); return img.decode().catch(() => {}); }));
}));
const cards = (side: Color) => game.context.rules.hands[side].length > 0;
let liveTimer: ReturnType<typeof setTimeout> | undefined;
/** One live region. A new event with the same words clears it first, so a screen reader reads it again. */
function announce(message: string) {
  message = gameWords(message);
  announcement++; clearTimeout(liveTimer);
  if (live.element.textContent === message) { live.clear(); liveTimer = setTimeout(() => live.announce(message), 60); } else live.announce(message);
}
function refuse(message: string, square?: number) {
  notice = message;
  if (square != null) { const cell = cells[square]; cell.classList.remove('square-error'); void cell.offsetWidth; cell.classList.add('square-error'); }
  update(); if (controls) shake(detail.querySelector<HTMLElement>('.play-notice') ?? nodes.title.closest('h2') ?? controls.help); announce(message);
}
/** The choices that the person accepted: the stored setup and side choice, and the level of the saved game. */
const accepted = () => ({ setup, level, sideChoice, options });
/** The result card's New game opens the New game panel on Play. */
let panelNext = false;
const gamesList = { expanded: false };
const art: Art = {
  figure: (type, side, rules) => figure(type === K ? kingFile(side, rules) : `${pieces[type].name.toLowerCase()}-${side ? 'b' : 'w'}`),
  symbol,
  card: k => { const img = el('img'); img.src = `/${RELEASED_CARDS[k].art}`; img.alt = ''; return img; },
};
let people: OnlineHost | undefined, peopleReady: Promise<OnlineHost> | undefined, onlineActive = false, onlineState: PeopleState | undefined;
let homePoll: ReturnType<typeof runPoll> | undefined;
function gameWords(line: string) { return onlineActive ? personWords(line) : line; }
let mountingOnline = false, shownRevision = -1, onlineNote = '';
let onlineGameNotice: { id: string; line: string; revision?: number } | undefined;
const automaticReadyAt = new Map<string, number>();
function automaticReady(state: PeopleState) {
  const view = state.view;
  if (state.phase !== 'setup' || arrangement || !view || view.ready?.[view.seat] || view.seat === 1 && view.ready?.[0] === false) return;
  const now = performance.now();
  if (now - (automaticReadyAt.get(view.game_id) ?? -Infinity) < 4000) return;
  // Record before Ready: even an offline refusal can emit in this stack.
  automaticReadyAt.set(view.game_id, now);
  void people?.controller?.ready();
}
async function loadPeople() {
  return peopleReady ??= import('../people/host/index').then(async ({ onlineHost }) => {
    people = onlineHost({ rules: () => setup, setRules: value => { setup = value; next = changeDraft(next, { setup }); store(GAME_KEY, setup); },
      changed: () => { if (document.body.dataset.page === 'home' && shell.route.place === 'play') home(); if (people) showAccount(people); },
      home: () => { onlineActive = false; shell.go({ place: 'play' }); if (document.body.dataset.page === 'game') home(); },
      open: (id, line) => { onlineGameNotice = line ? { id, line } : undefined; shell.go({ place: 'online', entry: id }); },
      toast: message => { onlineNote = message; announce(message); const line = root.querySelector<HTMLElement>('.home-note'); if (line) line.textContent = message; else if (document.body.dataset.page === 'home') root.querySelector('.home-start')?.prepend(el('p', 'home-note', message)); },
    });
    const returned = await people.init();
    if (returned.status === 'signed-in') {
      const route = returned.route;
      shell.go(route.screen === 'join' ? { place: 'join', entry: route.key ?? '' } : route.screen === 'game' ? { place: 'online', entry: route.gameId } : { place: 'person' });
    } else if (returned.status === 'retry') { onlineNote = 'Sign-in does not finish. Try again.'; shell.go({ place: 'person' }); }
    return people;
  }).catch(error => { peopleReady = undefined; onlineNote = 'Online play cannot load. Check your connection and try again.'; announce(onlineNote); throw error; });
}
async function personFlow(source: HTMLElement | null = null) {
  if (shell.route.place !== 'play') shell.go({ place: 'play' });
  openNewGame(source ?? root.querySelector<HTMLElement>('.home-top-new, .home-side-new, .home-hero-new') ?? root, true);
}
async function openOnline(id: string) {
  if (onlineGameNotice?.id !== id) onlineGameNotice = undefined;
  onlineActive = true; onlineState = undefined; shownRevision = -1; arrangement = undefined; arrangementGame = '';
  boardReplay.cancel(); generation++; engine.cancel(); endOpening(); endEntry(); board?.dispose(); board = undefined;
  document.body.dataset.page = 'game'; root.replaceChildren(el('p', 'people-loading', 'Loading your game…'));
  try { const host = await loadPeople(); if (!onlineActive || shell.route.entry !== id) return; await host.open(id, receiveOnline); }
  catch { root.replaceChildren(el('p', 'people-loading', onlineNote), button(text.home, { onPress: () => shell.go({ place: 'play' }) })); }
}
function receiveOnline(state: PeopleState) {
  if (!onlineActive) return;
  const previousStatus = onlineState?.view?.status;
  onlineState = state;
  if (previousStatus === 'setup' && state.view?.status === 'playing' && board) {
    board.dispose(); board = undefined; shownRevision = -1;
  }
  if (state.view?.status === 'setup' && state.view.options?.arrangement && state.view.draw) {
    if (arrangementGame !== state.view.game_id) {
      arrangementGame = state.view.game_id;
      arrangement = new Arrangement(state.view.draw, state.view.seat, state.view.choices?.[state.view.seat]?.order ?? state.view.draw, state.view.setup_admission);
    }
  } else { arrangement = undefined; arrangementGame = ''; }
  if (state.view?.status === 'aborted') {
    endOpening(); endEntry(); board?.dispose(); board = undefined; liveGame = false; ended = true; thinking = false;
    const page = el('section', 'people-landing'), title = el('h1', '', onlineResult(state)); title.tabIndex = -1;
    page.append(title, button(text.home, { kind: 'main', onPress: () => shell.go({ place: 'play' }) }));
    if (people && humanOpponent(state.view)) page.append(...playerSafety(people.safety, { game_id: state.view.game_id }, () => { void people?.refresh(); }));
    root.replaceChildren(page); title.focus({ preventScroll: true }); return;
  }
  if (state.view && (state.phase === 'waiting' || state.phase === 'setup' && !arrangement) && !board) {
    const invited = state.phase === 'waiting' && state.view.invitation?.direction === 'outgoing' ? state.view.invitation.player : null;
    const box = el('section', 'online-waiting');
    const line = takeOnlineNotice(state); if (line) box.append(el('p', 'play-notice', line));
    box.append(el('h1', '', state.phase === 'waiting' ? invited ? `Invite sent to ${invited.handle}` : 'Waiting for a player' : 'Getting the game ready'), onlineActions(state), button(text.home, { onPress: () => shell.go({ place: 'play' }) }));
    if (people && humanOpponent(state.view)) box.append(...playerSafety(people.safety, { game_id: state.view.game_id }, () => { void people?.refresh(); }));
    root.replaceChildren(box);
    automaticReady(state);
    return;
  }
  if (!state.game || !state.view || state.phase === 'gone' || state.phase === 'account' || state.phase === 'failed') { void onlineRecovery(state); return; }
  if (!board && !mountingOnline) {
    mountingOnline = true;
    void start({ game: state.game, draft: state.draft ?? new DraftTurn(state.game), player: state.view.seat, level: gameLevel }).finally(() => { mountingOnline = false; if (onlineActive && onlineState) receiveOnline(onlineState); });
    return;
  }
  if (!board || mountingOnline) return;
  const previousRevision = shownRevision, changed = shownRevision !== state.view.revision;
  notice = takeOnlineNotice(state);
  game = state.game; draft = state.draft ?? new DraftTurn(game); player = state.view.seat;
  thinking = !state.draft || state.phase === 'sending' || state.phase === 'checking';
  const wasEnded = ended; ended = state.phase === 'over'; liveGame = false;
  if (changed) {
    shownRevision = state.view.revision; selected = inspected = null; shown = null; clearChoice(); skipBoard();
    board.setPosition(draft.position, game.context); replySteps = state.received?.steps ?? lastReplySteps(game, cpu());
    const h = game.history; let i = h.length; const side = h.at(-1)?.pos.turn; while (i > 0 && h[i - 1].pos.turn === side) i--;
    lastActions = draft.length ? [...draft.steps] : turnActions(i); last = turnText(i, side !== player);
  }
  if (ended) { resultCause = onlineResult(state); if (!wasEnded || reading !== 'menu') reading = 'result'; if (changed) detail.dataset.mode = ''; }
  else if (reading === 'result') reading = 'normal';
  update();
  if (changed && previousRevision >= 0) announce(arrangementWaiting() ? arrangeText.wait : ended ? resultCause : state.draft ? `${replyText()} Your turn.` : state.sent ? 'Turn sent. Your opponent now plays.' : 'The game changes.');
  void onlineRecovery(state);
  automaticReady(state);
}
/** Keep the local save line until board input, a saved king or a new play revision; a server notice takes priority. */
function takeOnlineNotice(state: PeopleState): string {
  if (onlineGameNotice && state.view && people?.userId && !seatKingUnsaved(localStorage, people.userId, state.view)) onlineGameNotice = undefined;
  if (onlineGameNotice?.revision != null && onlineGameNotice.revision !== state.view?.revision) onlineGameNotice = undefined;
  if (onlineGameNotice && state.view?.status === 'playing') onlineGameNotice.revision ??= state.view.revision;
  const server = state.notice?.message ?? (state.notice?.kind === 'stale' ? 'The game changes. Check your turn, then send it.' : state.notice?.kind === 'illegal' ? 'This turn cannot play. Undo it, then choose again.' : state.notice?.kind === 'draw-declined' ? 'Your opponent keeps playing.' : state.notice?.kind === 'offline' ? 'You are offline. Your unsent turn stays.' : '');
  if (server || state.view?.status === 'setup') return server;
  const saved = onlineGameNotice?.line;
  if (state.view?.status !== 'playing') onlineGameNotice = undefined;
  return saved ?? '';
}
const onlineResult = (state: PeopleState) => state.view?.status === 'aborted' ? 'The game ends with no result.' : state.view?.result?.winner == null ? 'Draw.' : state.view.result.winner === state.view.seat ? 'You win.' : `${state.opponent?.handle ?? 'The opponent'} wins.`;
async function onlineRecovery(state: PeopleState) {
  const host = people; if (!host || !onlineActive) return;
  const { recoveryPanel, signInAgain } = await import('../people/screens/recovery');
  if (!onlineActive || onlineState !== state) return;
  root.querySelector('.online-recovery')?.remove();
  if (state.connection === 'auth') {
    if (!state.view) {
      const recovery = el('section', 'online-recovery'); recovery.dataset.state = 'auth';
      recovery.append(el('h2', '', 'Sign in again'), el('p', '', 'Your game stays saved.'), button('Sign in again', { kind: 'main', onPress: () => { if (onlineState) void onlineRecovery(onlineState); } }), button(text.home, { onPress: () => shell.go({ place: 'play' }) })); root.append(recovery);
    }
    if (!document.querySelector('.people-sheet')) signInAgain(host.host, () => { void host.signIn().then(() => { if (onlineActive && shell.route.place === 'online') return host.controller ? host.controller.signedIn() : openOnline(shell.route.entry!); }); }, menuButton);
    return;
  }
  const kind = state.phase === 'gone' ? 'gone' : state.phase === 'account' ? 'account' : state.phase === 'failed' || state.connection === 'down' ? 'down' : null;
  if (screen?.isConnected) { screen.inert = !!kind; screen.setAttribute('aria-hidden', String(!!kind)); }
  if (kind) {
    const panel = recoveryPanel(kind, { toPlay: () => shell.go({ place: 'play' }), switchAccount: () => { void host.signOut().then(() => personFlow()); }, retry: () => { void (host.controller?.state().view ? host.controller.refresh() : openOnline(shell.route.entry!)); } }, host.host.me()?.handle ?? '');
    if (kind === 'down') panel.append(button(text.home, { onPress: () => shell.go({ place: 'play' }) }));
    panel.classList.add('online-recovery'); root.append(panel);
  }
}
function onlineActions(state: PeopleState): HTMLElement {
  const block = el('section', 'online-actions');
  if (state.connection === 'auth') {
    block.append(el('p', '', 'Your turn stays on this device.'), button('Sign in again', { kind: 'main', onPress: () => { if (onlineState) void onlineRecovery(onlineState); } }));
    return block;
  }
  if (state.phase === 'checking') block.append(el('p', '', 'The turn needs a check. Your unsent turn stays.'), button('Check again', { onPress: () => { void people!.controller!.check(); } }), ...(state.check?.canDiscard ? [button('Discard send', { onPress: () => { void people!.controller!.discard(); } })] : []));
  else if (state.claim) block.append(button(state.claim === 'win' ? 'Claim win' : 'End game', { onPress: () => { void people!.controller!.claim(); } }));
  else if (state.draw === 'theirs') block.append(el('p', '', 'Your opponent offers a draw.'), button('Accept draw', { onPress: () => { void people!.controller!.answerDraw(true); } }), button('Keep playing', { onPress: () => { void people!.controller!.answerDraw(false); } }));
  if (state.phase === 'waiting') {
    const invited = state.view?.invitation?.direction === 'outgoing' ? state.view.invitation.player : null;
    if (invited) block.append(el('p', '', `The game starts when ${invited.handle} accepts.`), button('Cancel invite', { onPress: () => { void people!.controller!.abort().then(() => people?.refresh()).catch(() => announce('The invite cannot cancel. Try again.')); } }));
    else block.append(el('p', '', 'The game starts when a player joins.'), button('Copy link', { onPress: () => { void people!.copyLink(state.view!.game_id).then(() => announce('Link copied.')).catch(() => announce('The link cannot copy. Try again.')); } }), button('Cancel game', { onPress: () => { void people!.controller!.abort().then(() => people?.refresh()).catch(() => announce('The game cannot end. Try again.')); } }));
  }
  return block;
}
/** A new game from Play: copy a save that cannot open, then start the shown candidate. */
const beginNew = (source?: HTMLButtonElement) => { void start(undefined, source); };
function home(newArmy = false) {
  stopPortrait();
  if (shell.route.place !== 'play') { if (newArmy) next = createDraft(accepted()); shell.go({ place: 'play' }); return; }
  const enteringHome = document.body.dataset.page !== 'home';
  const active = document.activeElement as HTMLElement | null;
  let focused: string | undefined;
  if (!enteringHome && active && root.contains(active)) {
    const name = ['home-person', 'home-top-new', 'home-side-new', 'all-games'].find(name => active.classList.contains(name));
    focused = active.dataset.game ? `[data-game="${active.dataset.game}"]` : active.dataset.kind === 'computer' ? '[data-kind="computer"]' : name ? `.${name}` : undefined;
  }
  onlineActive = false; onlineState = undefined; people?.stopGame();
  closeLearning(false); closeGuidePanel();
  boardReplay.cancel(); generation++; engine.cancel(); endOpening(); endEntry(); endCardFlight(); cancelCheckPulse(); endReply = null;
  // The game screen slides away over the home screen; its board goes when it has left.
  board?.skip();
  const old = root.querySelector<HTMLElement>('.play-game'), oldBoard = board; board = undefined;
  if (old) old.inert = true;
  thinking = false; ended = false; fault = null; document.body.dataset.page = 'home';
  // Continue: the stored game, or the game in memory when its last write failed (decisions 3, 5 and 8).
  const saved = readStored(), memory = inMemory();
  const resume = memory ? { game, draft, level: gameLevel, player } : saved.resume ? { ...saved.resume, level: levelOf(saved.save!.skill) } : null;
  if (resume) level = resume.level; // the level of the next game starts at the saved game's level; it is written only when a new game starts
  next = newArmy ? createDraft(accepted()) : changeDraft(next, accepted());
  const copy = saved.kind === 'kept' ? keepCopy(saved.raw) : null;
  const status = saved.kind === 'blocked' || copy === 'failed' ? text.cannotSave : copy === 'full' ? text.keptFull : copy === 'copied' || copy === 'already' ? text.kept : '';
  if (enteringHome) void people?.refresh();
  const play = playScreen({
    resume, next, gamesList, status: [status, onlineNote].filter(Boolean).join(' '),
    people: people?.views.filter(view => view.status !== 'aborted' || !!view.history?.actions?.length).map(personGame) ?? [],
    invites: people ? [...people.incomingInvites, ...people.inviteUpdates].map(invite => homeInvite(invite)) : [],
    onPersonGame: id => shell.go({ place: 'online', entry: id }),
    onAcceptInvite: id => { const invite = people?.incomingInvites.find(row => row.invite_id === id); if (invite) void people!.acceptInvite(invite).catch(error => { if (error instanceof ObsoleteAction) return; onlineNote = 'The invite cannot accept right now. Try again.'; announce(onlineNote); void people?.refresh(); home(); }); },
    onDeclineInvite: id => { const invite = people?.incomingInvites.find(row => row.invite_id === id); if (invite) void people!.declineInvite(invite).catch(() => { onlineNote = 'The invite cannot decline right now. Try again.'; announce(onlineNote); void people?.refresh(); home(); }); },
    onInvitePlayer: (id, source) => {
      const invite = people?.incomingInvites.find(row => row.invite_id === id);
      if (people && invite?.player) {
        playerOptions(people.safety, { user_id: invite.player.user_id }, source, () => { void people?.refresh(); });
      }
    },
    onDismissInvite: id => { const invite = people?.inviteUpdates.find(row => row.invite_id === id); if (invite) people!.dismissInvite(invite); },
    offer: fallback => { const offer = keptOffer(saved); return offer ? keptRow(offer, fallback) : null; },
    onContinue: source => resumeGame(source, memory),
    onChange: source => openNewGame(source),
    onRule: type => shell.go({ place: 'guide', section: 'Pieces', entry: String(type) }),
  }, art);
  root.replaceChildren(play.element, ...(old ? [old] : []));
  if (enteringHome) play.focus(); else if (focused) play.element.querySelector<HTMLElement>(focused)?.focus({ preventScroll: true });
  homePoll?.update();
  const count = (resume && (resume.draft.length || resume.game.pos.turn === resume.player) ? 1 : 0) + (people?.views.filter(view => view.action === 'ready' && view.status === 'playing').length ?? 0) + (people?.incomingInvites.length ?? 0);
  const tab = document.querySelector<HTMLElement>('.shell-nav a[href="#play"]'); tab?.querySelector('.home-count')?.remove();
  if (count && tab) { const countMark = el('span', 'home-count', String(count)); countMark.setAttribute('aria-label', `${count} games wait for your move`); tab.append(countMark); }

  if (old) void screenChange(old, play.element, true).then(() => { old.remove(); oldBoard?.dispose(); }); else oldBoard?.dispose();
  if (panelNext) { panelNext = false; openNewGame(play.element.querySelector<HTMLButtonElement>('.kd-button[data-kind="main"]') ?? play.element); }
}
/** The New game panel (launch decision 26). Its edits stay in the panel until Start game. */
function openNewGame(source: HTMLElement, person = false) {
  // Close, then New game at once: the panel opens after the pending Back. A late invite reply can leave Play meanwhile.
  shell.settled(() => { if (shell.route.place === 'play') newGameLayer(source, person); });
}
function newGameLayer(source: HTMLElement, person: boolean) {
  if (document.querySelector('dialog.new-game-panel')) return; // one panel: a second queued open does nothing
  const memory = (() => { try { return readPanel(JSON.parse(sessionStorage.getItem(PANEL_KEY) ?? 'null')); } catch { return null; } })();
  const candidate = changeDraft(next, accepted());
  const panel = newGamePanel({
    next: candidate,
    memory: memory ?? (person ? { ...accepted(), opponent: 'person', section: null } : null),
    people: async () => (await loadPeople()).host,
    remember: value => { try { if (value) sessionStorage.setItem(PANEL_KEY, JSON.stringify(value)); else sessionStorage.removeItem(PANEL_KEY); } catch { /* The current panel still keeps its draft. */ } },
    onStart: async draft => {
      await shell.closeLayer();
      // A late invite reply can open the online game during that wait: the local start then stops.
      if (shell.route.place !== 'play') return;
      next = draft; beginNew(root.querySelector<HTMLButtonElement>('.play-home .kd-button[data-kind="main"]') ?? undefined);
    },
    onInvite: draft => {
      next = draft; ({ setup, level, sideChoice, options } = draft);
      store(GAME_KEY, setup); store(OPTIONS_KEY, JSON.stringify(options)); home();
    },
    onClose: () => { void shell.closeLayer(); },
  }, art);
  // The panel is outside #app: a background refresh of Play (home()) redraws #app and must not remove the open panel.
  // A refresh can replace the opener: focus then returns to the same control on the new Play, or to its visible
  // New game control when the first game or invite replaces the large New game.
  const controls = ['home-top-new', 'home-side-new', 'home-hero-new'], opener = controls.find(name => source.classList.contains(name));
  panel.element.addEventListener('close', () => {
    panel.element.remove();
    if (!source.isConnected && opener && document.body.dataset.page === 'home') [opener, ...controls].map(name => root.querySelector<HTMLElement>(`.${name}`)).find(control => control?.getClientRects().length)?.focus({ preventScroll: true });
  });
  document.body.append(panel.element); panel.open(source); shell.openLayer(() => panel.close());
}
/**
 * The offer of a kept Dark game (launch decision 10): Open makes it the saved game, after a confirmation when it ends
 * another game; Not now answers it. Both read the stored data again at the press.
 */
function keptRow(offer: KeptOffer, fallback: HTMLButtonElement): HTMLElement {
  const row = el('div', 'home-offer'), line = el('p', '', sideText.offer);
  const promote = (source: HTMLButtonElement) => {
    const now = keptOffer(readStored()); if (!now || now.raw !== offer.raw) { home(); return; }
    writer.replace(); gameLevel = levelOf(now.save.skill); player = now.resume.player; ({ game, draft } = now.resume);
    if (writer.game(snapshot(draft, null, player), prefs(), true)) answerOffer(now.raw);
    liveGame = false; void start({ ...now.resume, level: gameLevel }, source);
  };
  const open: HTMLButtonElement = button(sideText.open, { onPress: () => {
    const now = readStored(), again = keptOffer(now);
    if (!again || again.raw !== offer.raw) { home(); return; }
    if (now.kind === 'resume' || inMemory()) ask.open(open); else promote(open);
  } });
  const later = button(sideText.notNow, { onPress: () => { answerOffer(offer.raw); row.remove(); fallback.focus(); } });
  const ask = confirmDialog({ title: sideText.openTitle, consequence: text.newCause, action: sideText.open, cancel: text.keepGame, fallback, onConfirm: () => promote(open) });
  row.append(line, open, later, ask.element); return row;
}
/** Continue: the game in memory, or the stored game read again at the press. A save that cannot open stays on the home screen. */
function resumeGame(source: HTMLButtonElement, memory: boolean) {
  if (memory) { void start({ game, draft, level: gameLevel, player }, source); return; }
  const now = readStored();
  if (!now.resume) { home(); return; }
  writer.load(now.save);
  void start({ ...now.resume, level: levelOf(now.save!.skill) }, source);
}
const inMemory = () => liveGame && writer.lost && !writer.blocked && (game.history.length > 0 || draft.length > 0 || !!arrangement || game.backRank === '');
function endEntry() { starting = 0; endVersus?.(); endVersus = null; }
/** A new game (Play, New game, Rematch), or a resumed game at rest: no Versus and no Roll call. `from`: the home button that started it. */
async function start(resumed?: { game: Game; draft: DraftTurn; level: Level; player: Color }, from?: HTMLButtonElement, retry = false) {
  if (starting) return;
  // Keep the accepted game identity through the code load. Settings alone do not need a new choice.
  const acceptedSave = readSave(), identity = acceptedSave.unreadable ? acceptedSave.raw : gameJSON(acceptedSave.save);
  if (!boardCode) {
    // Start the first frame's images beside the board code, in the scene's image modes.
    const position = resumed?.draft.position ?? next.game.pos, rules = resumed?.game.context.rules ?? next.game.context.rules;
    const files = [skinUrl, ...[...new Set(position.board)].filter(Boolean).map(code => `/ui/pieces/${typeOf(code) === K ? kingFile(colorOf(code), rules) : `${nameOf(code).toLowerCase()}-${colorOf(code) ? 'b' : 'w'}`}.webp`)];
    for (const href of files) if (!firstArt.has(href)) {
      const link = document.createElement('link'); link.rel = 'preload'; link.as = 'image'; link.href = href;
      link.fetchPriority = 'high'; document.head.append(link); firstArt.add(href);
    }
    // The press waits for the board code; a second press, or a move to another place, ends this start.
    const place = shell.route.place;
    root.querySelector('.home-load-fault')?.remove();
    if (from) setButtonState(from, { busy: true });
    try { await loadBoardCode(); } catch {
      if (from) setButtonState(from, { busy: false });
      const home = root.querySelector('.home-start');
      if (home && shell.route.place === place) home.prepend(el('p', 'home-note home-load-fault', text.loadFailed));
      announce(text.loadFailed); return;
    }
    if (starting || shell.route.place !== place) return;
  }
  if (!resumed) {
    const current = readSave();
    if ((current.unreadable ? current.raw : gameJSON(current.save)) !== identity) { home(); return; }
    beforeNewGame(writer);
    if (writer.blocked) { home(); return; }
  }
  const fromHome = document.body.dataset.page !== 'game', homeScreen = root.querySelector<HTMLElement>('.play-home');
  closeLearning(false); closeGuidePanel();
  boardReplay.cancel(); generation++; const own = generation; engine.cancel(); endOpening(); endEntry(); endCardFlight(); cancelCheckPulse(); endReply = null;
  // A rematch keeps the board and its loaded art: no new load, so no empty frame.
  const keep = fromHome ? undefined : board;
  if (!keep) { board?.dispose(); board = undefined; }
  const memory = resumed?.game === game && liveGame;
  if (resumed) { ({ game, draft } = resumed); level = gameLevel = resumed.level; setup = gameType(game.rules); player = resumed.player; }
  else {
    // A new game takes the shown candidate: its army, kings, cards and side (Random drew when it was made). Rematch swaps the sides.
    if (fromHome) { ({ setup, level, sideChoice, options } = next); player = next.player; store(SIDE_KEY, sideChoice); store(OPTIONS_KEY, JSON.stringify(options)); } else player = cpu();
    // A rematch plays the same army, or the same first position for a game from a position.
    const source = fromHome ? next.game : game;
    game = fromHome ? startOf(next) : new Game(source.backRank || undefined, rulesFor(setup, Math.random, options, player)); draft = new DraftTurn(game); gameLevel = level;
    if (!source.backRank) game.load(game.context.fromFen(toFen(source.history[0]?.pos ?? source.pos)));
    store(GAME_KEY, setup);
    if (fromHome) next = createDraft(accepted());
  }
  erased = undefined; clearTimeout(eraseTimer);
  if (!onlineActive) {
    onlineGameNotice = undefined;
    arrangement = resumed ? memory ? arrangement : pendingArrangement(localStorage, game, player) : options.arrangement === 'manual' ? new Arrangement(toFen(game.pos).split(' ')[0].split('/')[player ? 0 : 7].toUpperCase(), player) : undefined;
    if (!resumed) {
      if (arrangement) store(ARRANGE_KEY, JSON.stringify({ army: arrangement.army, side: player, fen: toFen(game.pos) }));
      else store(ARRANGE_KEY, 'null');
    }
  }
  resources = []; shown = null; replySteps = []; resigned = null; liveGame = true; selectTaps = 0; symbolsHint = false;
  ended = false; fault = null; thinking = arrangement ? false : onlineActive ? !onlineState?.draft : game.pos.turn === cpu() && game.status === 'playing'; cursor = arrangement ? player ? 63 : 0 : player ? 52 : 12;
  selected = inspected = null; choice = []; reading = 'normal'; last = ''; lastActions = []; playingAction = null; markFocus = undefined; nextMarksAt = 0; notice = ''; resultCause = '';
  if (resumed) {
    // The last handed-over turn shows in the reading area and in the marks.
    const h = game.history, side = h.at(-1)?.pos.turn; let i = h.length;
    while (i > 0 && h[i - 1].pos.turn === side) i--;
    if (h.length) { last = turnText(i, side === cpu()); lastActions = turnActions(i); }
    replySteps = lastReplySteps(game, cpu());
    if (draft.steps.length) lastActions = [...draft.steps];
  }
  shell.go(onlineActive ? { place: 'online', entry: onlineState!.view!.game_id } : { place: 'game' }, false);
  document.body.dataset.page = 'game';
  screen = el('section', 'play-game');
  screen.dataset.hand = handView; screen.dataset.coords = String(coords);
  // Opponent strip: name and level, the opponent's power with its uses, Menu.
  // The name has two lines, Computer and the level; the computer's four cards are one group (option b1).
  const oppName = onlineActive ? onlineState?.opponent?.deleted ? 'Deleted player' : onlineState?.opponent?.handle ?? 'A player' : text.computer;
  const oppAvatar = onlineActive && onlineState?.opponent && !onlineState.opponent.computer && !onlineState.opponent.deleted ? onlineState.opponent.avatar ?? null : null;
  const opponent = el('div', 'play-opp'), who = el('strong');
  who.append(el('span', 'play-opponent-name', oppName));
  who.append(el('small', 'opponent-clock', onlineActive ? '' : text[gameLevel]));
  const face = onlineActive ? profilePortrait(oppName, oppAvatar) : el('img', 'profile-portrait');
  if (!onlineActive && face instanceof HTMLImageElement) { face.src = computerPortrait(gameLevel); face.alt = ''; }
  const opponentGroup = el('div', 'play-opponent-group');
  opponentGroup.append(face, who); opponent.append(opponentGroup);
  addPower(cpu(), opponentGroup); rivalGroup = cards(cpu()) ? addRivalCards(opponentGroup) : null;
  menuButton = button(text.menu, { icon: 'more', iconOnly: true, onPress: () => {
    closeLearning(false); reading = reading === 'menu' ? ended ? 'result' : 'normal' : 'menu'; update();
    (reading === 'menu' ? detail.querySelector<HTMLButtonElement>('button') : menuButton)?.focus({ preventScroll: true });
  } });
  opponent.append(menuButton);
  // Your strip: your power and the four cards, or your king when the game has no powers.
  const mine = el('div', 'play-own'); mine.setAttribute('role', 'group'); mine.setAttribute('aria-label', text.you);
  const king = game.context.rules.kings[player];
  // Pieces only has no resource row; With powers shows the power only (design section 2).
  if (king) addPower(player, mine);
  if (cards(player)) addCards(mine);
  reader = el('section', 'play-reader'); reader.id = 'play-panel'; reader.setAttribute('aria-label', text.last); nodes = readerNodes(); acting = ''; resetFit();
  detail = el('div', 'play-detail');
  boardBox = el('div', 'play-board');
  if (!keep) { boardHost = el('div', 'play-board-host'); boardHost.style.visibility = 'hidden'; boardHost.setAttribute('aria-hidden', 'true'); }
  const host = boardHost;
  const grid = el('div', 'play-grid'); grid.setAttribute('role', 'grid'); grid.setAttribute('aria-label', text.title); grid.setAttribute('aria-description', text.shortcuts);
  cells = Array.from({ length: 64 }, (_, square) => {
    const cell = el('button', 'play-square'); cell.type = 'button'; cell.tabIndex = square === cursor ? 0 : -1;
    cell.dataset.square = String(square); cell.dataset.dark = String(((square % 8) + (square >> 3)) % 2 === 0);
    if (fileLabelRow(square, player)) cell.dataset.file = sqName(square)[0];
    if (rankLabelColumn(square, player)) cell.dataset.rank = sqName(square)[1]; cell.setAttribute('role', 'gridcell');
    cell.addEventListener('focus', () => { cells[cursor].tabIndex = -1; cursor = square; cell.tabIndex = 0; });
    cell.addEventListener('click', () => { moveCursor(square); tap(square); });
    cell.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { markFocus = square; drawMarks(); } });
    cell.addEventListener('focus', () => { if (keyed) { markFocus = square; drawMarks(); } });
    cell.addEventListener('keydown', key); return cell;
  });
  // Eight rows in the player's view, each with its eight cells in screen order (launch decision 11).
  grid.append(...Array.from({ length: 8 }, (_, row) => { const line = el('div', 'play-grid-row'); line.setAttribute('role', 'row'); line.append(...Array.from({ length: 8 }, (_, col) => cells[squareAt(row, col, player)])); return line; }));
  // A pointer that leaves the board leaves no candidate sentence (check "play" fault 4).
  grid.addEventListener('pointerleave', event => { if (event.pointerType !== 'touch' && markFocus !== undefined) { markFocus = undefined; drawMarks(); } });
  choiceBox = el('div', 'play-choices'); boardBox.append(host, grid); // the choice box shows in the reading area
  controls = turnControls(onlineActive ? { ...text, finish: 'Send' } : text, { undo: undoOrReplay, finish: () => { void finish(); } });
  reader.append(controls.line, detail);
  resignDialog = confirmDialog({ title: text.resignTitle, consequence: onlineActive ? 'Your opponent wins. Your unsent turn does not count.' : text.resignCause, action: text.resign, fallback: controls.finish, onConfirm: () => {
    if (onlineActive) { void people?.controller?.resign(); return; }
    closeLearning(false); generation++; engine.cancel(); board?.skip(); thinking = false;
    while (draft.length) draft.undo(); draft.armed = null; shown = null; board?.setPosition(game.pos, game.context);
    arrangement = undefined;
    ended = true; resigned = player; liveGame = false; if (save(true)) store(ARRANGE_KEY, 'null'); resultCause = text.resigned; reading = 'result'; update(); focusResult(); announce(`${replyText()} ${resultCause}`);
  } });
  historyStrip = el('div', 'play-history-strip');
  historyButton = button(text.history, { onPress: () => toggleScroll('history', historyButton) });
  historyButton.append(icon('down')); historyButton.classList.add('play-history-toggle');
  historyStrip.append(historyButton);
  scrollPanel = el('section', 'play-scroll-panel kd-paper'); scrollPanel.id = 'play-scroll';
  historyButton.setAttribute('aria-controls', scrollPanel.id);
  scrollPanel.hidden = true; scrollOpen = null;
  controls.undo.replaceChildren(icon('undo'), el('span', 'kd-sr', text.undo)); controls.undo.classList.add('kd-icon-button');
  screen.append(opponent, boardBox, historyStrip, reader, mine, controls.element, scrollPanel, resignDialog.element);
  if (fromHome) { root.querySelectorAll('.play-game').forEach(node => node.remove()); screen.style.visibility = 'hidden'; root.append(screen); }
  else root.replaceChildren(screen);
  const onArtError = () => { if (host === boardHost && document.body.dataset.page === 'game') artFailed(generation); };
  board = keep ?? boardCode!.mountBoard(host, tap, { liveInput: true, quiet: true, plainMarks: true, initialBoardArt: skinUrl, onArtError }); board.flip(player === 1); board.setPosition(draft.position, game.context); applyPieceView(); layout(); update();
  fit.disconnect(); fit.observe(screen);
  if (!resumed) save(true); // the new game replaces the save: a save with no move
  // The first draw uses the prepared surface and stills, with no second stone image to wait for.
  const loaded = keep ? Promise.resolve() : board.ready().then(() => { if (own === generation) host.style.visibility = ''; });
  // The engine worker loads when the board can draw, so it does not hold the first frame (decision 44).
  void loaded.catch(() => {}).then(() => { if (own === generation && !onlineActive) engine.prepare(game); });
  const versus = fromHome && !resumed && !arrangement && game.context.rules.kings[0] ? versusCard(loaded) : null;
  const entryAnnouncement = announcement;
  if (fromHome) {
    starting = own;
    try {
      // Pieces only: the home screen stays (Play shows busy) until the board can draw. With powers, Versus covers that time.
      if (!versus) { if (from) setButtonState(from, { busy: true }); await loaded.catch(() => {}); }
      if (own !== generation) return;
      screen.style.visibility = ''; cells[cursor].focus({ preventScroll: true });
      // The board is at its final position from the first frame. The back ranks can rise at once.
      if (!versus && !resumed && !arrangement) rollCall();
      if (homeScreen) { await screenChange(homeScreen, screen); homeScreen.remove(); }
    } finally { if (starting === own) starting = 0; }
  } else { cells[cursor].focus({ preventScroll: true }); if (!retry && !arrangement) rollCall(); }
  if (own !== generation) return;
  try { await loaded; } catch { artFailed(own); }
  if (versus) { const square = await versus; if (own === generation) { rollCall(); if (square != null) { moveCursor(square); tap(square); } } }
  if (own === generation && fault) focusFault();
  if (own === generation && announcement === entryAnnouncement && !notice && !fault) {
    const context = arrangement ? [arrangeText.instruction, arrangement.error ?? arrangeText.legal, arrangeText.keys].join(' ') : thinking ? '' : draft.length ? stepLines().join(' ') : replySteps.length ? replyText() : fresh() ? text.firstMinute : last;
    announce([controls.state.textContent, context].filter(Boolean).join(' '));
  }
  // The computer moves first in a Dark game, and after Continue on its turn; only when the board art is ready.
  if (own === generation && !onlineActive && !arrangement && !fault && game.pos.turn === cpu() && game.status === 'playing') void reply();
}
/** The art cannot load: one safe next step, Try again. The game, its staged steps and its save stay. */
function artFailed(own: number) {
  if (own !== generation || fault === 'art') return;
  fault = 'art'; boardBox.querySelector<HTMLElement>('.play-grid')!.inert = true; update(); announce(`${sideText.artFailed} ${sideText.staysSaved}`); focusFault();
}
const focusFault = () => boardBox.querySelector<HTMLButtonElement>('.play-fault button')?.focus({ preventScroll: true });
/** Try again: a new search on the same turn, or a new board with the same game (no deal, no opening, no new save). */
function retryFault() {
  if (fault === 'computer') { engine.cancel(); engine.prepare(game); fault = null; void reply(); return; }
  skinUrl = `${SKIN}?retry=${generation}`; // WebKit keeps a failed image in its memory cache.
  fault = null; endEntry(); board?.dispose(); board = undefined; void start({ game, draft, level: gameLevel, player }, undefined, true);
}
/** Versus: the two kings face each other with their powers. It holds about 1.6 s and until the board can draw; a tap or a key ends the hold. Resolves when it starts to leave. */
function versusCard(loaded: Promise<unknown>): Promise<number | null> {
  const card = el('div', 'play-versus'); card.setAttribute('aria-hidden', 'true');
  const side = (s: Color) => {
    const king = game.context.rules.kings[s]!, box = el('div', `vs-side ${s !== player ? 'vs-rival' : 'vs-you'}`), stage = el('div', 'vs-stage');
    stage.append(el('div', 'play-stage-floor'), figure(kingFile(s)));
    box.append(stage, el('small', 'vs-who', s !== player ? levelName() : text.you), el('strong', 'vs-king', `${kingDisplayName(king.king)} ${text.king}`), el('b', 'vs-power', POWER_NAME[king.power]), el('p', 'vs-line', powerLines[king.power] ?? ''));
    return box;
  };
  const [you, mark, rival] = [side(player), el('div', 'vs-mark', text.versus), side(cpu())];
  card.append(you, mark, rival); screen.append(card);
  const [k0, k1] = [game.context.rules.kings[player], game.context.rules.kings[cpu()]];
  announce(versusLine(k0!.king, POWER_NAME[k0!.power], k1!.king, POWER_NAME[k1!.power]));
  if (!calm()) {
    const enter = (node: HTMLElement, from: string, delay: number, duration = time(420)) => node.animate([{ transform: from, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration, delay, easing: token('--ease-out3'), fill: 'backwards' });
    enter(you, 'translateX(-48px)', time(120)); enter(rival, 'translateX(48px)', time(120)); enter(mark, 'scale(1.6)', time(380), time(320));
  }
  let skip = () => {};
  const skipped = new Promise<void>(resolve => { skip = resolve; });
  const onKey = (event: KeyboardEvent) => { event.preventDefault(); event.stopPropagation(); skip(); };
  let square: number | null = null;
  card.addEventListener('pointerdown', event => {
    const box = boardBox.getBoundingClientRect(), x = event.clientX - box.left, y = event.clientY - box.top;
    if (x >= 0 && x < box.width && y >= 0 && y < box.height) square = squareAt(Math.floor(y / box.height * 8), Math.floor(x / box.width * 8), player);
    skip();
  });
  document.addEventListener('keydown', onKey, true);
  let timer: ReturnType<typeof setTimeout>;
  const out = calm() ? 0 : ms('--dur-versus-out'), hold = Promise.race([new Promise(resolve => { timer = setTimeout(resolve, ms('--dur-versus') - out); }), skipped]);
  const end = () => { clearTimeout(timer); document.removeEventListener('keydown', onKey, true); card.remove(); skip(); };
  endVersus = end;
  return Promise.all([hold, loaded.catch(() => {})]).then(() => {
    if (endVersus !== end) return null;
    endVersus = null; clearTimeout(timer);
    document.removeEventListener('keydown', onKey, true);
    if (!out) { card.remove(); return square; }
    card.style.pointerEvents = 'none'; // a tap while it leaves reaches the board and skips Roll call
    void card.animate([{ opacity: 0, transform: 'scale(1.02)' }], { duration: out, easing: token('--ease-in3'), fill: 'forwards' }).finished.then(() => card.remove());
    return square;
  });
}
/** Roll call: the back ranks rise into place, file by file, and each special piece type of this army shows its name beside its figure. */
function rollCall() {
  if (!board || calm()) return;
  const pos = game.pos, stagger = ms('--arrive-stagger'), arrive = ms('--dur-arrive'), delays = new Map<number, number>();
  for (let sq = 0; sq < 64; sq++) if ((sq < 8 || sq >= 56) && pos.board[sq]) delays.set(sq, stagger * cellOf(sq, player).col);
  board.arrive(delays, arrive, parseFloat(token('--arrive-rise')));
  const specials: number[] = [];
  // The player's back rank, from the left of the screen.
  for (let col = 0; col < 8; col++) { const sq = squareAt(7, col, player); if ([A, L, G, M, S, O].includes(typeOf(pos.board[sq])) && !specials.some(other => typeOf(pos.board[other]) === typeOf(pos.board[sq]))) specials.push(sq); }
  const first = ms('--tag-start'), step = ms('--tag-stagger');
  const tags = specials.slice(0, 6).map((sq, i) => {
    const tag = el('span', 'play-tag', nameOf(pos.board[sq])); tag.setAttribute('aria-hidden', 'true');
    const col = cellOf(sq, player).col; tag.style.left = `${(col + .5) * 12.5}%`; tag.dataset.row = String(col % 2); tag.style.animationDelay = `${first + step * i}ms`;
    boardBox.append(tag);
    const half = tag.getBoundingClientRect().width / 2 + 1; // Leave room for fractional text bounds.
    tag.style.left = `${Math.max(half, Math.min(boardBox.clientWidth - half, (col + .5) / 8 * boardBox.clientWidth))}px`;
    return tag;
  });
  const timer = setTimeout(endOpening, Math.max(stagger * 7 + arrive, tags.length ? first + step * (tags.length - 1) + ms('--dur-tag') : 0));
  opening = { end() { clearTimeout(timer); opening = null; board?.arrive(new Map()); tags.forEach(tag => tag.remove()); } };
}
function endOpening() { opening?.end(); }
/** End any board playback; a computer reply that only waits for its playback ends with it. */
function skipBoard() { boardReplay.cancel(); endCardFlight(); cancelCheckPulse(); board?.skip(); playingAction = null; endReply?.(); }
function moveCursor(square: number) { cells[cursor].tabIndex = -1; cursor = square; cells[cursor].tabIndex = 0; cells[cursor].focus({ preventScroll: true }); }
document.addEventListener('keydown', event => {
  if (document.body.dataset.page !== 'game' || event.defaultPrevented || (event.target as Element).closest('dialog, input, textarea, select, [contenteditable="true"]')) return;
  if (event.key.toLowerCase() === 'z' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); undoOrReplay(); return; }
  if (event.key !== 'Escape') return;
  if (scrollOpen || reader?.dataset.floating === 'true') { event.preventDefault(); closeFloating(); return; }
  if (reading === 'rule') { event.preventDefault(); closeLearning(); return; }
  if (reading === 'menu') { event.preventDefault(); reading = ended ? 'result' : 'normal'; update(); menuButton.focus({ preventScroll: true }); return; }
  const target = (shown ?? armedResource())?.control ?? cells[cursor], cancelled = armedResource();
  if (arrangement) arrangement.selected = null;
  event.preventDefault(); endOpening(); clearChoice(); draft.armed = null; shown = null; selected = inspected = null; notice = '';
  if (reading !== 'result') reading = ended ? 'result' : 'normal';
  update(); target.focus({ preventScroll: true }); if (cancelled) announce(cancelLine(cancelled.subject.kind));
});
function key(event: KeyboardEvent) {
  endOpening();
  // The arrows follow the screen in both views.
  if (event.key.startsWith('Arrow')) {
    event.preventDefault();
    const next = arrowStep(cursor, event.key, player);
    if (next != null && (!arrangement || Math.floor(next / 8) === player * 7)) moveCursor(next);
  }
}
function clearChoice() { choice = []; choiceBox.replaceChildren(); }
/** Decision 127: a docked result that runs past its fixed box (a long cause) takes the compact result: no figure, one action row.
 *  If the compact result still runs past the box, the cause scrolls in its own box; the title, the note and the actions stay in view.
 *  It measures the docked reader after each render and each layout pass, so a Menu close, a resize or a rotation fits it again. */
function fitResult() {
  delete screen.dataset.resultFit;
  const docked = screen.dataset.layout === 'portrait' || (screen.dataset.layout === 'wide' && screen.dataset.form === 'compact');
  if (reading !== 'result' || !docked || !reader || reader.dataset.floating === 'true') return;
  const card = detail?.querySelector<HTMLElement>('.play-result, .play-result-copy');
  const over = () => !!card && card.getBoundingClientRect().bottom > reader!.getBoundingClientRect().bottom;
  if (!over()) return;
  screen.dataset.resultFit = 'tight';
  if (over()) screen.dataset.resultFit = 'scroll';
}
function tap(square: number) {
  if (fault === 'art' || !onlineActive && writer.blocked) return; // a fault waits for recovery
  endOpening(); const wasEnded = ended; skipBoard();
  cells.forEach(cell => cell.classList.remove('square-error')); // a new tap ends the red edge of an earlier refusal
  if (ended && !wasEnded) return; // the last reply can end the game inside skipBoard: the result and its announcement keep their place (decision 129)
  lastActions = []; notice = ''; onlineGameNotice = undefined;
  if (arrangement && !ended) {
    if (arrangementLocked()) return;
    closeLearning(false); if (reading === 'menu') reading = 'normal';
    if (!arrangement.pick(square)) { moveCursor(player * 56); announce(arrangeText.choose); return; }
    board?.setPosition(arrangement.position(game.pos), game.context); update();
    announce(arrangement.error ?? (arrangement.selected === null ? arrangeText.instruction : arrangeText.selected)); return;
  }
  const activeResource = armedResource(); if (!activeResource) shown = null;
  closeLearning(false);
  // Help is never modal: a board tap closes it and also acts.
  if (reading === 'rule' || reading === 'menu') reading = 'normal';
  if (ended) reading = 'result';
  if (choice.length) clearChoice();
  const pos = draft.position, code = pos.board[square];
  if (!ended && !thinking && !draft.open && !draft.chain) { refuse(text.staged, square); return; }
  if (ended || thinking) {
    if (code) { inspected = square; selected = null; update(); announce(learningEntry({ kind: 'piece', type: typeOf(code) }, game.context, pos, colorOf(code)).short); }
    else refuse(ended ? text.final : fault ? sideText.computerFailed : thinking ? text.wait : text.staged, square);
    return;
  }
  const source = draft.chain ? draft.previewMove!.from : selected;
  if (source != null) {
    const options = draft.at(source, square);
    if (options.length) {
      if (!draft.armed && typeOf(draft.now.board[source]) === S && options.every(m => m.captures.length > 0)) {
        const before = draft.position; draft.bite(source, square);
        const from = before.board[source] ? source : draft.captures.at(-2)!;
        afterStage(before, { from, to: square, captures: [square] }); return;
      }
      if (options.length > 1) { showChoice(square, options); return; }
      stage(options[0]); return;
    }
    if (draft.chain) { refuse(refusalForTap(draft, source, square), square); return; }
  }
  const own = draft.options(square);
  // An invalid occupied target is still a refusal. Keep the actor and its armed action.
  if (source != null && code && colorOf(code) !== draft.now.turn && !own.length) { refuse(refusalForTap(draft, source, square), square); return; }
  if (draft.armed && !own.length) { refuse(refusalForTap(draft, source, square), square); return; }
  // An armed mark, pawn change, returned piece or quake stages at its one square.
  if (draft.armed && own.length && own.every(isDirect)) { if (own.length > 1) showChoice(square, own); else stage(own[0]); return; }
  if (code) {
    inspected = square;
    if (own.length || colorOf(code) === player) {
      selected = selected === square ? null : square; if (selected == null) inspected = null;
      if (selected != null && !own.length) notice = refusalForTap(draft, draft.armed ? null : square, square);
    } else { selected = null; notice = draft.armed ? text.armed : text.computerOwns; }
    const showSymbolsHint = fresh() && pieceView === 'figures' && ++selectTaps >= 6 && !readHints().has('view:symbols');
    if (showSymbolsHint) { symbolsHint = true; markHintSeen('view:symbols'); }
    const short = learningEntry({ kind: 'piece', type: typeOf(code) }, game.context, pos, colorOf(code)).short;
    update(); announce(`${nameOf(code)} ${sqName(square)}. ${notice || short}${notice === text.computerOwns ? ` ${short}` : ''}${showSymbolsHint ? ` ${text.symbolsHint}` : ''}`);
  } else refuse(refusalForTap(draft, source, square), square);
}
function stage(move: Move) {
  // A choice button stages as a board tap does: it ends a Replay or an animation first (review finding, decision 127).
  skipBoard();
  const card = armedResource(), before = draft.position; draft.stage(move);
  // A played card travels to its square; the card in the hand shows it as spent.
  if (card?.card != null) { const box = cells[move.to].getBoundingClientRect(); endCardFlight(); endCardFlight = cardFly(card.control, screen, box.left + box.width / 2, box.top + box.height / 2, box.width); }
  afterStage(before, move);
}
function afterStage(before: Position, move: Move) {
  const now = draft.now; shown = null; symbolsHint = false; resources.forEach(r => { r.hint = undefined; });
  lastActions = [...draft.steps, ...(draft.previewMove ? [{ before: draft.now, move: draft.previewMove }] : [])];
  // A Haste or Rage second move belongs to the same piece: keep it selected.
  selected = draft.chain ? draft.previewMove!.from : draft.open && now.haste !== undefined && now.rage !== 3 ? now.haste : null; inspected = move.selfRemove ? null : move.to;
  save(true); update(); animate(before, move, draft.position);
  announce(`${stepLines().at(-1)} ${controls.state.textContent}`); // the state line: ready, must continue, or what is possible after a free action
}
/** Play one action on the board. Resolves when its playback ends (a board tap ends it at once). */
function animate(before: Position, move: Move, after: Position): Promise<unknown> {
  if (!board) return Promise.resolve();
  nextMarksAt = 0;
  const action = playingAction = { before, move };
  board.setPosition(before, game.context);
  const done = board.play(move, after).catch(error => { refuse(String(error)); }).finally(() => {
    if (playingAction === action) {
      playingAction = null;
      if ((draft.chain || draft.open && draft.now.haste !== undefined) && motion !== 'off' && pieceView !== 'symbols' && !calm()) { nextMarksAt = performance.now() + time(260); setTimeout(drawMarks, time(260) + 1); }
      drawMarks();
    }
  });
  drawMarks(); return done;
}
function undoOrReplay() {
  const state = undoReplayState(draft.length, replySteps.length, thinking || ended || !!fault || !!arrangement || !onlineActive && writer.blocked);
  if (!state.enabled) return;
  if (!state.replay) { undo(); return; }
  if (!board || boardReplay.running) return;
  closeFloating(false);
  lastActions = replySteps.map(({ before, move }) => ({ before, move }));
  if (calm() || motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches) { drawMarks(); announce(text.replay); return; }
  const own = generation, view = board;
  screen.dataset.replaying = 'true';
  void boardReplay.play(replySteps, view, game.context, () => own === generation && board === view,
    () => { playingAction = null; view.setPosition(draft.position, game.context); screen.dataset.replaying = 'false'; drawMarks(); },
    (pos, step) => { playingAction = step ? { before: pos, move: step.move } : null; drawMarks(); })
    .catch(error => refuse(String(error)));
}
function undo() {
  if (!draft.length || thinking || ended || !onlineActive && writer.blocked) return;
  const oldHistory = currentHistory();
  closeLearning(false);
  skipBoard(); clearChoice(); draft.undo(); shown = null; resources.forEach(r => { r.hint = undefined; }); selected = draft.chain ? draft.previewMove!.from : null; inspected = null; notice = '';
  lastActions = [...draft.steps, ...(draft.previewMove ? [{ before: draft.now, move: draft.previewMove }] : [])];
  erased = calm() || matchMedia('(prefers-reduced-motion: reduce)').matches ? undefined : removedHistoryLine(oldHistory, currentHistory());
  clearTimeout(eraseTimer); if (erased) eraseTimer = setTimeout(() => { erased = undefined; renderHistory(); }, 200);
  save(true); board?.setPosition(draft.position, game.context); update(); announce(text.undone);
}
function showChoice(square: number, options: Move[]) {
  choice = options; choiceSquare = square; choiceBox.replaceChildren();
  // The choice shows in the reading area with short labels, so it covers no square and each choice is in reach (reading decision 22).
  if (options.some(m => m.shove) && options.some(m => !m.shove)) {
    choiceBox.append(targetChoice(sqName(square), action => { const m = choice.find(m => action.toLowerCase() === (m.shove ? 'push' : 'capture'))!; clearChoice(); stage(m); cells[square].focus(); }));
  } else {
    const group = el('section', 'kd-target-choice'); group.setAttribute('aria-label', choicePrompt(options));
    for (const m of options) group.append(button(choiceLabel(draft.now, m, cards(player)), { onPress: () => { clearChoice(); stage(m); cells[square].focus(); } }));
    choiceBox.append(group);
  }
  const cancel = closeX('Cancel action choice', () => { clearChoice(); selected = inspected = null; update(); cells[square].focus(); });
  cancel.classList.add('play-choice-cancel'); choiceCancel = cancel;
  update(); choiceBox.querySelector<HTMLButtonElement>('button')?.focus(); announce(`${choicePrompt(options)} ${sqName(square)}.`);
}
function stepLines(): string[] {
  return draftSentences(draft, cards(player));
}
/** The sentence of a whole turn from history entry `start`: each step, with no pass. */
const turnText = (start: number, computer: boolean) => game.history.slice(start).filter(h => !h.move.pass).map(h => sentence(h.pos, h.move, computer, cards(computer ? cpu() : player))).join(' ');
const turnActions = (start: number): MarkAction[] => game.history.slice(start).filter(h => !h.move.pass).map(h => ({ before: h.pos, move: h.move }));
async function finish() {
  closeLearning(false);
  if (arrangement && !ended) {
    if (!arrangement.canReady || arrangementLocked() || fault || !onlineActive && writer.blocked) return;
    if (onlineActive) { await people?.controller?.ready(arrangement.order); return; }
    game.load(arrangement.position(game.pos)); arrangement = undefined;
    draft = new DraftTurn(game); selected = inspected = null;
    if (save(true)) store(ARRANGE_KEY, 'null');
    board?.setPosition(game.pos, game.context); layout(); update();
    if (game.pos.turn === cpu()) void reply(); else announce(text.ready);
    return;
  }
  if (onlineActive) { if (draft.canFinish && !choice.length && !thinking && !ended) { selected = inspected = null; await people?.controller?.send(); } return; }
  if (!draft.canFinish || choice.length || thinking || ended || !onlineActive && writer.blocked) return;
  skipBoard(); const mine = game.history.length; if (draft.commit().at(-1)!.pass) board?.setPosition(game.pos, game.context); last = turnText(mine, false); lastActions = turnActions(mine); selected = inspected = null; notice = ''; shown = null;
  clearChoice(); save(true);
  if (game.status !== 'playing') { void showResult(); return; }
  finalCheckCue(); void reply(); announce(text.sent);
}
/** The computer's turn: after End turn, or after Continue when the computer is to move. */
async function reply() {
  thinking = true; acting = ''; fault = null; seal(controls.finish, 4); update();
  // A Try again continues the same computer turn: its start is the end of the player's last turn.
  const own = generation; let start = game.history.length;
  while (start > 0 && game.history[start - 1].pos.turn === cpu()) start--;
  let played: Promise<unknown> = Promise.resolve();
  try {
    while (game.pos.turn === cpu() && game.status === 'playing' && own === generation) {
      const { blunder, ...plan } = skillPlan(SKILLS[gameLevel], game.pos.ply);
      const result = await engine.think(game, { ...plan, history: game.history.map(h => game.context.positionKey(h.pos)) });
      if (own !== generation) return;
      const m = Math.random() < blunder ? game.legal[Math.floor(Math.random() * game.legal.length)] : result.move;
      if (!m) throw new Error(text.computerFailed);
      // A second move of the reply waits until the board has shown the first.
      await played; if (own !== generation) return;
      if (game.history.length > start && !calm() && pieceView !== 'symbols') await new Promise(resolve => setTimeout(resolve, time(260)));
      if (own !== generation) return;
      const before = game.pos; game.play(m); last = turnText(start, true); lastActions = turnActions(start);
      // The whole reply is saved before its playback ends: a reload then shows it as done.
      if (game.pos.turn !== cpu() || game.status !== 'playing') save(false);
      // A pass changes no square: show its end of marks at once.
      if (m.pass) { board?.setPosition(game.pos, game.context); played = Promise.resolve(); } else played = animate(before, m, game.pos);
      // The computer acts: the reading area follows the step that plays (design section 4).
      if (!m.pass) { acting = [...effectEndLines(game.context, before, m, game.pos, player), sentence(before, m, true, cards(cpu()))].join(' '); update(); }
    }
    if (own !== generation) return;
    // The status changes when the board has shown the reply, not before (fault C2). A board tap ends both at once.
    endReply = () => {
      endReply = null; if (own !== generation) return;
      thinking = false; acting = ''; notice = ''; draft = new DraftTurn(game); replySteps = lastReplySteps(game, cpu());
      if (game.status !== 'playing') { void showResult(); return; }
      finalCheckCue(); update(); announce(`${replyText()} ${game.inCheck ? text.check : text.ready}`);
    };
    await played; endReply?.();
  } catch {
    // The computer keeps its turn: the player cannot move for it. The last save stays (launch decision 12).
    if (own !== generation) return;
    acting = ''; fault = 'computer'; update(); announce(`${sideText.computerFailed} ${sideText.staysSaved}`); focusFault();
  }
}
function cancelCheckPulse() { cancelAnimationFrame(checkFrame); checkPulse = null; }
function finalCheckCue() {
  if (game.status !== 'playing' || !game.inCheck) return;
  sfx?.snd.check();
  if (game.pos.turn === player || calm()) return;
  checkPulse = { square: findKing(game.pos.board, cpu()), at: performance.now() };
  const pulse = () => {
    drawMarks();
    if (checkPulse && performance.now() - checkPulse.at < time(200)) checkFrame = requestAnimationFrame(pulse);
    else { checkPulse = null; drawMarks(); }
  };
  pulse();
}
/** After the end, focus goes to Rematch, the main result action (reading decision 21). */
const focusResult = () => detail.querySelector<HTMLButtonElement>('.play-result-actions .kd-button')?.focus({ preventScroll: true });
function showResult() {
  ended = true; thinking = false; liveGame = false;
  const status: Status = game.status;
  resultCause = status === 'checkmate' ? game.pos.turn === cpu() ? text.win : text.loss : text[status as 'stalemate' | 'draw50' | 'drawRepetition' | 'drawMaterial'];
  board?.skip(); board?.setPosition(game.pos, game.context); shown = null; reading = 'result'; update(); focusResult();
  announce(`${replyText()} ${resultCause}`);
  if (status === 'checkmate') void board?.play({ kind: 'fall', square: findKing(game.pos.board, game.pos.turn) }).catch(() => {});
}
const arrangementLocked = () => !!(onlineActive && (onlineState?.view?.ready?.[player] || onlineState?.phase !== 'setup'));
const arrangementWaiting = () => !!(onlineActive && onlineState?.view?.ready?.[player]);
function updateArrangement() {
  const a = arrangement!, wait = arrangementWaiting(), locked = arrangementLocked();
  thinking = false;
  controls.finish.querySelector('[data-button-label]')!.textContent = arrangeText.ready;
  controls.update({ state: wait ? arrangeText.wait : arrangeText.title, help: notice || a.error || arrangeText.instruction,
    undoReason: text.noStep, finishReason: fault ? text.loadFailed : !onlineActive && writer.blocked ? writer.warning : locked ? wait ? arrangeText.wait : arrangeText.confirming : a.error ?? '' });
  screen.dataset.state = wait ? 'arrange-wait' : 'arrange'; screen.dataset.canFinish = String(a.canReady && !locked);
  screen.dataset.reading = reading; screen.dataset.borrow = 'false'; screen.dataset.readerActive = 'true';
  controls.element.inert = false;
  const grid = screen.querySelector<HTMLElement>('.play-grid')!;
  grid.inert = locked || !!fault || !onlineActive && writer.blocked;
  grid.setAttribute('aria-description', arrangeText.keys);
  const pos = a.position(game.pos), faults = a.faults;
  cells.forEach((cell, square) => {
    cell.setAttribute('aria-label', squareLabel(pos, square)); cell.setAttribute('aria-selected', String(square === a.selected));
    cell.toggleAttribute('data-arrange-fault', faults.includes(square));
    if (faults.includes(square)) cell.setAttribute('aria-description', a.error!);
    else cell.removeAttribute('aria-description');
  });
  screen.querySelectorAll<HTMLElement>('.play-own, .play-opp .play-power, .play-opp .play-rival-cards').forEach(part => part.inert = true);
  board?.setPosition(pos, game.context); renderReader(); renderHistory(); placeFloating(); drawMarks();
}
function update() {
  if (!board || !controls) return;
  const net = onlineActive ? people?.controller?.state() ?? onlineState : undefined;
  if (onlineActive && onlineState) {
    const state = people?.controller?.state() ?? onlineState;
    thinking = !state.draft || state.phase === 'sending' || state.phase === 'checking'; ended = state.phase === 'over';
    const oppName = state.opponent?.deleted ? 'Deleted player' : state.opponent?.handle ?? 'A player';
    const oppAvatar = state.opponent && !state.opponent.computer && !state.opponent.deleted ? state.opponent.avatar ?? null : null;
    const opp = screen.querySelector<HTMLElement>('.play-opp'), who = opp?.querySelector<HTMLElement>('.play-opponent-group > strong'), clock = who?.querySelector<HTMLElement>('.opponent-clock');
    const nameChanged = !!who && (who.firstChild?.textContent ?? '') !== oppName;
    if (who && nameChanged) who.querySelector('.play-opponent-name')!.textContent = oppName;
    const face = opp?.querySelector<HTMLElement>('.profile-portrait');
    const nextSrc = allowedAvatarUrl(oppAvatar) ? oppAvatar : null;
    const currentSrc = face?.dataset.avatar ?? null;
    if (face && (currentSrc !== nextSrc || nameChanged)) face.replaceWith(profilePortrait(oppName, oppAvatar));
    if (clock) clock.textContent = state.clock.left == null ? '' : `${state.clock.mine ? 'Your move' : 'Their move'} · ${state.clock.left <= 0 ? 'Time is up' : timeWords(state.clock.left) + ' left'}`;
  }
  if (arrangement && !ended) { updateArrangement(); return; }
  controls.finish.querySelector('[data-button-label]')!.textContent = onlineActive ? 'Send' : text.finish;
  screen.querySelector('.play-grid')!.setAttribute('aria-description', text.shortcuts);
  cells.forEach(cell => cell.removeAttribute('data-arrange-fault'));
  const code = draft.position.board[inspected ?? selected ?? -1];
  const now = draft.now, midway = draft.open && draft.length > 0 && draft.canFinish ? now.haste !== undefined ? now.rage === 3 ? text.another : text.again : text.after : '';
  let help = fault ? '' : notice || (ended ? text.rematchHint : thinking ? text.wait : draft.armed ? '' : draft.chain ? draft.canFinish ? draft.targets(draft.previewMove!.from).length ? text.continue : text.endChain : text.mustContinue : midway === text.after ? '' : midway || (draft.length || code || fresh() || replySteps.length ? '' : text.choose));
  if (net) help = (net.connection === 'auth' || net.phase === 'checking' || net.phase === 'sending' ? 'Your turn is not confirmed yet.' : net.phase === 'their-move' ? 'Your opponent now plays.' : help).replaceAll('End turn', 'Send');
  if (choice.length) help = notice;
  // Check names the player's own king only; a check that the player gives shows in the reading area (reading decision 22).
  const checked = !thinking && checkLines(game.context, draft.position, player).mine;
  // After a free action alone, the line says what is possible next (reading decision 20).
  const free = freeText();
  if (!thinking) unseal(controls.finish);
  // End turn is quiet after a free action alone and brass after a move (option d2); it stays enabled when it is legal.
  controls.finish.dataset.kind = finishKind(!!free && draft.canFinish);
  const replay = undoReplayState(draft.length, replySteps.length, thinking || ended || !!fault).replay;
  controls.undo.replaceChildren(icon(replay ? 'rewind' : 'undo'), el('span', 'kd-sr', replay ? text.replay : text.undo));
  controls.update({ sent: thinking && !fault, state: ended ? resultCause : fault ? fault === 'art' ? sideText.artFailed : sideText.computerFailed : net && personTurn(net) || (thinking ? text.thinking : choice.length ? choicePrompt(choice) : draft.armed ? armedStep(draft.armedMoves, draft.now, selected, player) : checked ? text.check : free || (draft.length ? draft.canFinish ? text.draft : text.mustContinue : fresh() && !replySteps.length && !code && !player ? text.first : text.ready)), help,
    undoReason: !onlineActive && writer.blocked ? writer.warning : undoReplayState(draft.length, replySteps.length, thinking || ended || !!fault).enabled ? '' : text.noStep,
    finishReason: !onlineActive && writer.blocked ? writer.warning : ended ? text.final : fault ? fault === 'art' ? sideText.artFailed : sideText.computerFailed : net?.connection === 'auth' ? 'Sign in to send your turn.' : thinking ? net ? personTurn(net) ?? text.wait : text.wait : choice.length ? text.choiceFirst : draft.canFinish ? '' : draft.length ? text.mustContinue : text.needMove });
  const pos = draft.position;
  screen.querySelector<HTMLElement>('.play-grid')!.inert = ended || !!fault || !onlineActive && writer.blocked;
  controls.element.inert = ended;
  cells.forEach((cell, square) => { cell.setAttribute('aria-label', squareLabel(pos, square)); cell.setAttribute('aria-selected', String(square === selected)); });
  screen.dataset.state = ended ? 'result' : thinking ? 'thinking' : choice.length ? 'choice' : draft.length ? 'draft' : 'ready';
  screen.dataset.canFinish = String(draft.canFinish && !choice.length && !thinking && !ended);
  screen.dataset.armed = draft.armed ?? ''; screen.dataset.fault = fault ?? '';
  // After the end the power and card row and the finish row are inert; the result card keeps its actions (reading decision 21).
  screen.querySelectorAll<HTMLElement>('.play-own, .play-turn, .play-opp .play-power, .play-opp .play-rival-cards').forEach(part => part.toggleAttribute('inert', ended || !onlineActive && writer.blocked));
  for (const res of resources) {
    const coin = res.card == null ? coinState(draft.position, res.side, game.context.rules, game.history, res.side === player && draft.armed === res.key) : null, left = coin?.left ?? null;
    const spent = res.card == null ? left === 0 : !!((draft.position.used?.[res.side] ?? 0) >> res.card & 1);
    if (coin) {
      res.control.dataset.coin = coin.state;
      res.control.querySelector('small')!.textContent = coin.state === 'always' ? text.alwaysOnShort : spent ? readingBText.used : left == null ? text.unlimited : `${left} ${text.left}`;
      res.control.querySelectorAll<HTMLElement>('.play-power-notch').forEach((notch, i) => { notch.dataset.used = String(i >= (left ?? 0)); });
    } else res.control.querySelector('.play-card-state')!.textContent = spent ? readingBText.used : '';
    // A card or power that cannot act at this step shows "Not now" (design section 6); a tap still gives its reason.
    const notNow = res.side === player && !!res.key && !spent && !ended && !thinking && draft.armed !== res.key && !draft.armable(res.key);
    res.control.dataset.spent = String(spent); res.control.dataset.notNow = String(notNow); res.control.dataset.uses = String(!!res.key);
    if (spent || notNow) res.control.setAttribute('aria-description', spent ? text.spent : readingBText.notNow); else res.control.removeAttribute('aria-description');
    if (res.side === player && res.key) {
      const was = res.control.getAttribute('aria-pressed') === 'true', armed = draft.armed === res.key;
      res.control.setAttribute('aria-pressed', String(armed));
      if (was && !armed && res.card == null) disarm(res.control);
    }
  }
  if (rivalGroup) {
    const used = (thinking ? game.pos : draft.position).used?.[cpu()] ?? 0;
    rivalGroup.control.querySelectorAll<HTMLElement>('.play-rival-mark').forEach((mark, k) => { mark.dataset.spent = String(!!(used >> k & 1)); });
    const left = game.context.rules.hands[cpu()].filter((_, k) => !(used >> k & 1)).length;
    rivalGroup.control.querySelector('.play-rival-count')!.textContent = String(left);
    rivalGroup.control.setAttribute('aria-label', `${text.cardsLeft(left)}. ${gameWords(rivalLine(used))}`); rivalGroup.control.setAttribute('aria-expanded', String(shown === rivalGroup));
  }
  // The reading area takes the opponent strip while a rule or the menu is open, on a short phone or when the rule does not fit. The board does not move.
  screen.dataset.reading = reading; screen.dataset.borrow = 'false';
  const actions = net ? onlineActions(net) : undefined;
  screen.dataset.readerActive = String(!!(selected != null || !draft.length && inspected != null || draft.armed || choice.length || notice || actions?.childElementCount));
  renderReader(actions); renderHistory(); placeFloating(); fitResult();
  drawMarks();
}
const armedResource = () => resources.find(r => r.side === player && draft.armed && r.key === draft.armed);
function renderReader(actions?: HTMLElement) {
  if (!detail) return;
  const ruleKey = learning ? `${subjectKey(learning.subject)}:${learning.side}:${JSON.stringify(draft.position.used)}` : '';
  if (detail.childElementCount && detail.dataset.mode === reading && (reading === 'menu' || reading === 'result' || (reading === 'rule' && detail.dataset.ruleKey === ruleKey))) return;
  // Help and the menu open and close like a sheet (Exact).
  const was = detail.dataset.mode;
  panel?.dispose(); panel = null; stopPortrait();
  detail.replaceChildren(); detail.dataset.mode = reading; detail.dataset.ruleKey = ruleKey; detail.scrollTop = 0;
  if (reading === 'rule' && learning) {
    panel = learningPanel(learning.subject, game.context, { pos: draft.position, side: learning.side, cardIndex: learning.cardIndex, close: () => closeFloating(), announce, owner: learning.subject.kind === 'power' ? learning.side === cpu() ? readingText.computerPower : readingText.yourPower : undefined });
    detail.append(panel.element); return;
  }
  if (reading === 'menu') {
    // A memory-only game is not saved: the Menu then shows the save fault line.
    const saveLine = ended ? '' : onlineActive ? 'Your sent turns stay saved online.' : writer.warning || menuText.saved;
    const menu = gameMenu(settings(), { saveLine, onClose: () => { reading = ended ? 'result' : 'normal'; update(); menuButton.focus({ preventScroll: true }); }, onHome: () => home(true), onResign: source => { if (!ended) resignDialog.open(source); } });
    if (onlineActive && onlineState) {
      const actions = el('div', 'online-menu-actions');
      if (onlineState.canOfferDraw) actions.append(button('Offer draw', { onPress: () => { void people!.controller!.offerDraw(); } }));
      if (onlineState.abortOpen) actions.append(button('End with no result', { onPress: () => { void people!.controller!.abort(); } }));
      if (onlineState.view && humanOpponent(onlineState.view)) actions.append(...playerSafety(people!.safety, { game_id: onlineState.view.game_id }, () => { void people?.controller?.refresh(); }));
      menu.querySelector('.menu-settings')?.prepend(actions);
    }
    detail.append(menu); if (was !== 'menu') menuEnter(menu); return;
  }
  if (reading === 'result' && onlineActive && onlineState) {
    const state = onlineState, block = el('div', 'play-result-copy'), actions = el('div', 'play-result-actions');
    block.append(el('h3', '', onlineResult(state)), el('p', '', state.view?.result?.reason === 'resignation' ? 'The game ends by resignation.' : state.view?.result?.reason === 'agreement' ? 'Both players agree to a draw.' : state.view?.result?.reason === 'timeout' ? 'The move time ends.' : state.view?.result?.reason === 'checkmate' ? 'Checkmate.' : 'The game ends.'));
    if (state.rematch === 'theirs') actions.append(button('Accept rematch', { kind: 'main', onPress: () => { void people!.controller!.rematch('accept'); } }), button('Decline', { onPress: () => { void people!.controller!.rematch('decline'); } }));
    else if (state.rematch === 'accepted' && state.rematchGame) actions.append(button('Open rematch', { kind: 'main', onPress: () => shell.go({ place: 'online', entry: state.rematchGame! }) }));
    else if (state.rematch === 'mine') block.append(el('p', '', 'Waiting for a rematch answer.'));
    else if (state.rematch !== 'closed') actions.append(button('Rematch', { kind: 'main', onPress: () => { void people!.controller!.rematch('offer'); } }));
    if (state.view && humanOpponent(state.view)) {
      const options: HTMLButtonElement = button('Player options', { onPress: () => playerOptions(people!.safety, { game_id: state.view!.game_id }, options, () => { void people?.controller?.refresh(); }) }); actions.append(options);
    }
    actions.append(button(text.home, { onPress: () => shell.go({ place: 'play' }) })); block.append(actions); detail.append(block); return;
  }
  if (reading === 'result') {
    const won = game.status === 'checkmate' && game.pos.turn === cpu(), lost = resultCause === text.resigned || (game.status === 'checkmate' && !won);
    const art = el('div', 'play-result-art'); art.append(el('div', 'play-stage-floor'), figure(kingFile(lost ? cpu() : player)));
    const result = resultText(game.status, resigned != null, game.pos.turn, player);
    const copy = el('div', 'play-result-copy'), body = el('div', 'play-result-body');
    const cause = lost && resigned == null ? replySteps.map(step => sentence(step.before, step.move, true, cards(cpu()))).filter(Boolean).join(' ') : '';
    body.append(el('h3', '', result.title), el('p', 'play-result-cause', [result.cause, cause].filter(Boolean).join(' ')));
    const rematch = el('p', 'play-rematch-note', `Rematch: ${player ? 'Light' : 'Dark'} pieces. ${({ both: 'New powers and cards.', cards: 'New cards.', powers: 'New powers.', pieces: 'Same army and level.' } as const)[setup]}`);
    const actions = el('div', 'play-result-actions');
    actions.append(button(text.rematch, { kind: 'main', onPress: () => { void start(); } }), button(text.newGame, { onPress: () => { panelNext = true; home(true); } }), button(text.home, { onPress: () => home() }));
    copy.append(body, rematch, actions);
    const card = el('div', 'play-result'); card.append(art, copy); detail.append(card);
    actions.querySelector<HTMLButtonElement>('button')!.focus({ preventScroll: true }); return;
  }
  // The fault sits on the board, which waits: the reader has no room on a short screen.
  const onBoard = boardBox.querySelector<HTMLElement>('.play-fault');
  if (onBoard && onBoard.dataset.fault !== fault) onBoard.remove();
  if (fault) {
    if (onBoard?.isConnected) return;
    const block = errorState({ title: fault === 'art' ? sideText.artFailed : sideText.computerFailed, text: sideText.staysSaved, action: sideText.tryAgain, onAction: retryFault });
    block.classList.add('play-fault'); block.dataset.fault = fault; boardBox.append(block); return;
  }
  // The B reading area (stage "readingb", design sections 2 and 4): turn state, headline, subject, effects summary.
  // The words and their order are A's (reading decisions 17 to 22): the current action first, the lasting effects last.
  if (onlineActive && onlineState && (thinking || !choice.length && !draft.armed && selected == null) && !(shown && shown !== armedResource())) {
    const state = people?.controller?.state() ?? onlineState;
    actions ??= onlineActions(state);
    if (actions.childElementCount) {
      const status = el('section', 'online-status');
      status.append(el('p', 'play-turn-state', personTurn(state) ?? text.ready), actions); detail.append(status); return;
    }
  }
  const model = readerModel(), view = readerView(model, form, nodes);
  detail.append(view); fitReader(view, model);
  const portrait = view.querySelector<HTMLImageElement>('.play-art');
  if (portrait && pieceView === 'figures' && (selected != null || inspected != null) && !shown) void import('./portrait-idle').then(({ portraitIdle }) => { if (portrait.isConnected) stopPortrait = portraitIdle(portrait, () => calm()); });
}
const line = (className: string, content: string) => el('p', className, gameWords(content));
/** After a free action alone (a mark that does not end the turn): what is possible next (reading decision 20). */
const freeText = () => draft.length > 0 && draft.open && !!draft.now.free ? freeLine(spentName(draft.steps.at(-1)!.move), draft.canFinish, draft.legal.some(m => !m.pass && !armKey(m))) : '';
/** The painting of a card that a move plays (joy item 5): only for a side that plays cards. */
function playedCard(side: Color, move?: Move): string | undefined {
  if (!move?.power || !cards(side)) return undefined;
  const k = game.context.rules.hands[side].indexOf(TAG_POWER[move.power as PowerTag] as never);
  return k < 0 ? undefined : cardArt(side, k);
}
/** The small turn state of the B reader (design section 4, column "Turn state"). */
function turnState(mine: boolean, code: number): string {
  const state = onlineActive && (people?.controller?.state() ?? onlineState), onlineLine = state && personTurn(state);
  if (onlineLine) return onlineLine;
  if (thinking) return acting ? readingBText.computerTurn : text.thinking;
  if (mine && !choice.length) return text.check;
  if (draft.length) return freeText() || !draft.canFinish || (form === 'compact' && !!(shown ?? armedResource())) ? text.notFinal : text.draft;
  return fresh() && !replySteps.length && !code && !shown && !draft.armed && !player ? text.first : text.ready;
}
/** The words of the reading area in each state, from the A functions of texts.ts, placed in the B slots. */
function readerModel(): ReaderModel {
  if (arrangement && !ended) return { state: arrangementWaiting() ? arrangeText.wait : arrangeText.title,
    title: notice || arrangementWaiting() ? '' : arrangeText.instruction, named: form === 'compact', headTools: [],
    primary: [...(notice ? [line('play-notice', notice)] : []), ...(arrangementWaiting() ? [] : [line('play-arrange-rule', `${notice ? arrangeText.instruction + ' ' : ''}${arrangement.error ?? arrangeText.legal}`)])],
    secondary: [], tools: [], summary: null };

  const res = shown ?? armedResource(), square = inspected ?? selected, code = draft.position.board[square ?? -1];
  const check = choice.length ? { mine: false, lines: [] as string[] } : checkLines(game.context, draft.position, player), checks = check.lines.map(t => line('play-check', t));
  const help = controls.help.textContent ?? '', notices = notice ? [line('play-notice', notice)] : [];
  const m: ReaderModel = { state: turnState(check.mine, code), title: '', named: false, headTools: [], primary: [], secondary: [], tools: [], summary: null };
  if (!onlineActive && writer.blocked) {
    Object.assign(m, { title: writer.warning, tools: [button('Load the newer game', { onPress: () => {
      const now = readStored();
      if (!now.resume) { liveGame = false; home(); return; }
      writer.load(now.save); void start({ ...now.resume, level: levelOf(now.save!.skill) });
    } })] });
    return m;
  }
  if (choice.length) {
    const at = draft.position.board[choiceSquare];
    const target = at ? `${nameOf(at)} on ${sqName(choiceSquare)}` : sqName(choiceSquare);
    Object.assign(m, { state: form === 'compact' ? target : m.state, title: choicePrompt(choice), named: true, headTools: [choiceCancel], primary: [...(form === 'compact' ? [] : [line('play-target', target)]), ...notices], tools: [choiceBox] });
  } else if (res?.card === -1) rivalCardsModel(m, res);
  else if (res) {
    const armed = res === armedResource();
    // The name, "?" and Cancel (or Close) share the headline row (option e1); the next step comes first in the subject.
    const parts = subjectModel(m, res.subject, res.side, res.control, res.card ?? undefined, closeX(armed ? `Cancel ${res.name}` : `Close ${res.name}`, () => {
      if (armed) pressResource(res); else { shown = null; notice = ''; reading = ended ? 'result' : 'normal'; update(); }
      res.control.focus({ preventScroll: true });
    }));
    m.primary = [...notices, ...(armed ? [line('play-step', armedStep(draft.armedMoves, draft.now, selected, player))] : []), ...(armed && res.hint ? [line('play-first-step', res.hint)] : []), ...checks];
    m.secondary = [...(parts.owner ? [parts.owner] : []), parts.short, line('play-mark-line', '')];
  } else if (draft.length) {
    m.state ||= text.ready;
    Object.assign(m, { title: freeText() || help || text.endChain, primary: checks });
  } else if (code && !ended) {
    // The piece's own effect lines come before its general rule (reading decision 18).
    const parts = subjectModel(m, { kind: 'piece', type: typeOf(code) }, colorOf(code), cells[square!]);
    m.primary = [...notices, ...checks];
    m.secondary = [...selectionLines(game.context, draft.position, square!, draft.base.turn, player).map(t => line('play-select-effect', t)), parts.short, line('play-mark-line', '')];
  } else if (thinking) {
    // The computer chooses: the state alone. The computer acts: the sentence of the step that plays.
    const [first = '', ...rest] = sentences(acting); Object.assign(m, { title: notice || first, secondary: (notice && first ? [first, ...rest] : rest).map(t => line('play-last', t)), art: playedCard(cpu(), playingAction?.move) });
  } else {
    // History keeps the newest action; the reader gives only the current state and a short hint.
    Object.assign(m, { title: notice || (check.mine ? check.lines[0] : ''),
      primary: checks.slice(check.mine && !notice ? 1 : 0), secondary: [line('play-notice', text.choose)] });
  }
  if (symbolsHint && pieceView === 'figures' && !draft.length) m.primary.push(line('play-symbols-hint', text.symbolsHint));
  if (onlineActive) { m.title = gameWords(m.title); m.state = gameWords(m.state); for (const node of [...m.primary, ...m.secondary]) { const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT); while (walk.nextNode()) walk.currentNode.textContent = gameWords(walk.currentNode.textContent ?? ''); } }
  if (writer.warning && !onlineActive) {
    m.primary.unshift(line('play-notice', writer.warning));
  }
  return m;
}
/** Temporary panels stay in the rail on wide screens. Outside input closes only. */
function closeFloating(focus = true) {
  const ruleLabel = reading === 'rule' ? ruleReturnLabel : '';
  const target = scrollOpen ? historyButton : floatingSource;
  scrollOpen = null; closeLearning(false); shown = null;
  if (reading === 'menu') reading = ended ? 'result' : 'normal';
  update(); const returned = ruleLabel ? detail.querySelector<HTMLElement>(`[aria-label="${CSS.escape(ruleLabel)}"]`) ?? target : target;
  if (focus && returned?.isConnected) returned.focus({ preventScroll: true });
}
function toggleScroll(kind: 'history', source: HTMLElement) {
  const open = scrollOpen !== kind; closeFloating(false); scrollOpen = open ? kind : null;
  renderHistory(); placeFloating();
  (open ? scrollPanel.querySelector<HTMLButtonElement>('button') : source)?.focus({ preventScroll: true });
}
function currentHistory() {
  return historyGroups(game.history, stepLines(), (before, move) => gameWords(sentence(before, move, before.turn !== player, cards(before.turn))),
    (turn, side) => `${Math.ceil(turn / 2)} · ${side === player ? text.you : onlineActive ? 'Opponent' : text.computer}`, text.stagedTurn);
}
function renderHistory() {
  if (!historyStrip) return;
  const groups = currentHistory(), preview = historyPreview(groups, erased);
  const records = preview.map(item => { const record = el('span', 'play-history-record', item.line); record.dataset.historyKey = item.key; if (item === erased) record.classList.add('play-ink-wipe'); return record; });
  historyButton.querySelector('[data-button-label]')!.replaceChildren(...(records.length ? records : [el('span', 'play-history-record', text.noHistory)]));
  historyButton.setAttribute('aria-label', `${text.history}: ${preview.map(item => item.line).join(' ') || text.noHistory}`);
  historyButton.setAttribute('aria-expanded', String(scrollOpen === 'history'));
  scrollPanel.hidden = !scrollOpen;
  if (!scrollOpen) { scrollPanel.dataset.kind = ''; return; }
  const was = scrollPanel.dataset.kind; scrollPanel.dataset.kind = scrollOpen;
  const focused = scrollPanel.contains(document.activeElement);
  const head = el('div', 'play-panel-head'), title = text.history;
  const heading = el('h3', '', title); heading.id = 'play-scroll-title'; scrollPanel.setAttribute('aria-labelledby', heading.id);
  head.append(heading, closeX(`Close ${title.toLowerCase()}`, () => closeFloating()));
  const body = el('div', 'play-panel-body');
  if (erased) { const ink = line('play-history-line play-ink-wipe', erased.line); body.append(ink); }
  groups.forEach(group => { const section = el('section', 'play-history-turn'); section.append(el('h4', '', group.title)); group.lines.forEach(item => { const ink = line('play-history-line', item.line); ink.dataset.historyKey = item.key; section.append(ink); }); body.append(section); });
  if (!groups.length && !erased) body.append(line('', text.noHistory));
  scrollPanel.replaceChildren(head, body);
  if (focused) scrollPanel.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  if (was !== scrollOpen && !calm() && !matchMedia('(prefers-reduced-motion: reduce)').matches) scrollPanel.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0)' }], { duration: 200, easing: 'ease-out' });
}
function placeFloating() {
  if (!reader || !screen) return;
  // A power or card panel floats only in the normal reading: the result stays in its docked place (decision 124).
  const source = reading === 'menu' ? menuButton : reading === 'rule' ? panelReturn : reading === 'normal' && shown && shown !== armedResource() ? shown.control : undefined;
  const wasFloating = reader.dataset.floating === 'true';
  reader.dataset.floating = String(!!source);
  reader.classList.toggle('kd-paper', !!source);
  if (floatingSource && floatingSource !== source) floatingSource.setAttribute('aria-expanded', 'false');
  floatingSource = source ?? null;
  if (source) { source.setAttribute('aria-controls', reader.id); source.setAttribute('aria-expanded', 'true'); }
  reader.setAttribute('aria-label', reading === 'menu' ? text.menu : reading === 'rule' ? text.fullRule : shown?.name ?? text.last);
  menuButton.setAttribute('aria-expanded', String(reading === 'menu'));
  const place = (panel: HTMLElement, anchor: HTMLElement) => {
    const box = screen.getBoundingClientRect(), at = panel === reader && reading === 'rule' && ruleAnchor ? ruleAnchor : anchor.getBoundingClientRect();
    const rail = screen.dataset.layout === 'wide', left = rail ? parseFloat(screen.style.getPropertyValue('--board-x')) + parseFloat(screen.style.getPropertyValue('--board')) + parseFloat(screen.style.getPropertyValue('--gap')) : Math.max(4, at.left - box.left);
    const width = Math.min(rail ? parseFloat(screen.style.getPropertyValue('--rail')) : 380, box.width - 8);
    const below = at.bottom - box.top, above = at.top - box.top;
    const top = box.height - below < 220 ? Math.max(4, above - 380) : Math.max(4, below);
    panel.style.setProperty('--panel-left', `${Math.min(left, box.width - width - 4)}px`);
    panel.style.setProperty('--panel-top', `${top}px`); panel.style.setProperty('--panel-width', `${width}px`);
    panel.style.setProperty('--panel-height', `${Math.max(88, box.height - below < 220 ? above - top : box.height - top - 8)}px`);
  };
  if (source) { place(reader, source); if (!wasFloating && keyed) detail.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }); }
  if (scrollOpen) place(scrollPanel, historyButton);
}
function outsidePanel(event: Event) {
  if (event.type === 'pointerdown') swallowedPointer = false;
  if (document.body.dataset.page !== 'game' || document.querySelector('dialog[open]')) return;
  const target = event.target as Node, active = scrollOpen ? scrollPanel : reader?.dataset.floating === 'true' ? reader : null;
  const control = scrollOpen ? historyButton : floatingSource;
  if (!active || active.contains(target) || control?.contains(target)) return;
  event.preventDefault(); event.stopImmediatePropagation(); closeFloating(); swallowedPointer = event.type === 'pointerdown';
}
document.addEventListener('pointerdown', outsidePanel, true);
document.addEventListener('pointercancel', () => { swallowedPointer = false; }, true);
document.addEventListener('click', event => {
  if (swallowedPointer) { swallowedPointer = false; if (event.detail) { event.preventDefault(); event.stopImmediatePropagation(); return; } }
  outsidePanel(event);
}, true);

/** The computer's cards (option b1): four named rows; a row opens its rule and arms nothing. */
function rivalCardsModel(m: ReaderModel, res: Resource) {
  const used = (thinking ? game.pos : draft.position).used?.[cpu()] ?? 0;
  const rows = game.context.rules.hands[cpu()].map((id, k) => {
    const row = button(cardName(id), { onPress: () => {
      ruleAnchor = row.getBoundingClientRect(); ruleReturnLabel = '';
      learning = { subject: { kind: 'card', id }, side: cpu(), cardIndex: k }; panelReturn = res.control; reading = 'rule'; update(); detail.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    } });
    row.classList.add('play-rival-row'); if (used >> k & 1) row.append(' ', el('small', '', readingBText.used)); return row;
  });
  const close = closeX(`Close ${res.name}`, () => { shown = null; notice = ''; update(); res.control.focus({ preventScroll: true }); });
  const list = el('div', 'play-rival-rows'); list.append(...rows);
  Object.assign(m, { title: res.name, named: true, headTools: [close], primary: [list] });
}
/** The name, New, art and "?" of a piece, power or card (design section 2), with its owner line and short line (A). */
function subjectModel(m: ReaderModel, subject: LearnSubject, side: Color, source: HTMLElement, cardIndex?: number, action?: HTMLButtonElement) {
  const entry = learningEntry(subject, game.context, draft.position, side, cardIndex);
  const question = button('?', { onPress: () => {
    ruleAnchor = question.getBoundingClientRect(); ruleReturnLabel = question.getAttribute('aria-label') ?? '';
    learning = { subject, side, cardIndex }; panelReturn = source; reading = 'rule'; update(); detail.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  } }); question.setAttribute('aria-label', `All about the ${entry.name}`);
  const art = subject.kind === 'piece' ? `/ui/pieces/${subject.type === K ? kingFile(side) : `${entry.name.toLowerCase()}-${side ? 'b' : 'w'}`}.webp` : subject.kind === 'power' ? `/ui/pieces/${kingFile(side)}.webp` : cardIndex != null ? cardArt(side, cardIndex) : entry.art;
  Object.assign(m, { title: entry.name, named: true, isNew: entry.isNew, art, headTools: [question, ...(action ? [action] : [])] });
  // A power names its owner; the computer's power reads in the third person (reading decision 22).
  return { owner: subject.kind === 'power' ? line('learn-owner', `${side === cpu() ? readingText.computerPower : readingText.yourPower} · ${entry.uses}`) : null,
    short: line('learn-short', side === cpu() && subject.kind === 'power' ? opponentLines[subject.id] ?? entry.short : entry.short) };
}
function closeLearning(focus = true) {
  const was = reading === 'rule'; panel?.dispose(); panel = null; learning = null;
  if (was) reading = 'normal';
  if (was && focus) {
    update(); (panelReturn?.isConnected ? panelReturn : cells[cursor])?.focus({ preventScroll: true });
  }
}
const replyText = () => [...replySteps.flatMap(step => effectEndLines(game.context, step.before, step.move, step.after, player)), ...replySteps.map(step => sentence(step.before, step.move, true, cards(cpu()))).filter(Boolean)].join(' ');
const cardArt = (side: Color, k: number) => { const id = game.context.rules.hands[side][k], art = RELEASED_CARDS.find(c => c.id === id)?.art; return `/${art ?? 'ui/cards/back.webp'}`; };
/** The power as an enamel object: its name and its uses left. The computer's power only reads. */
function addPower(side: Color, parent: HTMLElement) {
  const r = game.context.rules, king = r.kings[side];
  if (!king) return;
  const uses = usesAllowed(king.power, r);
  const res: Resource = { subject: { kind: 'power', id: king.power }, side, key: uses ? POWER_TAG[king.power] ?? null : null, name: POWER_NAME[king.power], short: powerLines[king.power] ?? '', card: null, control: button(POWER_NAME[king.power], { onPress: () => pressResource(res) }) };
  const coin = el('span', 'play-power-coin'), emblem = el('img'); emblem.src = `/ui/emblems/${king.king.toLowerCase()}.webp`; emblem.alt = '';
  const notches = el('span', 'play-power-notches'); notches.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < (uses ?? 0); i++) notches.append(el('i', 'play-power-notch'));
  coin.append(emblem, notches);
  res.control.classList.add('play-power'); res.control.prepend(coin); res.control.append(el('small')); resources.push(res); parent.append(res.control);
}
/** The four shared cards as painted cards. The Ribbon setting hides the paintings. */
function addCards(parent: HTMLElement) {
  const r = game.context.rules, hand = el('div', 'play-hand'); hand.setAttribute('role', 'group'); hand.setAttribute('aria-label', text.yourCards); parent.append(hand);
  r.hands[player].forEach((card, k) => {
    const key = card === 'MirrorB' ? 'mirrorb' : (Object.keys(TAG_POWER) as PowerTag[]).find(tag => TAG_POWER[tag] === card) ?? null;
    const res: Resource = { subject: { kind: 'card', id: card }, side: player, key, name: cardName(card), short: powerLines[card] ?? '', card: k, control: button(cardName(card), { onPress: () => pressResource(res) }) };
    const art = el('img'); art.src = cardArt(player, k); art.alt = ''; res.control.prepend(art); res.control.append(el('small', 'play-card-state'));
    // Keep words intact when a two-word card name wraps at the top edge.
    const words = res.name.split(' '), label = res.control.querySelector('[data-button-label]')!;
    label.replaceChildren(...words.flatMap((word, i) => [...(i ? [' '] : []), el('span', '', word)]));
    res.control.classList.add('play-card'); res.control.style.setProperty('--fan-angle', `${(k - (r.hands[player].length - 1) / 2) * 4}deg`);
    res.control.style.setProperty('--fan-drop', `${Math.abs(k - (r.hands[player].length - 1) / 2) * 2}px`); resources.push(res); hand.append(res.control);
  });
}
/** The accessible name of the computer's card group: each name and its used state (design section 5, b1). */
const rivalLine = (used: number) => `${readingBText.rivalCards}: ${game.context.rules.hands[cpu()].map((id, k) => `${cardName(id)}${used >> k & 1 ? `, ${readingBText.used.toLowerCase()}` : ''}`).join('; ')}.`;
/** The computer's four cards as one group in its strip (option b1): four small marks in the dealt order and one 44 px target. */
function addRivalCards(parent: HTMLElement): Resource {
  const res: Resource = { subject: { kind: 'card', id: game.context.rules.hands[cpu()][0] }, side: cpu(), key: null, name: gameWords(readingBText.rivalCards), short: '', card: -1, control: button(gameWords(readingBText.rivalCards), { onPress: () => {
    res.short = rivalLine((thinking ? game.pos : draft.position).used?.[cpu()] ?? 0); pressResource(res);
  } }) };
  res.control.classList.add('play-rival-cards');
  res.control.append(el('span', 'play-rival-count', String(game.context.rules.hands[cpu()].length)));
  res.control.setAttribute('aria-label', `${text.cardsLeft(game.context.rules.hands[cpu()].length)}. ${gameWords(rivalLine(0))}`);
  res.control.prepend(...game.context.rules.hands[cpu()].map((_, k) => { const mark = el('span', 'play-rival-mark'); mark.style.backgroundImage = `url('${cardArt(cpu(), k)}')`; return mark; }));
  parent.append(res.control); return res;
}
function pressResource(res: Resource) {
  if (arrangement) return;
  if (!onlineActive && writer.blocked) return;
  if (ended) return; // after the end the result card keeps its place (reading decision 21)
  closeLearning(false); skipBoard();
  if (ended) return; // the last reply can end the game inside skipBoard: the result keeps its place (decision 129)
  clearChoice(); selected = inspected = null; reading = 'normal'; shown = res;
  const spent = res.control.dataset.spent === 'true', short = res.side === cpu() && res.subject.kind === 'power' ? opponentLines[res.subject.id] ?? res.short : res.short;
  // The owner line of the reading area names who has a power; the cancel line names a card or a power (reading decisions 19 and 22).
  if (res.side === cpu() || !res.key) notice = '';
  else if (draft.armed === res.key) { draft.arm(res.key); shown = null; res.hint = undefined; notice = ''; update(); announce(cancelLine(res.subject.kind)); return; }
  else if (spent) notice = text.spent;
  else if (thinking) notice = fault ? sideText.computerFailed : text.wait;
  else if (!draft.armable(res.key)) notice = draft.open ? text.noTarget : text.notYet;
  else {
    draft.arm(res.key); notice = ''; resources.forEach(r => { r.hint = undefined; });
    const key = subjectKey(res.subject); if (!readHints().has(key)) res.hint = stepLine(res.subject);
  }
  update();
  if (res.hint && draft.armed === res.key) markHintSeen(subjectKey(res.subject));
  const owner = res.card == null ? ` ${res.side === cpu() ? readingText.computerPower : readingText.yourPower}${res.key ? '' : ', always on'}.` : '';
  announce(`${res.name}.${owner} ${short} ${notice || (draft.armed === res.key && res.key ? armedStep(draft.armedMoves, draft.now, null, player) : '')}${res.hint ? ` ${res.hint}` : ''}`.trim());
}
function applyPieceView() { board?.setSymbols(pieceView === 'symbols' ? symbolImage : undefined); setMotion(); }
// The scene has no travel for a symbol: symbols show each result at once.
// Interface motion follows the system setting and Motion speed Off (play/motion.ts reads the attribute).
function setMotion() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  setInterfaceMotion(motion, reduce);
  board?.setMotion(reduce || pieceView === 'symbols' ? 'off' : motion);
}
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', setMotion); setMotion();
/** The layout classes of decision 34 (layout.ts). The game box is the viewport after the safe areas, so its size is W and H. */
function layout() {
  if (!boardBox?.isConnected) return;
  const l = gameLayout(screen.clientWidth, screen.clientHeight, gameType(game.context.rules)), changed = form !== l.form;
  form = l.form;
  Object.assign(screen.dataset, { layout: l.kind === 'rail' ? 'wide' : 'portrait', form: l.form, narrow: String(l.narrow), ownRows: String(l.ownRows), roomy: String(l.kind === 'stack' && l.form === 'tall'), short: String(l.form === 'compact'), tight: String(l.kind === 'rail' && l.reader + l.opp < 200) });
  const values = { board: l.board, head: l.head, opp: l.opp, own: l.own, fin: l.fin, reader: l.reader, scroll: l.scroll, 'usable-height': l.H, rail: l.col, col: (l.W - l.col) / 2, gap: l.gap, 'rail-top': l.railTop, 'rail-h': l.railH, 'board-x': l.boardX, 'board-y': l.boardY };
  for (const [name, value] of Object.entries(values)) screen.style.setProperty(`--${name}`, `${value}px`);
  // A rotation or a resize keeps the draft, the selection and the save; only the places change.
  if (changed) { resetFit(); update(); } else fitResult();
}
// The layout runs again when the game box changes size: a resize, a rotation, or safe-area values that arrive or change (iOS need P3).
const fit = new ResizeObserver(() => layout());
window.addEventListener('resize', () => { layout(); placeFloating(); });
function drawMarks() {
  if (!board) return;
  if (arrangement && !ended) { board.select(arrangement.selected); board.mark(arrangement.marks()); return; }
  const source = draft.chain ? draft.previewMove!.from : selected;
  const picked = source != null && !thinking && !ended, targets = picked ? draft.targets(source) : [];
  board.select(picked ? draft.chain ? draft.captures.at(-1)! : source : null, targets, targets.filter(sq => draft.at(source!, sq)[0].captures.includes(sq)));
  const options = !playingAction && performance.now() < nextMarksAt ? [] : playingAction ? [playingAction.move] : picked ? draft.options(source) : !thinking && !ended ? draft.armedMoves : [];
  const pos = playingAction?.before ?? (thinking ? game.pos : draft.position);
  const chooseActor = !playingAction && source == null && !!draft.armed && !options.every(isDirect);
  const preview = chooseActor ? actorMarks(draft.now, options, markFocus) : previewMarks(game.context, playingAction?.before ?? draft.now, options, markFocus, playingAction ? [] : draft.captures, picked ? draft.captures.at(-1) ?? source : undefined);
  const focus = preview.rings.find(r => r.role === 'focus')?.square;
  const hits = options.filter(m => m.captures.includes(focus!) || (m.shove?.from ?? m.to) === focus);
  // A square with a later choice (a new piece, a returned piece, capture or push) has no one result to name (check "play" fault 4).
  const action = new Set(hits.map(m => `${m.promo}:${m.drop}:${!!m.shove}`)).size > 1 ? undefined : hits.sort((a, b) => b.captures.length - a.captures.length)[0];
  const route = routeLine(preview), states = stateDescriptions(game.context, pos, player);
  const line = detail.querySelector<HTMLElement>('.play-mark-line');
  if (line) {
    const height = line.getBoundingClientRect().height;
    // A candidate action shows only for the square that the pointer or the keyboard is on, with its label (reading decision 22).
    line.textContent = action && !playingAction && focus === markFocus ? `${readingText.possible} ${[sentence(draft.now, action, false, cards(player)), route].filter(Boolean).join(' ')}` : '';
    // Keep the action space while the next-step marks pause or change their text.
    line.style.minHeight = `${Math.max(height, line.getBoundingClientRect().height)}px`;
  }
  if (!playingAction) for (const cell of cells) {
    const square = Number(cell.dataset.square), moves = picked ? draft.at(source, square) : options.filter(m => m.from === square);
    const descriptions = states.filter(state => state.squares.includes(square)).map(state => state.line);
    if (moves.length) descriptions.push(chooseActor ? `Choose this piece for ${armedResource()?.name}.` : `${readingText.possible} ${moves.map(m => sentence(draft.now, m, false, cards(player))).join(' ')}`);
    if (route && preview.steps.some(step => step.square === square)) descriptions.push(route);
    if (descriptions.length) cell.setAttribute('aria-description', descriptions.join(' '));
    else cell.removeAttribute('aria-description');
  }
  // Playback holds its target. The next board input clears the opponent cue.
  const marks = mergeMarks(resultMarks(pos, (playingAction ? lastActions.slice(0, -1) : lastActions).filter(action => action.before.turn === cpu())), preview, stateMarks(game.context, pos));
  if (checkPulse) {
    const t = Math.min(1, (performance.now() - checkPulse.at) / time(200)), half = t < .5 ? t * 2 : (1 - t) * 2;
    for (const ring of marks.rings) if (ring.role === 'state' && ring.square === checkPulse.square) ring.size = (ring.size ?? 1) * (1 + .06 * (1 - (1 - half) ** 3));
  }
  board.mark(marks);
}
/** Both settings places (You and the Menu) use these handlers and the same save writer, in one order (launch decision 24). */
function settings(): Settings {
  const write = () => { if (!onlineActive) writer.settings(prefs(), () => snapshot(draft, resigned, player)); else { const stored = readStored(); if (stored.save) writer.settings({ ...prefs(), skill: stored.save.skill ?? SKILLS[gameLevel] }, () => stored.save!); } };
  return {
    pieceView, handView, coords, sound, motion,
    setPieceView: value => { pieceView = value; store('kingdown.piece-view', pieceView); applyPieceView(); },
    setHandView: value => { handView = value; store('kingdown.hand', handView); if (screen) screen.dataset.hand = handView; },
    setCoords: on => { coords = on; if (screen) screen.dataset.coords = String(coords); write(); },
    setSound: on => { sound = on; sfx?.setSound(sound); if (sound) sfx?.unlockSound(); write(); },
    setMotion: value => { motion = value as Pace; setMotion(); write(); },
  };
}
function renderPlace(route: Route) {
  homePoll?.update();
  if (route.place === 'online') { void openOnline(route.entry!); return; }
  if (route.place === 'join') {
    onlineActive = false; people?.stopGame();
    void loadPeople().then(async host => { const { landingPage } = await import('../people/screens/landing'); if (shell.route.place === 'join') { document.body.dataset.page = 'join'; root.replaceChildren(landingPage(host.host, route.entry ?? '')); } }).catch(() => shell.go({ place: 'play' })); return;
  }
  if (route.place === 'person') { home(); void personFlow(); return; }
  if (onlineActive) { onlineActive = false; onlineState = undefined; people?.stopGame(); liveGame = false; }
  closeLearning(false); closeGuidePanel();
  if (route.place === 'game') {
    if (liveGame && !ended) { void start({ game, draft, level: gameLevel, player }); return; }
    const now = readStored();
    if (now.resume) { writer.load(now.save); void start({ ...now.resume, level: levelOf(now.save!.skill) }); return; }
    shell.go({ place: 'play' }); return;
  }
  if (route.place === 'play') { home(); return; }
  boardReplay.cancel(); generation++; engine.cancel(); endOpening(); endEntry(); endCardFlight(); cancelCheckPulse(); board?.dispose(); board = undefined; endReply = null;
  document.body.dataset.page = route.place;
  if (route.place === 'guide') root.replaceChildren(guidePage(route.section, route.entry, (section, entry) => shell.go({ place: 'guide', ...(section && { section }), ...(entry && { entry }) }), announce));
  else {
    const reset = button('Reset hints', { onPress: () => { const saved = resetHints(); resources.forEach(r => { r.hint = undefined; }); const line = saved ? 'Hints reset.' : 'Hints reset for this visit. This device cannot store the reset.'; resetNote.textContent = line; announce(line); } });
    reset.classList.add('reset-hints'); const resetNote = el('p', 'reset-note');
    root.replaceChildren(youPage(settings(), { figure: () => figure(kingFile(0, { kings: [null, null] })), symbol: () => image(A), card: art.card, reset: [reset, resetNote] }));
    showAccount(people);
    void loadPeople().then(showAccount).catch(() => {});
  }
}
function showAccount(host?: OnlineHost) {
  if (shell.route.place !== 'you') return;
  root.querySelector('.you-account')?.remove();
  const section = el('section', 'you-account'), me = host?.host.me();
  section.append(el('h2', '', 'Account'));
  if (host && me) {
    const blocked: HTMLButtonElement = button('Blocked players', { onPress: () => blockedPlayers(host.safety, blocked) });
    const remove: HTMLButtonElement = button('Delete account', { kind: 'danger', onPress: () => deleteAccount(remove, host.deletion) });
    section.append(profilePortrait(me.handle ?? host.user?.name ?? 'Player', host.user?.avatar), el('p', '', me.handle ?? 'Player'), button('Sign out', { onPress: () => { void host.signOut().catch(() => announce('Sign-out cannot finish. Try again.')); } }), blocked, remove);
  }
  else if (!host) section.append(el('p', '', 'Checking sign-in…'));
  else section.append(button('Sign in to play a person', { onPress: () => { void personFlow(); } }));
  root.querySelector('.you-page > h1')?.after(section);
}
const shell = mountShell(root, renderPlace);
// Home does not wait for the symbol files (launch decision 45): the small board and the Symbols view take them when they come.
shell.start();
homePoll = runPoll(() => document.body.dataset.page === 'home' && shell.route.place === 'play' && people?.signedIn
  ? { view: people.views.find(view => view.status === 'playing' || view.status === 'waiting' || view.status === 'setup') ?? 'waiting for a join', read: () => people!.refresh(), fastStart: true }
  : undefined);
const idle = (task: () => void) => 'requestIdleCallback' in window ? requestIdleCallback(task, { timeout: 2000 }) : setTimeout(task, 1000);
idle(() => { loadBoardCode().catch(() => {}); void loadPeople().catch(() => {}); });
setInterval(() => { if (onlineActive && onlineState) update(); }, 30_000);
addEventListener('pagehide', () => people?.stopGame());
void symbolsReady.then(() => { applyPieceView(); document.querySelectorAll<HTMLImageElement>('.mini-glyph[data-code]').forEach(img => { img.src = symbol(Number(img.dataset.code)); }); });
