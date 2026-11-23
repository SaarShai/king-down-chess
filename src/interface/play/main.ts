import '../ui/tokens.css';
import '../ui/components.css';
import './play.css';
import './shell.css';
import './sides.css';
import './menus.css';
import './reading-b.css';
import { historyGroups } from './history';
import { mountShell, type Route } from './shell';
import { guidePage, closeGuidePanel } from './guide';
import { button, closeX, icon, confirmDialog, errorState, liveRegion, setButtonState, targetChoice } from '../ui/kit.js';
import { turnControls } from '../ui/turn-controls';
import type { Board, Move, Pace, Position } from '../board-api';
import { Game, Engine } from '../../game';
import { inApp } from '../../platform';
import { gameJSON, readSave } from '../../screen/save';
import { skillPlan } from '../../ai/skill';
import { learningEntry, firstMinute, stepLine, subjectKey, type LearnSubject } from './learning';
import { alwaysOnLabel } from './help/content';
import { createGameHelp } from './help/panel';
import { refusalReason, type Refusal } from './help/reasons';
import { markHintSeen, readHints } from './hints';
import { refusalForTap } from './refusals';
import { lastReplySteps, replayController, undoReplayState, type ReplayStep } from './replay';
import { S, K, PLAIN_KINGS, colorOf, findKing, sqName, typeOf, TAG_POWER, type Color, type PowerTag, type Rules, type Status } from '../../rules/engine';
import { toFen } from '../../rules/setup';
import { RELEASED_CARDS } from '../../content/cards';
import { POWER_NAME, POWER_TAG, cardName, coinState, usesAllowed } from '../../powers-ui';
import { DraftTurn, isDirect, armKey } from './turn';
import { Arrangement, ARRANGE_KEY } from './arrange';
import { actorMarks, mergeMarks, previewMarks, resultMarks, stateMarks, type MarkAction } from './marks';
import { cardLine, pieces, powerLines, text, sentence, draftSentences, squareLabel, effectEndLines, stateDescriptions, routeLine, versusLine, kingLabel, rematchLine, resultText } from './texts';
import { readingText, checkLines, armedStep, cancelLine, freeLine, opponentLines, choiceLabel, choicePrompt, spentName, readingBText, arrangeText } from './texts';
import { armCard, calm, cardFly, disarm, screenChange, setInterfaceMotion, sheetMotion, trackCard, time } from './motion';
import { at, burst, ease, edgeLight, hold, later, onFrame, pulse, reducedMotion, setFxMotion, setVibration as setFxVibration, setPauseHook, shake, sound as cue, Spring, startFx, streak, tween, type Effect } from './fx';
import { gameLayout, panelBox, type Form } from './layout';
import { fitReader, narratorView, readerNodes, readerView, resetFit, sentences, type ReaderModel } from './reader';
import { answerOffer, beforeNewGame, GAME_KEY, gameKeyOf, gameType, keepCopy, keptOffer, levelOf, readStored, SaveWriter, SKILLS, snapshot, gameFacts, savedPlayTime, storeChoice as store, storedChoice as stored, storedGameType, storedVibration, storeVibration, type GameType as Setup, type KeptOffer, type Level } from './saved';
import { arrowStep, fileLabelRow, rankLabelColumn, sideText, SIDE_CHOICES, SIDE_KEY, squareAt, type SideChoice } from './sides';
import { changeDraft, createDraft, OPTIONS_KEY, PANEL_KEY, readPanel, readOptions, rulesFor, startOf, type NewGameDraft } from './new-game';
import { playScreen, type Art } from './home';
import { newGamePanel } from './setup-table';
import { dismissSheet, gameMenu, settingsSheet, type Settings } from './menus';
import { allowedAvatarUrl } from '../../account/public-config';
import { computerPortrait, profilePortrait } from '../people/host/portrait';
import type { OnlineHost } from '../people/host/index';
import { ObsoleteAction } from '../people/server';
import type { PeopleState } from '../people/controller';
import { seatKingUnsaved } from '../people/seat-king';
import { homeInvite, personGame, personTurn, personWords } from '../people/host/games';
import { timeWords } from '../people/words';
import { runPoll } from '../../plugin/poll';
import { personText, signInText } from '../people/screens/copy';
import { blockedPlayers, deleteAccount, playerOptions, playerSafety } from '../people/screens/safety';
import { peopleSheet, type PeopleSheet } from '../people/screens/sheet';
import { signInSheet } from '../people/screens/sign-in';
import { humanOpponent } from '../../plugin/screens/board-model';


const root = document.querySelector<HTMLElement>('#app')!;
let homeView: ReturnType<typeof playScreen> | undefined;
const live = liveRegion(); document.body.append(live.element);
let announcement = 0;
const engine = new Engine({ waitReady: true, workClock: true });
interface Resource { subject: LearnSubject; hint?: string; side: Color; key: string | null; name: string; short: string; card: number | null; control: HTMLButtonElement }
// The game type and options of the next game (owner playtest section 2). 'kingdown.setup' held 'cards' for powers and cards before the four types.
let setup: Setup = storedGameType();
let options = readOptions((() => { try { return JSON.parse(localStorage.getItem(OPTIONS_KEY) ?? 'null'); } catch { return null; } })()), resources: Resource[] = [], shown: Resource | null = null;
let pieceView = stored('kingdown.piece-view', ['figures', 'symbols']);
// The next game's side choice, and the side of the live game (launch decision 10). The computer plays the other side.
let sideChoice = stored(SIDE_KEY, SIDE_CHOICES) as SideChoice, player: Color = 0;
const cpu = () => (player ^ 1) as Color;
const fresh = () => firstMinute(draft, player);
/** A page fault with one safe next step (launch decision 12): the art, or the computer's move. */
let fault: 'art' | 'computer' | null = null;
// Sound, coordinates, level and pace use the shared save fields.
const first = readStored(), kept = first.settings;
let level: Level = first.save || kept.skill !== undefined ? levelOf(kept.skill) : 'casual';
let motion: Pace = kept.pace === 'normal' || kept.pace === 'fast' || kept.pace === 'off' ? kept.pace : matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'normal';
let coords = typeof kept.coords === 'boolean' ? kept.coords : true, sound = typeof kept.sound === 'boolean' ? kept.sound : false;
let vibration = storedVibration();
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
  .then(([b, s]) => { boardCode = b; sfx = s; s.setSound(sound); if (sound) s.preloadArmour(); }, error => { codeLoad = undefined; codeFailed = true; throw error; }); };
// Sound unlocks on the first press after the sound code is loaded.
const unlock = () => { if (sound && sfx) { sfx.unlockSound(); document.removeEventListener('pointerdown', unlock, true); document.removeEventListener('keydown', unlock, true); } };
document.addEventListener('pointerdown', unlock, true); document.addEventListener('keydown', unlock, true);
// `next` is the next game (its army, kings, cards and side, launch decision 26); `game` stays the live game, so
// Continue can open it when it could not save.
let next: NewGameDraft = createDraft({ setup, level, sideChoice, options }), game = next.game, draft = new DraftTurn(game), board: Board | undefined;
let arrangement: Arrangement | undefined, arrangementGame = '';
let playedOptions = options;
let gameLevel: Level = level, resigned: Color | null = null, liveGame = false;
const writer = new SaveWriter(line => {
  if (document.body.dataset.page === 'game' && screen?.isConnected) showGameMessage(line);
  else announce(line);
});
const elapsedGame = () => playedMs + (enteredAt === undefined ? 0 : performance.now() - enteredAt);
function stopGameTime() { playedMs = elapsedGame(); enteredAt = undefined; }
const prefs = () => ({ skill: SKILLS[gameLevel], coords, sound, vibration, pace: motion });
/** Write the live game: its handed-over plies and its whole staged steps (decision 2). */
const save = (step: boolean) => onlineActive ? void people?.saveDraft() : writer.game(snapshot(draft, resigned, player, elapsedGame(), arrangement), prefs(), step);
let selected: number | null = null, inspected: number | null = null, cursor = 12;
let thinking = false, ended = false, generation = 0, reading: 'normal' | 'result' = 'normal';
// End active sequences when the player leaves the game.
let endResult: (() => void) | undefined, endReply: (() => void) | null = null, starting = 0, endVersus: (() => void) | null = null;
let endCardFlight = () => {}, checkFrame: Effect | undefined, checkPulse: { square: number; progress: number } | null = null;
let playedMs = 0, enteredAt: number | undefined, resultReview = false;
let lastActions: MarkAction[] = [], playingAction: MarkAction | null = null, markFocus: number | undefined, nextMarksAt = 0;
// The last input was a key: only keyboard focus on a square gives the candidate sentence (reading decision 22).
let keyed = false;
document.addEventListener('keydown', () => { keyed = true; }, true); document.addEventListener('pointerdown', () => { keyed = false; }, true);
let replySteps: ReplayStep[] = [];
const boardReplay = replayController();
let gameHelp: ReturnType<typeof createGameHelp> | undefined;
let last = '', notice = '', resultCause = '', choice: Move[] = [], choiceSquare = -1;
// The effect groups that the player opened, for this visit only (reading decision 18).

// Stage "readingb": the form of the layout, the persistent reader nodes, the open effects summary (its subject key),
// the computer's card group, and the computer's text while its reply plays.
let form: Form = 'tall', nodes = readerNodes(), rivalGroup: Resource | null = null, acting = '';
let screen: HTMLElement, boardBox: HTMLElement, boardHost: HTMLElement, reader: HTMLElement, detail: HTMLElement, choiceBox: HTMLElement;
let cells: HTMLButtonElement[] = [], choiceCancel: HTMLButtonElement;
let menuButton: HTMLButtonElement;
let historyStrip: HTMLElement, historyButton: HTMLButtonElement, historyCompact: HTMLElement, scrollPanel: HTMLElement;
let scrollOpen: 'history' | null = null, floatingSource: HTMLElement | null = null, swallowedPointer = false;
let seatFrame: Effect | undefined, rewind: Effect | undefined;
let seatRings: [HTMLElement, HTMLElement], stores: [HTMLElement, HTMLElement];
let counts: [number, number] = [0, 0];
let staged = false, silentStage = false;
const freezeArmed = () => draft.armed === 'freeze';


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
function decorativeImage(img: HTMLImageElement, src: string) {
  img.addEventListener('error', () => { img.style.visibility = 'hidden'; }, { once: true });
  img.alt = ''; img.src = src; return img;
}
/** A full figure: the board's own rest still (public/ui/pieces), so one piece looks the same everywhere. */
const figure = (file: string) => decorativeImage(el('img', 'play-figure'), `/ui/pieces/${file}.webp`);
const kingFile = (side: Color, rules: Pick<Rules, 'kings'> = game.context.rules) => `king-${(rules.kings[side]?.king ?? PLAIN_KINGS[side]).toLowerCase()}-${side ? 'b' : 'w'}`;
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
function showGameMessage(message: string) {
  screen.querySelector('.play-toast')?.remove();
  const notice = el('div', 'kd-toast play-toast');
  let stay: Effect | undefined;
  const close = () => {
    stay?.cancel(); notice.inert = true;
    tween(160, t => { notice.style.opacity = String(1 - t); }, { curve: ease.EASE, done: () => notice.remove() });
  };
  notice.append(el('p', '', message), closeX('Close notice', close)); screen.append(notice); announce(message);
  notice.addEventListener('click', event => { if (!(event.target as Element).closest('button')) close(); });
  cue('ting'); pulse('light');
  tween(240, t => { notice.style.transform = `translateY(${14 * (1 - t)}px)`; }, { curve: ease.OVER });
  if (!reducedMotion()) stay = later(1800, close);
}

function refuse(message: string, square?: number, reason?: Refusal | null) {
  notice = message;
  if (square != null && !freezeArmed()) cue('no');
  if (square != null) { const cell = cells[square]; cell.classList.remove('square-error'); void cell.offsetWidth; cell.classList.add('square-error'); }
  update();
  if (reason && square != null) gameHelp?.showRefusal(reason, cells[square], helpAvoid());
  announce(message);
}
/** The choices that the person accepted: the stored setup and side choice, and the level of the saved game. */
const accepted = () => ({ setup, level, sideChoice, options });
const gamesList = { expanded: false };
const homePreviews = new Map<string, string>();
const art: Art = {
  figure: (type, side, rules) => figure(type === K ? kingFile(side, rules) : `${pieces[type].name.toLowerCase()}-${side ? 'b' : 'w'}`),
  symbol,
  card: k => { const img = el('img'); img.src = `/${RELEASED_CARDS[k].art}`; img.alt = ''; return img; },
};
let people: OnlineHost | undefined, peopleReady: Promise<OnlineHost> | undefined, onlineActive = false, onlineState: PeopleState | undefined;
let peopleStatus: 'checking' | 'ready' | 'failed' = 'checking', accountNote = '';
const peopleLoadError = 'Online play cannot load. Check your connection and try again.';
const signInRetry = 'Sign-in does not finish. Try again.';
const showHomeSignIn = () => peopleStatus !== 'checking' && !people?.signedIn;
let homePoll: ReturnType<typeof runPoll> | undefined;
function gameWords(line: string) { return onlineActive ? personWords(line) : line; }
let mountingOnline = false, shownRevision = -1, onlineNote = '';
const inviteLinkStatus = el('p', 'home-status');
let inviteLinkTimer: ReturnType<typeof setTimeout> | undefined;
function clearInviteLinkStatus() {
  clearTimeout(inviteLinkTimer);
  inviteLinkStatus.remove();
}
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
    people ??= onlineHost({ rules: () => setup, setRules: value => { setup = value; next = changeDraft(next, { setup }); store(GAME_KEY, setup); },
      changed: () => {
        if (!people?.signedIn) clearInviteLinkStatus();
        if (document.body.dataset.page === 'home' && shell.route.place === 'play') home();
        showAccount();
      },
      home: () => { onlineActive = false; shell.go({ place: 'play' }); if (document.body.dataset.page === 'game') home(); },
      open: (id, line) => { onlineGameNotice = line ? { id, line } : undefined; shell.go({ place: 'online', entry: id }); },
      toast: message => {
        announce(message);
        if (message === personText.linkCopied) {
          clearInviteLinkStatus();
          inviteLinkStatus.textContent = message;
          root.querySelector('.home-start')?.prepend(inviteLinkStatus);
          inviteLinkTimer = setTimeout(clearInviteLinkStatus, 6000);
          return;
        }
        onlineNote = message;
        const line = root.querySelector<HTMLElement>('.home-note');
        if (line) line.textContent = message;
        else if (document.body.dataset.page === 'home') root.querySelector('.home-start')?.prepend(el('p', 'home-note', message));
      },
    });
    const returned = await people.init();
    peopleStatus = 'ready';
    if (returned.status !== 'none' && returned.route?.screen === 'you') {
      accountNote = returned.status === 'retry' ? signInRetry : '';
      shell.go({ place: 'play' }, true, true);
      openSettings(homeSettingsButton() ?? root);
      if (accountNote) announce(accountNote);
    } else if (returned.status === 'signed-in') {
      const route = returned.route;
      if (route.screen === 'new-friend') personFlow(null, true);
      else if (route.screen === 'join') shell.go({ place: 'join', entry: route.key ?? '' });
      else if (route.screen === 'game') shell.go({ place: 'online', entry: route.gameId });
    } else if (returned.status === 'retry') {
      onlineNote = signInRetry;
      if (shell.route.place === 'play') home();
      personFlow(null, false);
    }
    updateAccount();
    return people;
  }).catch(error => {
    peopleReady = undefined; peopleStatus = 'failed'; onlineNote = peopleLoadError;
    updateAccount();
    announce(onlineNote);
    throw error;
  });
}
function updateAccount() {
  const signIn = root.querySelector<HTMLButtonElement>('.play-home:not(.shell-departing) .home-sign-in');
  if (signIn) signIn.hidden = !showHomeSignIn();
  showAccount();
}
const homeSettingsButton = () => root.querySelector<HTMLButtonElement>('.play-home:not(.shell-departing) .home-settings-btn');

function accountSignIn(source: HTMLButtonElement, returnToSettings = false) {
  shell.settled(() => {
    if (!source.isConnected || shell.route.place !== 'play' || document.querySelector('dialog[open]')) return;
    const sheet = peopleSheet(source, () => {
      void shell.closeLayer().then(() => {
        if (shell.route.place !== 'play') return;
        if (returnToSettings) openSettings(homeSettingsButton() ?? root);
        else if (!source.isConnected) {
          const fallback = root.querySelector<HTMLElement>('.home-sign-in:not([hidden])') ?? homeSettingsButton();
          fallback?.focus({ preventScroll: true });
        }
      });
    });
    sheet.element.classList.add('account-sign-in');
    const done = () => {
      if (!people?.signedIn) return;
      accountNote = '';
      sheet.close();
      updateAccount();
    };
    const load = async () => {
      sheet.show({ title: text.signIn, body: [el('p', '', signInText.loading)] });
      try {
        const host = await loadPeople();
        if (!sheet.isOpen) return;
        if (host.signedIn) done();
        else signInSheet(sheet, { ...host.host, start: host.startAccountSignIn }, { kind: 'account' }, done);
      } catch {
        if (sheet.isOpen) sheet.show({ title: text.signIn, body: [el('p', '', peopleLoadError), button('Try again', { onPress: () => { void load(); } })] });
      }
    };
    void load();
    shell.openLayer(sheet.close);
  });
}
function personFlow(source: HTMLElement | null = null, resumeInviteAction = false) {
  const legacy = shell.route.place === 'person' || location.hash === '#person';
  if (shell.route.place !== 'play' || legacy) shell.go({ place: 'play' }, true, legacy);
  openNewGame(source ?? root.querySelector<HTMLElement>('.home-friend-btn') ?? root, { opponent: 'person', resumeInviteAction });
}
async function openOnline(id: string) {
  if (onlineGameNotice?.id !== id) onlineGameNotice = undefined;
  onlineActive = true; onlineState = undefined; shownRevision = -1; arrangement = undefined; arrangementGame = '';
  endResult?.(); rewind?.finish(); seatFrame?.finish(); boardReplay.cancel(); generation++; engine.cancel(); endEntry(); board?.dispose(); board = undefined;
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
    if (gameDialog) closeGameDialog(); // an open Menu or History would cover the end page
    endEntry(); board?.dispose(); board = undefined; liveGame = false; ended = true; thinking = false;
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
  const previousRevision = shownRevision, changed = shownRevision !== state.view.revision, wasWaiting = thinking;
  notice = takeOnlineNotice(state);
  game = state.game; draft = state.draft ?? new DraftTurn(game); player = state.view.seat;
  thinking = !state.draft || state.phase === 'sending' || state.phase === 'checking';
  const wasEnded = ended; ended = state.phase === 'over'; liveGame = false;
  if (ended && !wasEnded) closeStaleDialogs();
  if ((changed || ended) && document.querySelector('[data-help-sheet="promotion"]')) gameHelp?.close();
  if (changed) {
    shownRevision = state.view.revision; selected = inspected = null; shown = null; clearChoice(); skipBoard();
    board.setPosition(draft.position, game.context); replySteps = state.received?.steps ?? lastReplySteps(game, cpu());
    const h = game.history; let i = h.length; const side = h.at(-1)?.pos.turn; while (i > 0 && h[i - 1].pos.turn === side) i--;
    lastActions = draft.length ? [...draft.steps] : turnActions(i); last = turnText(i, side !== player);
  }
  if (ended) { resultCause = onlineResult(state); reading = 'result'; if (changed) detail.dataset.mode = ''; }
  else if (reading === 'result') reading = 'normal';
  update();
  if (changed && previousRevision >= 0 && ended && !wasEnded && state.view.result?.reason === 'checkmate') playOnlineKingResult();
  if (changed && previousRevision >= 0 && wasWaiting && !thinking && !ended && !arrangement) passTurn(false);
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
    if (!document.querySelector('dialog[open]')) signInAgain(host.host, () => { void host.signIn().then(() => { if (onlineActive && shell.route.place === 'online') return host.controller ? host.controller.signedIn() : openOnline(shell.route.entry!); }); }, menuButton);
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
  if (state.phase === 'checking') block.append(el('p', '', 'Your unsent turn stays.'), button('Check again', { onPress: () => { void people!.controller!.check(); } }), ...(state.check?.canDiscard ? [button('Discard send', { onPress: () => { void people!.controller!.discard(); } })] : []));
  else if (state.claim) block.append(button(state.claim === 'win' ? 'Claim win' : 'End game', { onPress: () => { void people!.controller!.claim(); } }));
  else if (state.draw === 'theirs') block.append(el('p', '', 'Your opponent offers a draw.'), button('Accept draw', { onPress: () => { void people!.controller!.answerDraw(true); } }), button('Keep playing', { onPress: () => { void people!.controller!.answerDraw(false); } }));
  if (state.phase === 'waiting') {
    const invited = state.view?.invitation?.direction === 'outgoing' ? state.view.invitation.player : null;
    if (invited) block.append(el('p', '', `The game starts when ${invited.handle} accepts.`), button('Cancel invite', { onPress: () => { void people!.controller!.abort().then(() => people?.refresh()).catch(() => announce('The invite cannot cancel. Try again.')); } }));
    else block.append(el('p', '', 'The game starts when a player joins.'), button('Copy link', { onPress: () => { void people!.copyLink(state.view!.game_id).then(() => announce('Link copied.')).catch(() => announce('The link cannot copy. Try again.')); } }), button('Cancel game', { onPress: () => { void people!.controller!.abort().then(() => people?.refresh()).catch(() => announce('The game cannot end. Try again.')); } }));
  }
  return block;
}
function leaveHome() {
  homeView?.reveal.dispose();
  homeView = undefined;
}

function home(newArmy = false) {
  if (enteredAt !== undefined && liveGame && !onlineActive) { stopGameTime(); save(false); }
  if (shell.route.place !== 'play') { if (newArmy) next = createDraft(accepted()); shell.go({ place: 'play' }); return; }
  const enteringHome = document.body.dataset.page !== 'home';
  const active = document.activeElement as HTMLElement | null;
  let focused: string | undefined;
  if (!enteringHome && active && root.contains(active)) {
    const name = ['home-friend-btn', 'home-side-new', 'home-hero-new', 'home-summary', 'home-guide-btn', 'home-sign-in', 'home-settings-btn', 'all-games'].find(name => active.classList.contains(name));
    focused = active.dataset.game ? `[data-game="${active.dataset.game}"]` : active.dataset.saved === 'computer' ? '[data-saved="computer"]' : name ? `.${name}` : undefined;
  }
  onlineActive = false; onlineState = undefined; people?.stopGame();
  gameHelp?.close(); closeGuidePanel();
  endResult?.(); rewind?.finish(); seatFrame?.finish(); boardReplay.cancel(); generation++; engine.cancel(); endEntry(); endCardFlight(); cancelCheckPulse(); endReply = null;
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
  const me = people?.host.me();
  const hadInviteLinkStatus = inviteLinkStatus.isConnected;
  const play = homeView = playScreen({
    resume, next, gamesList, previews: homePreviews, status: [status, onlineNote].filter(Boolean).join(' '),
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
    onPlay: source => {
      if (replacement()) openNewGame(source, { opponent: 'computer' });
      else void start(undefined, source, next);
    },
    onChange: source => openNewGame(source, { opponent: 'computer' }),
    onFriend: source => openNewGame(source, { opponent: 'person' }),
    onGuide: () => shell.go({ place: 'guide' }),
    onSettings: openSettings,
    onSignIn: accountSignIn,
    showSignIn: showHomeSignIn(),
    account: { signedIn: !!people?.signedIn, name: me?.handle ?? people?.user?.name, avatar: people?.user?.avatar },
  }, art, homeView);
  if (hadInviteLinkStatus) play.element.querySelector('.home-start')!.prepend(inviteLinkStatus);
  if (!play.element.isConnected) {
    play.element.addEventListener('click', event => {
      if ((event.target as Element).closest('button, a')) clearInviteLinkStatus();
    }, true);
    root.replaceChildren(play.element, ...(old ? [old] : []));
    play.reveal.sync();
  }
  if (enteringHome) play.focus(); else if (focused) play.element.querySelector<HTMLElement>(focused)?.focus({ preventScroll: true });
  homePoll?.update();
  if (old) void screenChange(old, play.element, true).then(() => { old.remove(); oldBoard?.dispose(); }); else oldBoard?.dispose();
}
const replacement = () => inMemory() ? gameJSON(snapshot(draft, null, player, undefined, arrangement)) : gameKeyOf(readStored());
/** The choices stay in the panel until the player starts a game or sends an invite. */
function openNewGame(source: HTMLElement, opts: { opponent?: 'computer' | 'person'; fromResult?: boolean; resumeInviteAction?: boolean } = {}) {
  shell.settled(() => {
    const startRoute = shell.route, startPlace = startRoute.place;
    if (startPlace !== 'play' && !(opts.fromResult && ended && (startPlace === 'game' || startPlace === 'online'))) return;
    if (document.querySelector('dialog[open]')) return;
    const memory = (() => { try { return readPanel(JSON.parse(sessionStorage.getItem(PANEL_KEY) ?? 'null')); } catch { return null; } })();
    const panel = newGamePanel({
      next,
      memory,
      opponent: opts.opponent,
      backLabel: opts.fromResult ? 'Back to result' : undefined,
      resumeInviteAction: opts.resumeInviteAction,
      people: async () => (await loadPeople()).host,
      remember: value => { try { if (value) sessionStorage.setItem(PANEL_KEY, JSON.stringify(value)); else sessionStorage.removeItem(PANEL_KEY); } catch { /* The current panel still keeps its draft. */ } },
      replacement,
      onStart: async (draft, acceptedSave) => {
        await shell.closeLayer();
        if (shell.route !== startRoute) return;
        if (replacement() !== acceptedSave) {
          if (startPlace === 'play') home();
          else announce('A saved game changed. Check before starting.');
          return;
        }
        next = draft;
        void start(undefined, undefined, draft);
      },
      onInvite: draft => {
        next = draft; ({ setup, level, sideChoice, options } = draft);
        store(GAME_KEY, setup); store(OPTIONS_KEY, JSON.stringify(options));
        if (shell.route.place === 'play') home();
      },
      onClose: () => { void shell.closeLayer(); },
      openView: shell.openLayerView,
      backView: shell.backLayerViews,
    }, art);
    // A Home refresh may replace the opener while the panel is open.
    const controls = ['home-side-new', 'home-hero-new', 'home-summary', 'home-friend-btn'];
    const opener = controls.find(name => source.classList.contains(name));
    panel.element.addEventListener('close', () => {
      panel.element.remove();
      if (source.isConnected || shell.route !== startRoute) return;
      if (opts.fromResult) screen.querySelector<HTMLElement>('.play-result-new')?.focus({ preventScroll: true });
      else if (opener) [opener, ...controls].map(name => root.querySelector<HTMLElement>(`.${name}`)).find(control => control?.getClientRects().length)?.focus({ preventScroll: true });
    });
    document.body.append(panel.element); panel.open(source); shell.openLayer(panel.close, panel.element, panel.back);
  });
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
    if (writer.game(snapshot(draft, null, player, undefined, now.resume.arrangement), prefs(), true)) answerOffer(now.raw);
    liveGame = false; void start({ ...now.resume, level: gameLevel, playedMs: savedPlayTime(now.save) }, source);
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
  void start({ ...now.resume, level: levelOf(now.save!.skill), playedMs: savedPlayTime(now.save) }, source);
}
const inMemory = () => liveGame && writer.lost && !writer.blocked && (game.history.length > 0 || draft.length > 0 || !!arrangement || game.backRank === '');
function endEntry() { starting = 0; endVersus?.(); endVersus = null; }
/** A new game shows Versus. Continue opens the saved board at rest. */
async function start(resumed?: { game: Game; draft: DraftTurn; level: Level; player: Color; playedMs?: number; arrangement?: Arrangement }, from?: HTMLButtonElement, freshDraft?: NewGameDraft) {
  if (starting) return;
  const progressiveArt = !inApp && (!onlineActive || !!freshDraft);
  // Keep the accepted game identity through the code load. Settings alone do not need a new choice.
  const acceptedSave = readSave(), identity = acceptedSave.unreadable ? acceptedSave.raw : gameJSON(acceptedSave.save);
  if (!boardCode && !progressiveArt) {
    // Start the first frame's images beside the board code, in the scene's image modes.
    const position = resumed?.draft.position ?? freshDraft?.game.pos ?? game.pos, rules = resumed?.game.context.rules ?? freshDraft?.game.context.rules ?? game.context.rules;
    const files = [skinUrl, ...[...new Set(position.board)].filter(Boolean).map(code => `/ui/pieces/${typeOf(code) === K ? kingFile(colorOf(code), rules) : `${nameOf(code).toLowerCase()}-${colorOf(code) ? 'b' : 'w'}`}.webp`)];
    for (const href of files) if (!firstArt.has(href)) {
      const link = document.createElement('link'); link.rel = 'preload'; link.as = 'image'; link.href = href;
      link.fetchPriority = 'high'; document.head.append(link); firstArt.add(href);
    }
  }
  if (!boardCode) {
    // The press waits for the board code; a second press, or a move to another place, ends this start.
    const route = shell.route;
    root.querySelector('.home-load-fault')?.remove();
    if (from) setButtonState(from, { busy: true });
    try { await loadBoardCode(); } catch {
      if (from) setButtonState(from, { busy: false });
      const home = root.querySelector('.home-start');
      if (home && shell.route === route) home.prepend(el('p', 'home-note home-load-fault', text.loadFailed));
      announce(text.loadFailed); return;
    }
    if (starting || shell.route !== route) return;
  }
  if (!resumed) {
    const current = readSave();
    if ((current.unreadable ? current.raw : gameJSON(current.save)) !== identity) {
      if (shell.route.place === 'play') home();
      else announce('A saved game changed. Check before starting.');
      return;
    }
    beforeNewGame(writer);
    if (writer.blocked) { if (shell.route.place === 'play') home(); return; }
    if (onlineActive && freshDraft) { onlineActive = false; onlineState = undefined; people?.stopGame(); }
  }
  const fromHome = document.body.dataset.page !== 'game', homeScreen = root.querySelector<HTMLElement>('.play-home');
  gameHelp?.close(); closeGuidePanel();
  endResult?.(); rewind?.finish(); seatFrame?.finish(); boardReplay.cancel(); generation++; const own = generation; engine.cancel(); endEntry(); endCardFlight(); cancelCheckPulse(); endReply = null;
  // A rematch keeps the board and its loaded art: no new load, so no empty frame.
  const keep = fromHome || freshDraft ? undefined : board;
  if (!keep) { board?.dispose(); board = undefined; }
  const memory = resumed?.game === game && liveGame;
  if (resumed) { ({ game, draft } = resumed); level = gameLevel = resumed.level; setup = gameType(game.rules); player = resumed.player; }
  else if (freshDraft) {
    ({ setup, level, sideChoice, options, player } = freshDraft);
    game = startOf(freshDraft); draft = new DraftTurn(game); gameLevel = level;
    store(SIDE_KEY, sideChoice); store(OPTIONS_KEY, JSON.stringify(options)); store(GAME_KEY, setup);
    next = createDraft(accepted());
  } else {
    const previous = game;
    player = cpu();
    game = new Game(previous.backRank || undefined, rulesFor(gameType(previous.rules), Math.random, playedOptions, player));
    if (!previous.backRank) game.load(game.context.fromFen(toFen(previous.history[0]?.pos ?? previous.pos)));
    draft = new DraftTurn(game);
  }
  if (freshDraft || resumed && !memory) playedOptions = options;
  seatFrame?.finish(); counts = [0, 0]; staged = silentStage = false;
  if (!onlineActive) {
    onlineGameNotice = undefined;
    arrangement = resumed ? memory ? arrangement : resumed.arrangement : playedOptions.arrangement === 'manual' ? new Arrangement(toFen(game.pos).split(' ')[0].split('/')[player ? 0 : 7].toUpperCase(), player) : undefined;
  }
  if (!onlineActive && !memory) playedMs = resumed?.playedMs ?? 0;
  enteredAt = undefined; resultReview = false;
  resources = []; shown = null; replySteps = []; resigned = null; liveGame = true;
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
  leaveHome();
  document.body.dataset.page = 'game';
  screen = el('section', 'play-game');
  screen.toggleAttribute('data-online', onlineActive);
  screen.dataset.hand = 'hand'; screen.dataset.coords = String(coords);
  // Opponent strip: name and level, the opponent's power with its uses, Menu.
  // The name has two lines, Computer and the level; the computer's four cards are one group (option b1).
  const oppName = onlineActive ? onlineState?.opponent?.deleted ? 'Deleted player' : onlineState?.opponent?.handle ?? 'A player' : text.computer;
  const oppAvatar = onlineActive && onlineState?.opponent && !onlineState.opponent.computer && !onlineState.opponent.deleted ? onlineState.opponent.avatar ?? null : null;
  const opponent = el('div', 'play-opp'), who = el('strong');
  who.append(el('span', 'play-opponent-name', oppName));
  who.append(el('small', 'opponent-clock', onlineActive ? '' : text[gameLevel]));
  const face = onlineActive ? profilePortrait(oppName, oppAvatar) : el('img', 'profile-portrait');
  if (face instanceof HTMLImageElement) decorativeImage(face, computerPortrait(gameLevel));
  const opponentGroup = el('div', 'play-opponent-group');
  const opponentRing = el('span', 'play-seat-ring'); opponentRing.append(face);
  opponentGroup.append(opponentRing, who); opponent.append(opponentGroup);
  addPower(cpu(), opponentGroup); rivalGroup = cards(cpu()) ? addRivalCards(opponentGroup) : null;
  menuButton = button(text.menu, { icon: 'more', iconOnly: true, onPress: openMenuDialog });
  menuButton.classList.add('play-menu-button');
  menuButton.setAttribute('aria-haspopup', 'dialog');
  opponent.append(menuButton);
  // Your strip: your power and the four cards, or your king when the game has no powers.
  const mine = el('div', 'play-own'); mine.setAttribute('role', 'group'); mine.setAttribute('aria-label', text.you);
  const king = game.context.rules.kings[player];
  if (king) addPower(player, mine);
  const ownRing = el('span', 'play-seat-ring');
  const coin = mine.querySelector('.play-power-coin');
  if (coin) coin.replaceWith(ownRing), ownRing.append(coin);
  else { ownRing.append(figure(kingFile(player))); mine.append(ownRing); }
  const opponentStore = el('span', 'play-store'), ownStore = el('span', 'play-store');
  opponentGroup.append(opponentStore); mine.append(ownStore);
  seatRings = [ownRing, opponentRing]; stores = [ownStore, opponentStore];
  if (cards(player)) addCards(mine);
  reader = el('section', 'play-reader'); reader.dataset.daylightHelpNarrator = ''; reader.id = 'play-panel'; reader.setAttribute('aria-label', text.last); nodes = readerNodes(); acting = ''; resetFit();
  detail = el('div', 'play-detail');
  boardBox = el('div', 'play-board');
  if (!keep) { boardHost = el('div', 'play-board-host'); boardHost.style.visibility = 'hidden'; boardHost.setAttribute('aria-hidden', 'true'); }
  const host = boardHost;
  const grid = el('div', 'play-grid'); grid.setAttribute('role', 'grid'); grid.setAttribute('aria-label', text.title); grid.setAttribute('aria-description', text.shortcuts);
  if (progressiveArt && !keep) grid.inert = true;
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
  choiceBox = el('div', 'play-choices'); boardBox.append(host, grid);
  gameHelp = createGameHelp({ board: boardBox, player, finish: onlineActive ? text.send : text.finish, effects: {
    onSheetOpen: sheet => sheetMotion(sheet, true, () => gameHelp?.close()),
    onSheetClose: (sheet, bounds) => sheetMotion(sheet, false, undefined, bounds),
  } }); // the choice box shows in the reading area
  controls = turnControls(onlineActive ? { ...text, finish: text.send } : text, {
    undo: undoOrReplay,
    finish: () => { void finish(); },
    refusedFinish: () => {
      if (arrangement || ended || fault) return;
      const reason = refusalReason({ draft, player, inputLocked: thinking }, { kind: 'end' });
      if (reason) gameHelp?.showRefusal(reason, controls.finish, helpAvoid());
    },
  });
  reader.append(controls.line, detail);
  resignDialog = confirmDialog({ title: text.resignTitle, consequence: onlineActive ? 'Your opponent wins. Your unsent turn does not count.' : text.resignCause, action: text.resign, fallback: controls.finish, onConfirm: () => {
    if (onlineActive) { void people?.controller?.resign(); return; }
    gameHelp?.close(); generation++; engine.cancel(); board?.skip(); thinking = false;
    while (draft.length) draft.undo(); draft.armed = null; shown = null; board?.setPosition(game.pos, game.context);
    arrangement = undefined;
    ended = true; resigned = player; liveGame = false; stopGameTime(); if (save(true)) store(ARRANGE_KEY, 'null'); resultCause = text.resigned; reading = 'result'; update(); focusResult(); announce(`${replyText()} ${resultCause}`);
  } });
  historyStrip = el('div', 'play-history-strip'); historyStrip.hidden = true;
  historyButton = button(text.history, { onPress: () => toggleScroll('history', historyButton) });
  historyButton.append(icon('down')); historyButton.classList.add('play-history-toggle');
  historyCompact = el('div', 'play-history-compact'); historyStrip.append(historyButton, historyCompact);
  scrollPanel = el('section', 'play-scroll-panel kd-paper'); scrollPanel.id = 'play-scroll';
  historyButton.setAttribute('aria-controls', scrollPanel.id);
  scrollPanel.hidden = true; scrollOpen = null;
  controls.undo.replaceChildren(icon('undo'), el('span', 'kd-sr', text.undo)); controls.undo.classList.add('kd-icon-button');
  screen.append(opponent, boardBox, historyStrip, reader, mine, controls.element, scrollPanel, resignDialog.element);
  screen.prepend(el('span', 'play-wordmark', text.title));
  if (fromHome) { root.querySelectorAll('.play-game').forEach(node => node.remove()); screen.style.visibility = 'hidden'; root.append(screen); }
  else root.replaceChildren(screen);
  const onArtError = () => { if (host === boardHost && document.body.dataset.page === 'game') artFailed(generation); };
  const view = keep ?? boardCode!.mountBoard(host, tap, {
    liveInput: true, quiet: true, plainMarks: true, daylight: true, initialBoardArt: skinUrl, progressiveArt,
    onArtError: progressiveArt ? undefined : onArtError,
    sceneHooks: {
      hold,
      onCaptureContact: (square: number, animated: boolean) => {
        const victim = playingAction?.before.board[square];
        if (!victim) return false;
        cue('impact');
        if (animated) { shake(seatRings[colorOf(victim) === player ? 0 : 1], { amplitude: 4, ms: 260 }); pulse('medium'); }
        return true;
      },
      onKingImpact: () => { if (endResult || onlineActive) { cue('knock', { pitch: .7, volume: .7 * .85 }); pulse('medium'); } },
    },
  });
  board = view;
  setPauseHook(paused => {
    if (board !== view) return;
    if (paused) view.pause(); else view.resume();
  });
  board.flip(player === 1);
  if (progressiveArt) applyPieceView();
  board.setPosition(draft.position, game.context);
  if (!progressiveArt) applyPieceView();
  layout(); update();
  fit.disconnect(); fit.observe(screen);
  if (!resumed && save(true)) store(ARRANGE_KEY, 'null');
  const loaded = keep ? Promise.resolve() : board.ready().then(() => {
    if (own === generation) { host.style.visibility = ''; if (progressiveArt) grid.inert = false; }
  });
  // The engine worker loads when the board can draw, so it does not hold the first frame (decision 44).
  void loaded.catch(() => {}).then(() => { if (own === generation && !onlineActive) engine.prepare(game); });
  const versus = !resumed && !arrangement ? versusCard(loaded) : null;
  const entryAnnouncement = announcement;
  if (fromHome) {
    starting = own;
    try {
      if (!versus || progressiveArt) { if (from) setButtonState(from, { busy: true }); await loaded.catch(() => {}); }
      if (own !== generation) return;
      screen.style.visibility = ''; cells[cursor].focus({ preventScroll: true });
      if (homeScreen) { if (!versus) await screenChange(homeScreen, screen); homeScreen.remove(); }
    } finally { if (starting === own) starting = 0; }
  } else if (!versus) cells[cursor].focus({ preventScroll: true });
  if (own !== generation) return;
  try { await loaded; } catch { artFailed(own); }
  if (versus) await versus;
  if (own === generation && !onlineActive && !ended) enteredAt = performance.now();
  if (own === generation && fault) focusFault();
  if (own === generation && announcement === entryAnnouncement && !notice && !fault) {
    const context = arrangement ? [arrangeText.instruction, arrangement.error ?? arrangeText.legal, arrangeText.keys].join(' ') : thinking ? '' : draft.length ? stepLines().join(' ') : replySteps.length ? replyText() : fresh() ? text.firstMinute : last;
    announce([controls.state.textContent, context].filter(Boolean).join(' '));
  }
  // The computer moves first in a Dark game, and after Continue on its turn. Wait for the first board frame.
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
  fault = null; endEntry(); board?.dispose(); board = undefined; void start({ game, draft, level: gameLevel, player });
}
/** Calm Versus starts the game at 1800 ms or when the player skips it. */
function versusCard(loaded: Promise<unknown>): Promise<void> {
  const card = el('section', 'play-versus'), stage = el('div', 'vs-stage');
  const skip = button('Skip Versus', { onPress: () => leave(true) });
  skip.classList.add('play-sequence-skip');
  const side = (s: Color) => {
    const king = game.context.rules.kings[s], box = el('div', 'vs-side'), portrait = figure(kingFile(s));
    portrait.classList.add('vs-fig');
    box.append(portrait, el('strong', 'vs-king', kingLabel(king?.king, s)),
      el('b', 'vs-power', king ? POWER_NAME[king.power] : 'No power'));
    box.append(el('small', 'vs-who', s !== player ? `${text.computer} · ${text[gameLevel]}` : ''));
    return box;
  };
  const you = side(player), rival = side(cpu()), word = el('span', 'vs-mark', text.versus);
  const rule = el('span', 'vs-rule'), ground = el('span', 'vs-ground');
  stage.append(you, word, rule, rival, ground); card.append(stage, skip); screen.append(card);
  card.tabIndex = -1; card.focus({ preventScroll: true });
  const [k0, k1] = [game.context.rules.kings[player], game.context.rules.kings[cpu()]];
  announce(versusLine(kingLabel(k0?.king, player), k0 ? POWER_NAME[k0.power] : '',
    kingLabel(k1?.king, cpu()), k1 ? POWER_NAME[k1.power] : ''));
  const cues: Effect[] = [];
  const schedule = (ms: number, doIt: () => void) => { cues.push(later(ms, doIt)); };
  const draw = (ms: number, step: (t: number) => void, curve = ease.EASE) => { cues.push(tween(ms, step, { curve })); };
  let complete = () => {};
  const wait = new Promise<void>(resolve => { complete = resolve; });
  let leaving = false;
  const clear = () => {
    cues.forEach(effect => effect.cancel());
    document.removeEventListener('keydown', key, true);
    card.remove(); complete();
    if (endVersus === clear) { endVersus = null; cells[cursor]?.focus({ preventScroll: true }); }
  };
  endVersus = clear;
  const leave = (skip: boolean) => {
    if (skip || reducedMotion()) { if (skip && !leaving) cue('tick'); clear(); return; }
    if (leaving) return;
    leaving = true;
    cue('arrive'); pulse('light');
    const figures = [you, rival].map(box => box.querySelector<HTMLElement>('.vs-fig')!);
    const paths = figures.map((figure, i) => ({ from: at(figure), to: at(seatRings[i]) }));
    draw(360, t => {
      card.style.setProperty('--versus-ground', String(1 - t));
      for (const part of [word, rule, ground, ...stage.querySelectorAll<HTMLElement>('.vs-king, .vs-power, .vs-who')]) part.style.opacity = String(Math.max(0, 1 - 3 * t));
      figures.forEach((figure, i) => {
        const { from, to } = paths[i];
        figure.style.transform = `translate(${(to.x - from.x) * t}px, ${(to.y - from.y) * t}px) scale(${1 - .86 * t})`;
        figure.style.opacity = String(Math.min(1, 2 * (1 - t)));
      });
    });
    schedule(360, clear);
  };
  const key = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' && event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault(); event.stopImmediatePropagation(); leave(true);
  };
  document.addEventListener('keydown', key, true);
  const show = (node: HTMLElement, start: number, ms: number, transform: (t: number) => string, curve = ease.EASE) => {
    node.style.opacity = '0';
    schedule(start, () => draw(ms, t => { node.style.opacity = String(t); node.style.transform = transform(t); }, curve));
  };
  if (reducedMotion()) { clear(); return loaded.then(() => {}, () => {}); }
  show(you, 0, 280, t => `translateX(${-40 * (1 - t)}px)`);
  show(rival, 90, 280, t => `translateX(${40 * (1 - t)}px)`);
  show(ground, 0, 380, t => `scaleX(${t})`);
  show(word, 420, 150, t => `scale(${1.3 - .3 * t})`, ease.in3);
  show(rule, 570, 260, t => `scaleY(${t})`);
  stage.querySelectorAll<HTMLElement>('.vs-king, .vs-power, .vs-who').forEach((node, i) =>
    show(node, 640 + i * 36, 220, t => `translateY(${8 * (1 - t)}px)`));
  schedule(280, () => { cue('knock', { volume: .6 }); pulse('medium'); });
  schedule(370, () => { cue('knock', { pitch: .8, volume: .6 }); pulse('medium'); });
  schedule(570, () => { cue('impact', { volume: .6 }); cue('clink', { volume: .6 }); pulse('heavy'); });
  schedule(1440, () => leave(false));
  return Promise.all([wait, loaded.catch(() => {})]).then(() => {});
}

/** End any board playback; a computer reply that only waits for its playback ends with it. */
function skipBoard() { rewind?.finish(); boardReplay.cancel(); endCardFlight(); cancelCheckPulse(); board?.skip(); playingAction = null; endReply?.(); }
function moveCursor(square: number) { cells[cursor].tabIndex = -1; cursor = square; cells[cursor].tabIndex = 0; cells[cursor].focus({ preventScroll: true }); }
document.addEventListener('keydown', event => {
  if (event.defaultPrevented) return;
  if (event.key === 'Escape' && shell.route.place === 'guide') {
    event.preventDefault(); closeHomeGuide(); return;
  }
  if (document.body.dataset.page !== 'game') return;
  const openDialog = document.querySelector<HTMLDialogElement>('dialog[open]');
  if (openDialog) {
    if (event.key === 'Escape' && !(event.target as Element).closest('dialog')) {
      event.preventDefault();
      openDialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    }
    return;
  }
  if ((event.target as Element).closest('dialog, input, textarea, select, [contenteditable="true"]')) return;
  if (event.key.toLowerCase() === 'z' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); undoOrReplay(); return; }
  if (event.key !== 'Escape') return;
  if (scrollOpen || reader?.dataset.floating === 'true') { event.preventDefault(); closeFloating(); return; }
  const target = (shown ?? armedResource())?.control ?? cells[cursor], cancelled = armedResource();
  if (arrangement) arrangement.selected = null;
  event.preventDefault(); clearChoice(); draft.armed = null; shown = null; selected = inspected = null; notice = '';
  if (reading !== 'result') reading = ended ? 'result' : 'normal';
  update(); target.focus({ preventScroll: true }); if (cancelled) announce(cancelLine(cancelled.subject.kind));
});
function key(event: KeyboardEvent) {
  // The arrows follow the screen in both views.
  if (event.key.startsWith('Arrow')) {
    event.preventDefault();
    const next = arrowStep(cursor, event.key, player);
    if (next != null && (!arrangement || Math.floor(next / 8) === player * 7)) moveCursor(next);
  }
}
function clearChoice() { choice = []; choiceBox.replaceChildren(); }
function fitResult() {
  if (!onlineActive || reading !== 'result') return;
  const body = detail?.querySelector<HTMLElement>('.play-result-body');
  if (!body) return;
  // A long name takes a smaller size to stay whole on one line (reading-b.css). --name is its width in em: no screen size changes it.
  const name = body.querySelector<HTMLElement>('.play-result-winner'), width = name?.getBoundingClientRect().width;
  if (width) body.style.setProperty('--name', String(width / parseFloat(getComputedStyle(name!).fontSize)));
  // Give the keyboard a scroll target only when the result text needs it.
  if (body.scrollHeight > body.clientHeight + 1) body.tabIndex = 0;
  else body.removeAttribute('tabindex');
}
function tap(square: number) {
  if (fault === 'art' || !onlineActive && writer.blocked) return; // a fault waits for recovery
  const wasEnded = ended; skipBoard();
  cells.forEach(cell => cell.classList.remove('square-error')); // a new tap ends the red edge of an earlier refusal
  if (ended && !wasEnded) return; // the last reply can end the game inside skipBoard: the result and its announcement keep their place (decision 129)
  lastActions = []; notice = ''; onlineGameNotice = undefined;
  if (arrangement && !ended) {
    if (arrangementLocked()) return;
    gameHelp?.close();
    const order = arrangement.order;
    if (!arrangement.pick(square)) { moveCursor(player * 56); announce(arrangeText.choose); return; }
    if (!onlineActive && arrangement.order !== order) save(true);
    board?.setPosition(arrangement.position(game.pos), game.context); update();
    announce(arrangement.error ?? (arrangement.selected === null ? arrangeText.instruction : arrangeText.selected)); return;
  }
  const activeResource = armedResource(); if (!activeResource) shown = null;
  gameHelp?.close();
  // Help is never modal: a board tap closes it and also acts.
  if (ended) reading = 'result';
  if (choice.length) clearChoice();
  const pos = draft.position, code = pos.board[square], source = draft.chain ? draft.previewMove!.from : selected;
  const reason = refusalReason({ draft, player, inputLocked: thinking }, { kind: 'board', square, source });
  const refuseAt = (fallback: string) => refuse(reason?.line ?? fallback, square, reason);
  if (!ended && !thinking && !draft.open && !draft.chain) { refuseAt(text.staged); return; }
  if (ended || thinking) {
    if (code) { inspected = square; selected = null; update(); announce(learningEntry({ kind: 'piece', type: typeOf(code) }, game.context, pos, colorOf(code)).short); }
    else refuseAt(ended ? text.final : fault ? sideText.computerFailed : thinking ? text.wait : text.staged);
    return;
  }
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
    if (draft.chain) { refuseAt(refusalForTap(draft, source, square)); return; }
  }
  const own = draft.options(square);
  // An invalid occupied target is still a refusal. Keep the actor and its armed action.
  if (source != null && code && colorOf(code) !== draft.now.turn && !own.length) { refuseAt(refusalForTap(draft, source, square)); return; }
  if (draft.armed && !own.length) { refuseAt(refusalForTap(draft, source, square)); return; }
  // An armed mark, pawn change, returned piece or quake stages at its one square.
  if (draft.armed && own.length && own.every(isDirect)) { if (own.length > 1) showChoice(square, own); else stage(own[0]); return; }
  if (code) {
    inspected = square;
    if (own.length || colorOf(code) === player) {
      selected = selected === square ? null : square; if (selected == null) inspected = null;
      if (selected != null && !freezeArmed()) cue('mark', { piece: typeOf(code), king: game.context.rules.kings[colorOf(code)]?.king ?? PLAIN_KINGS[colorOf(code)] });
      if (selected != null && !own.length) { notice = reason?.line ?? refusalForTap(draft, draft.armed ? null : square, square); if (!freezeArmed()) cue('no'); }
    } else { selected = null; notice = reason?.line ?? (draft.armed ? text.armed : text.computerOwns); if (!freezeArmed()) cue('no'); }
    const short = learningEntry({ kind: 'piece', type: typeOf(code) }, game.context, pos, colorOf(code)).short;
    update();
    if (reason && notice) gameHelp?.showRefusal(reason, cells[square], helpAvoid());
    announce(`${nameOf(code)} ${sqName(square)}. ${notice || short}${notice === text.computerOwns ? ` ${short}` : ''}`);
  } else refuseAt(refusalForTap(draft, source, square));
}
function stage(move: Move) {
  // A choice button stages as a board tap does: it ends a Replay or an animation first (review finding, decision 127).
  skipBoard();
  const card = armedResource(), before = draft.position; draft.stage(move);
  // A played card travels to its square; the card in the hand shows it as spent.
  if (card?.card != null) { const box = cells[move.to].getBoundingClientRect(); endCardFlight(); endCardFlight = cardFly(card.control, screen, box.left + box.width / 2, box.top + box.height / 2, box.width, move.power === "freeze"); }
  afterStage(before, move);
}
function afterStage(before: Position, move: Move) {
  const now = draft.now; shown = null; resources.forEach(r => { r.hint = undefined; });
  lastActions = [...draft.steps, ...(draft.previewMove ? [{ before: draft.now, move: draft.previewMove }] : [])];
  // A Haste or Rage second move belongs to the same piece: keep it selected.
  selected = draft.chain ? draft.previewMove!.from : draft.open && now.haste !== undefined && now.rage !== 3 ? now.haste : null; inspected = move.selfRemove ? null : move.to;
  staged = true; silentStage = move.power === 'freeze';
  save(true); void animate(before, move, draft.position); update();
  announce(`${stepLines().at(-1)} ${controls.state.textContent}`); // the state line: ready, must continue, or what is possible after a free action
}
/** Play one action on the board. Resolves when its playback ends (a board tap ends it at once). */
function animate(before: Position, move: Move, after: Position): Promise<unknown> {
  if (!board) return Promise.resolve();
  nextMarksAt = 0;
  checkShown = false;
  const action = playingAction = { before, move };
  board.setPosition(before, game.context);
  const check = !move.pass && before.turn !== after.turn && game.context.inCheck(after);
  const checked = check && game.context.legalMoves(after).length > 0;
  const done = board.play(move, after, checked ? () => finalCheckCue(after) : undefined).catch(error => { refuse(String(error)); }).finally(() => {
    if (playingAction === action) {
      playingAction = null;

      if ((draft.chain || draft.open && draft.now.haste !== undefined) && motion !== 'off' && pieceView !== 'symbols' && !calm()) { nextMarksAt = performance.now() + time(260); later(262, drawMarks); }
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
  const before = draft.position, chain = draft.previewMove;
  const move = chain ? { ...chain, from: chain.captures.at(-2) ?? chain.from } : draft.steps.at(-1)?.move;
  gameHelp?.close();
  skipBoard(); clearChoice(); draft.undo(); shown = null; resources.forEach(r => { r.hint = undefined; }); selected = draft.chain ? draft.previewMove!.from : null; inspected = null; notice = '';
  lastActions = [...draft.steps, ...(draft.previewMove ? [{ before: draft.now, move: draft.previewMove }] : [])];
  save(true); board?.setPosition(draft.position, game.context); update(); announce(text.undone);
  if (!move || move.power === 'freeze') return;
  cue('rewind'); pulse('tick');
  edgeLight(controls.undo, { width: 2.2, reverse: true });
  const arrow = controls.undo.querySelector<SVGElement>('svg');
  tween(460, t => { if (arrow) arrow.style.transform = `rotate(${-360 * t}deg)`; }, { curve: ease.back });
  const code = before.board[move.to];
  if (!code || move.from === move.to || !draft.position.board[move.from] || colorOf(code) !== colorOf(draft.position.board[move.from]) || reducedMotion()) {
    cue('knock'); pulse('medium'); return;
  }
  const position = structuredClone(draft.position), from = at(cells[move.to]), to = at(cells[move.from]);
  const piece = nameOf(code).toLowerCase(), side = colorOf(code);
  const sprites = Array.from({ length: 4 }, () => {
    const ghost = pieceView === 'symbols' ? image(code) : figure(typeOf(code) === K ? kingFile(side) : `${piece}-${side ? 'b' : 'w'}`);
    ghost.className = 'play-rewind'; ghost.style.width = `${cells[move.from].offsetWidth}px`; screen.append(ghost); return ghost;
  });
  position.board[move.from] = 0; board?.setPosition(position, game.context);
  const paint = (t: number) => sprites.forEach((ghost, i) => {
    const at = ease.EASE(Math.max(0, t - (3 - i) * .11));
    ghost.style.left = `${from.x + (to.x - from.x) * at}px`;
    ghost.style.top = `${from.y + (to.y - from.y) * at}px`;
    ghost.style.opacity = String(i === 3 ? 1 : .24 + i * .05);
  });
  paint(0);
  rewind = tween(215, (_, t) => paint(t), { done: () => {
    rewind = undefined; sprites.pop()?.remove(); board?.setPosition(draft.position, game.context); drawMarks();
    cue('knock'); pulse('medium');
    sprites.forEach((sprite, i) => tween(160 - i * 35, t => { sprite.style.opacity = String((.24 + i * .05) * (1 - t)); }, { done: () => sprite.remove() }));
  } });
}
function showChoice(square: number, options: Move[]) {
  if (options.every(move => move.promo != null) && gameHelp) {
    const revision = shownRevision; // a choice made after the game ends or the online turn changes must not stage
    gameHelp.openPromotion(options, cells[square], player, move => { if (ended || shownRevision !== revision) return; stage(move); moveCursor(square); }, () => { selected = inspected = null; update(); });
    announce(text.promote); return;
  }
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
  gameHelp?.close();
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
  if (onlineActive) { if (draft.canFinish && !choice.length && !thinking && !ended) { selected = inspected = null; passTurn(true); await people?.controller?.send(); } return; }
  if (!draft.canFinish || choice.length || thinking || ended || !onlineActive && writer.blocked) return;
  const checkWasInFlight = playingAction && game.context.inCheck(draft.position);
  skipBoard(); const mine = game.history.length; if (draft.commit().at(-1)!.pass) board?.setPosition(game.pos, game.context); last = turnText(mine, false); lastActions = turnActions(mine); selected = inspected = null; notice = ''; shown = null;
  clearChoice(); save(true);
  if (game.status !== 'playing') { showResult(); return; }
  if (checkWasInFlight && game.inCheck && !checkShown) finalCheckCue(game.pos);
  passTurn(true); void reply(); announce(text.sent);
}
/** The computer's turn: after End turn, or after Continue when the computer is to move. */
async function reply() {
  thinking = true; acting = ''; fault = null; update();
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
      if (game.history.length > start && !calm() && pieceView !== 'symbols') await new Promise<void>(resolve => { later(260, resolve); });
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
      if (game.status !== 'playing') { showResult(); return; }
      passTurn(false); update(); announce(`${replyText()} ${game.inCheck ? text.check : text.ready}`);
    };
    await played; endReply?.();
  } catch {
    // The computer keeps its turn: the player cannot move for it. The last save stays (launch decision 12).
    if (own !== generation) return;
    acting = ''; fault = 'computer'; update(); announce(`${sideText.computerFailed} ${sideText.staysSaved}`); focusFault();
  }
}
function cancelCheckPulse() { checkFrame?.cancel(); checkFrame = undefined; checkPulse = null; }
let checkShown = false;
function finalCheckCue(pos: Position) {
  checkShown = true;
  cancelCheckPulse();
  const square = findKing(pos.board, pos.turn);
  const ring = seatRings[pos.turn === player ? 0 : 1];
  ring.dataset.check = 'true';
  cue('check'); pulse('warn');
  update();
  riseNarrator();
  shake(ring, { amplitude: 5, ms: 340 }); burst('sparks', at(ring), { count: 8, ms: 400 });
  checkPulse = { square, progress: 0 };
  checkFrame = tween(160, t => { if (checkPulse) checkPulse.progress = t; drawMarks(); }, {
    curve: ease.EASE, done: () => { checkPulse = null; drawMarks(); },
  });
}
const focusResult = () => detail.querySelector<HTMLButtonElement>('.play-result-actions .kd-button')?.focus({ preventScroll: true });
function riseNarrator() {
  const text = detail.querySelector<HTMLElement>('.play-narr-copy');
  if (!text) return;
  tween(180, t => { text.style.transform = `translateY(${8 * (1 - t)}px)`; text.style.opacity = String(t); }, { curve: ease.EASE });
}
function showResult() {
  gameHelp?.close(); closeStaleDialogs();
  ended = true; thinking = false; liveGame = false; stopGameTime();
  const status: Status = game.status;
  const won = game.pos.turn === cpu();
  resultCause = status === 'checkmate' ? won ? text.win : text.loss : text[status as 'stalemate' | 'draw50' | 'drawRepetition' | 'drawMaterial'];
  board?.skip(); board?.setPosition(game.pos, game.context); shown = null;
  const show = () => {
    reading = 'result'; update(); focusResult(); announce(`${replyText()} ${resultCause}`);
  };
  if (status !== 'checkmate') { cue('arrive'); pulse('light'); show(); return; }
  const title = detail.querySelector('.play-narrator .play-title');
  if (title) { title.textContent = 'Checkmate.'; riseNarrator(); }
  const square = findKing(game.pos.board, game.pos.turn);
  const view = board, skip = button('Skip result animation', { onPress: () => finish(true) });
  skip.classList.add('play-sequence-skip');
  skip.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(true); } });
  screen.append(skip); skip.focus({ preventScroll: true });
  screen.dataset.moment = won ? 'win' : 'loss'; screen.dataset.state = 'result';
  const cues: Effect[] = [];
  const ground = boardBox;
  const light = (t: number) => ground.style.setProperty('--result-light', String(won ? .26 - .13 * t : .16 * t));
  const hidden = new AbortController(); // a hidden page gives no frames: the result must not wait for the bow
  const finish = (showCard: boolean) => {
    if (endResult !== cancel) return;
    endResult = undefined; hidden.abort();
    cues.forEach(effect => effect.cancel()); skip.remove(); view?.skip();
    light(1);
    if (!won) ground.style.setProperty('--result-saturation', '.5');
    if (showCard) show();
  };
  const cancel = () => finish(false);
  endResult = cancel;
  cue('impact'); pulse('heavy'); hold(90);
  shake(ground, { amplitude: 2.5, ms: 240 });
  const playback = view?.play({ kind: 'fall', square });
  cues.push(later(200, () => {
    cues.push(tween(won ? 700 : 900, t => {
      light(t);
      if (!won) ground.style.setProperty('--result-saturation', String(1 - .5 * t));
    }, { curve: won ? ease.lin : ease.out2 }));
  }));
  cues.push(later(won ? 260 : 300, () => {
    if (won) { cue('arrive'); cue('ting'); pulse('success'); burst('sparks', at(cells[square]), { count: 12, ms: 700 }); }
    else { cue('no', { pitch: .65 }); pulse('error'); }
  }));
  const finished = Promise.resolve(playback).catch(() => {});
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(true); }, { signal: hidden.signal });
  if (reducedMotion() || document.hidden) finish(true);
  else void finished.then(() => finish(true));
}
function playOnlineKingResult() {
  const view = board;
  if (!view) return;
  const lifetime = new AbortController();
  if (!reducedMotion() && pieceView !== 'symbols' && !document.hidden) {
    screen.addEventListener('click', event => {
      event.preventDefault(); event.stopImmediatePropagation(); view.skip();
    }, { capture: true, once: true, signal: lifetime.signal });
  }
  void view.play({ kind: 'fall', square: findKing(game.pos.board, game.pos.turn) })
    .catch(() => {}).finally(() => lifetime.abort());
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
  screen.dataset.reading = reading; screen.dataset.review = String(resultReview); screen.dataset.borrow = 'false'; screen.dataset.readerActive = 'true';
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
  screen.querySelector('.play-grid')!.setAttribute('aria-description', text.shortcuts);
  cells.forEach(cell => cell.removeAttribute('data-arrange-fault'));
  const code = draft.position.board[inspected ?? selected ?? -1];
  const now = draft.now, midway = draft.open && draft.length > 0 && draft.canFinish ? now.haste !== undefined ? now.rage === 3 ? text.another : text.again : text.after : '';
  let help = fault ? '' : notice || (ended ? text.rematchHint : thinking ? text.wait : draft.armed ? '' : draft.chain ? draft.canFinish ? draft.targets(draft.previewMove!.from).length ? text.continue : text.endChain : text.mustContinue : midway === text.after ? '' : midway || (draft.length || code || fresh() || replySteps.length ? '' : text.choose));
  if (net) help = (net.connection === 'auth' || net.phase === 'checking' || net.phase === 'sending' ? 'Your turn is not confirmed yet.' : net.phase === 'their-move' ? 'Your opponent now plays.' : help).replaceAll(text.finish, text.send);
  if (choice.length) help = notice;
  // Check names the player's own king only; a check that the player gives shows in the reading area (reading decision 22).
  const checked = !thinking && checkLines(game.context, draft.position, player).mine;
  // After a free action alone, the line says what is possible next (reading decision 20).
  const free = freeText();
  controls.finish.dataset.free = String(!!free && draft.canFinish);
  controls.finish.querySelector('[data-button-label]')!.textContent = onlineActive ? text.send : thinking ? 'Waiting' : text.finish;
  const replay = undoReplayState(draft.length, replySteps.length, thinking || ended || !!fault).replay;
  if (replay) controls.undo.dataset.mode = 'replay'; else delete controls.undo.dataset.mode;
  controls.undo.replaceChildren(icon(replay ? 'rewind' : 'undo'), el('span', replay ? 'play-replay-label' : 'kd-sr', replay ? text.replay : text.undo));
  controls.update({ sent: !fault && (net ? net.phase === 'sending' || net.phase === 'checking' : thinking), staged, silent: silentStage, state: ended ? resultCause : fault ? fault === 'art' ? sideText.artFailed : sideText.computerFailed : net && personTurn(net) || (thinking ? text.thinking : choice.length ? choicePrompt(choice) : draft.armed ? armedStep(draft.armedMoves, draft.now, selected, player) : checked ? text.check : free || (draft.length ? draft.canFinish ? text.draft : text.mustContinue : fresh() && !replySteps.length && !code && !player ? text.first : text.ready)), help,
    undoReason: !onlineActive && writer.blocked ? writer.warning : undoReplayState(draft.length, replySteps.length, thinking || ended || !!fault).enabled ? '' : text.noStep,
    finishReason: !onlineActive && writer.blocked ? writer.warning : ended ? text.final : fault ? fault === 'art' ? sideText.artFailed : sideText.computerFailed : net?.connection === 'auth' ? 'Sign in to send your turn.' : thinking ? net ? personTurn(net) ?? text.wait : text.wait : choice.length ? text.choiceFirst : (net?.canSend ?? draft.canFinish) ? '' : draft.length ? text.mustContinue : text.needMove });
  staged = silentStage = false;
  updateSeats();
  const pos = draft.position;
  screen.querySelector<HTMLElement>('.play-grid')!.inert = ended || !!fault || !onlineActive && writer.blocked;
  controls.element.inert = ended;
  cells.forEach((cell, square) => { cell.setAttribute('aria-label', squareLabel(pos, square)); cell.setAttribute('aria-selected', String(square === selected)); });
  screen.dataset.state = ended ? 'result' : thinking ? 'thinking' : choice.length ? 'choice' : draft.length ? 'draft' : 'ready';
  screen.dataset.canFinish = String(draft.canFinish && !choice.length && !thinking && !ended);
  screen.dataset.armed = draft.armed ?? ''; screen.dataset.fault = fault ?? '';
  // After the end the power and card row and the finish row are inert; the result card keeps its actions (reading decision 21).
  screen.querySelectorAll<HTMLElement>('.play-own, .play-turn, .play-opp .play-power, .play-opp .play-rival-cards').forEach(part => part.toggleAttribute('inert', ended || !onlineActive && writer.blocked));
  const hand = screen.querySelector('.play-hand');
  const cardPositions = hand && !reducedMotion() ? [...hand.children].map(card => ({ card: card as HTMLElement, x: card.getBoundingClientRect().left })) : [];
  let handChanged = false;
  for (const res of resources) {
    const coin = res.card == null ? coinState(draft.position, res.side, game.context.rules, game.history, res.side === player && draft.armed === res.key) : null, left = coin?.left ?? null;
    const spent = res.card == null ? left === 0 : !!((draft.position.used?.[res.side] ?? 0) >> res.card & 1);
    if (coin) {
      res.control.dataset.coin = coin.state;
      res.control.querySelector('small')!.textContent = coin.state === 'always' && res.subject.kind === 'power' ? alwaysOnLabel(res.subject.id) : spent ? readingBText.used : left == null ? text.unlimited : `${left} ${text.left}`;
      res.control.querySelectorAll<HTMLElement>('.play-power-notch').forEach((notch, i) => { notch.dataset.used = String(i >= (left ?? 0)); });
    } else {
      handChanged ||= res.control.dataset.spent !== undefined && res.control.dataset.spent !== String(spent);
      res.control.querySelector('.play-card-state')!.textContent = spent ? readingBText.used : '';
    }
    // A card or power that cannot act at this step shows "Not now" (design section 6); a tap still gives its reason.
    const notNow = res.side === player && !!res.key && !spent && !ended && !thinking && draft.armed !== res.key && !draft.armable(res.key);
    res.control.dataset.spent = String(spent); res.control.dataset.notNow = String(notNow); res.control.dataset.uses = String(!!res.key);
    if (spent || notNow) res.control.setAttribute('aria-description', spent ? text.spent : readingBText.notNow); else res.control.removeAttribute('aria-description');
    if (res.side === player && res.key) {
      const was = res.control.getAttribute('aria-pressed') === 'true', armed = draft.armed === res.key;
      res.control.setAttribute('aria-pressed', String(armed));
      if (was !== armed) {
        if (res.card != null) armCard(res.control, armed);
        else if (was) disarm(res.control);
      }
    }
  }
  if (handChanged) for (const { card, x } of cardPositions) {
    if (card.dataset.spent === 'true' || !x) continue;
    const gap = x - card.getBoundingClientRect().left;
    if (gap) tween(300, t => { card.style.translate = `${gap * (1 - t)}px`; }, { curve: ease.EASE, done: () => { card.style.translate = ''; } });
  }
  if (rivalGroup) {
    const used = (thinking ? game.pos : draft.position).used?.[cpu()] ?? 0;
    rivalGroup.control.querySelectorAll<HTMLElement>('.play-rival-mark').forEach((mark, k) => { mark.dataset.spent = String(!!(used >> k & 1)); });
    const left = game.context.rules.hands[cpu()].filter((_, k) => !(used >> k & 1)).length;
    rivalGroup.control.querySelector('.play-rival-count')!.textContent = String(left);
    rivalGroup.control.setAttribute('aria-label', `${text.cardsLeft(left)}. ${gameWords(rivalLine(used))}`); rivalGroup.control.setAttribute('aria-expanded', String(shown === rivalGroup));
  }
  screen.dataset.reading = reading; screen.dataset.review = String(resultReview); screen.dataset.borrow = 'false';
  const actions = net ? onlineActions(net) : undefined;
  // While a notice waits with a control, the hand keeps the place that the notice needs, also under an open reader (reading-b.css).
  screen.dataset.onlineAction = String(!!actions?.querySelector('.kd-button'));
  screen.dataset.readerActive = String(!!(selected != null || !draft.length && inspected != null || draft.armed || choice.length || notice || actions?.childElementCount));
  renderReader(actions); renderHistory(); placeFloating(); fitResult();
  drawMarks();
}
function passTurn(out: boolean) {
  const from = out ? controls.finish : seatRings[1], to = seatRings[out ? 1 : 0];
  if (out) { edgeLight(from, { width: 2.4, ms: 420 }); cue('ting'); pulse('medium'); }
  later(out ? 60 : 0, () => {
    if (!from.isConnected) return;
    cue('pass', { pitch: out ? 1 : .82 });
    streak(at(from), at(to), { width: out ? 6 : 8, ms: out ? 340 : 360, onArrive: () => {
      if (!to.isConnected) return;
      cue('arrive'); pulse(out ? 'tick' : 'light');
      const pop = new Spring(0, 420, 16); pop.v = out ? 1.6 : 2.6;
      onFrame(dt => { to.style.scale = String(1 + pop.step(dt)); if (pop.still) return false; }, () => { to.style.scale = ''; });
    } });
  });
}

function updateSeats() {
  const pos = playingAction && !checkShown ? playingAction.before : thinking ? game.pos : draft.position, active = thinking ? cpu() : player;
  const checked = !ended && game.context.inCheck(pos) ? pos.turn : null;
  const next: [number, number] = [0, 0];
  for (const { pos, move } of [...game.history, ...draft.steps.map(step => ({ pos: step.before, move: step.move }))]) {
    next[pos.turn === player ? 0 : 1] += move.captures.filter(sq => pos.board[sq] && colorOf(pos.board[sq]) !== pos.turn).length;
  }
  if (draft.previewMove) next[0] += draft.previewMove.captures.length;
  const before = counts; counts = next; // set first: with Motion Off the streak arrives at once
  seatRings.forEach((ring, i) => {
    const side = i === 0 ? player : cpu();
    ring.dataset.turn = String(!ended && side === active);
    ring.dataset.check = String(side === checked);
    ring.dataset.thinking = String(i === 1 && thinking && !ended && !onlineActive);
    const store = stores[i], value = next[i];
    store.setAttribute('aria-label', `${value} ${value === 1 ? 'capture' : 'captures'}`);
    store.dataset.empty = String(!value);
    if (value > before[i] && store.textContent !== '' && !ended) {
      const move = i === 0 ? draft.previewMove ?? draft.steps.at(-1)?.move : lastActions.at(-1)?.move;
      const target = move?.captures.at(-1);
      if (target != null) {
        streak(at(cells[target]), at(store), { ms: 400, width: 4, onArrive: () => {
          if (!store.isConnected || counts[i] !== value) return;
          store.textContent = String(value); cue('clink'); burst('sparks', at(store), { count: 5 });
          tween(260, t => { store.style.scale = String(.85 + .15 * t); }, { curve: ease.back });
        } });
        return;
      }
    }
    if (value !== before[i] || !store.textContent) store.textContent = String(value);
  });
  if (!seatFrame && !ended && !reducedMotion()) {
    seatFrame = onFrame((_, now) => {
      if (!screen.isConnected || ended) return false;
      seatRings.forEach(ring => {
        ring.style.setProperty('--breath', ring.dataset.turn === 'true' ? String(1 + .012 * Math.sin(now / 500)) : '.94');
        ring.style.setProperty('--arc', `${now / 4}deg`);
      });
    }, () => { seatFrame = undefined; seatRings.forEach(ring => { ring.style.removeProperty('--breath'); ring.style.removeProperty('--arc'); }); });
  }
}

const armedResource = () => resources.find(r => r.side === player && draft.armed && r.key === draft.armed);
function renderReader(actions?: HTMLElement) {
  if (!detail) return;
  if (detail.childElementCount && detail.dataset.mode === 'result' && reading === 'result') return;
  gameHelp?.setTopic(null);
  detail.replaceChildren(); detail.dataset.mode = reading; detail.scrollTop = 0;
  if (reading === 'result' && onlineActive && onlineState) {
    const state = onlineState, block = el('section', 'play-result'), body = el('div', 'play-result-body'), actions = el('div', 'play-result-actions');
    const winner = state.view?.result?.winner;
    block.dataset.outcome = winner == null ? 'draw' : winner === state.view?.seat ? 'win' : 'loss';
    const heading = el('h3', '', onlineResult(state)), handle = state.opponent?.handle;
    if (block.dataset.outcome === 'loss' && handle) { heading.replaceChildren(el('span', 'play-result-winner', handle), ' wins.'); void document.fonts.ready.then(fitResult); }
    body.append(heading, el('p', 'play-result-cause', state.view?.result?.reason === 'resignation' ? 'The game ends by resignation.' : state.view?.result?.reason === 'agreement' ? 'Both players agree to a draw.' : state.view?.result?.reason === 'timeout' ? 'The move time ends.' : state.view?.result?.reason === 'checkmate' ? 'Checkmate.' : 'The game ends.'));
    const rematch = state.view ? rematchLine(state.rematch, state.view.seat) : '';
    if (rematch) body.append(el('p', 'play-result-facts', rematch));
    if (state.rematch === 'theirs') actions.append(button('Accept rematch', { kind: 'main', onPress: () => { void people!.controller!.rematch('accept'); } }), button('Decline', { onPress: () => { void people!.controller!.rematch('decline'); } }));
    else if (state.rematch === 'accepted' && state.rematchGame) actions.append(button('Open rematch', { kind: 'main', onPress: () => shell.go({ place: 'online', entry: state.rematchGame! }) }));
    else if (state.rematch !== 'mine' && state.rematch !== 'closed') actions.append(button('Rematch', { kind: 'main', onPress: () => { void people!.controller!.rematch('offer'); } }));
    if (state.view && humanOpponent(state.view)) {
      const options: HTMLButtonElement = button('Player options', { onPress: () => playerOptions(people!.safety, { game_id: state.view!.game_id }, options, () => { void people?.controller?.refresh(); }) }); actions.append(options);
    }
    actions.append(resultNewGame(), button(text.home, { onPress: () => shell.go({ place: 'play' }) })); block.append(body, actions); detail.append(block); return;
  }
  if (reading === 'result') {
    const won = game.status === 'checkmate' && game.pos.turn === cpu(), lost = resigned != null || (game.status === 'checkmate' && !won);
    const outcome = won ? 'win' : lost ? 'loss' : 'draw';
    const result = resultText(game.status, resigned != null, game.pos.turn, player);
    const seats = el('div', 'play-result-seat'), ring = el('span', 'play-seat-ring');
    ring.append(figure(kingFile(player))); ring.dataset.outcome = outcome;
    const identity = el('div', 'play-result-name');
    identity.append(el('strong', '', kingLabel(game.context.rules.kings[player]?.king, player)), el('small', '', text.you));
    seats.append(ring, identity);
    screen.querySelector<HTMLElement>('.play-opp .play-seat-ring')!.dataset.outcome = won ? 'loss' : lost ? 'win' : 'draw';
    const card = el('section', 'play-result'), body = el('div', 'play-result-body');
    card.dataset.outcome = outcome;
    const facts = gameFacts(game, elapsedGame());
    body.append(el('h3', '', result.title), el('p', 'play-result-cause', result.cause),
      el('p', 'play-result-facts', `${facts.moves} ${facts.moves === 1 ? 'move' : 'moves'} · ${facts.captures} ${facts.captures === 1 ? 'capture' : 'captures'} · ${Math.floor(facts.playedMs / 60000)} min · Rematch as ${player ? 'Light' : 'Dark'}`));
    const actions = el('div', 'play-result-actions');
    const rematch = button(text.rematch, { kind: 'main', onPress: () => { void start(); } });
    const review = button('See the game', { onPress: () => {
      resultReview = !resultReview; screen.dataset.review = String(resultReview);
      review.querySelector('[data-button-label]')!.textContent = resultReview ? 'Show result' : 'See the game';
      review.setAttribute('aria-pressed', String(resultReview));
    } });
    actions.append(rematch, resultNewGame(),
      review, button('Home', { onPress: () => home() }));
    card.append(seats, body, actions); detail.append(card);
    const rise = () => edgeLight(rematch, { ms: 420, width: 2.4 });
    if (reducedMotion()) return;
    if (won) {
      const spring = new Spring(1, 360, 22); spring.to = 0;
      const paint = () => { card.style.transform = `translateY(${20 * spring.x}px)`; card.style.opacity = String(1 - spring.x); };
      paint(); onFrame(dt => { spring.step(dt); paint(); if (spring.still || !card.isConnected) return false; }, () => { if (card.isConnected) rise(); });
    } else tween(560, t => { card.style.opacity = String(t); card.style.transform = `translateY(${12 * (1 - t)}px)`; }, { curve: ease.out2, done: () => { if (card.isConnected) rise(); } });
    return;
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
  const model = readerModel();
  const full = arrangement || choice.length || shown?.card === -1 || model.tools.length;
  const view = full ? readerView(model, form, nodes) : narratorView(model, nodes);
  if (!onlineActive && writer.blocked && !arrangement) view.classList.add('play-save-blocked');
  detail.append(view); if (full) fitReader(view, model);
}
function resultNewGame() {
  const newGameBtn = button(text.newGame, { onPress: () => openNewGame(newGameBtn, { fromResult: true }) });
  newGameBtn.classList.add('play-result-new');
  newGameBtn.setAttribute('aria-haspopup', 'dialog');
  return newGameBtn;
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
  if (thinking) return text.thinking;
  if (mine && !choice.length) return text.check;
  if (draft.length) return freeText() || !draft.canFinish || (form === 'compact' && !!(shown ?? armedResource())) ? text.notFinal : text.draft;
  return text.ready;
}
/** The words of the reading area in each state, from the A functions of texts.ts, placed in the B slots. */
function readerModel(): ReaderModel {
  if (arrangement && !ended) return { state: arrangementWaiting() ? arrangeText.wait : arrangeText.title,
    title: notice || arrangementWaiting() ? '' : arrangeText.instruction, named: form === 'compact', headTools: [],
    primary: [...(notice ? [line('play-notice', notice)] : []), ...(arrangementWaiting() ? [] : [line('play-arrange-rule', `${notice ? arrangeText.instruction + ' ' : ''}${arrangement.error ?? arrangeText.legal}`)])],
    secondary: [], tools: [], summary: null };

  const res = shown ?? armedResource(), square = inspected ?? selected, code = draft.position.board[square ?? -1];
  const check = choice.length || playingAction && !checkShown ? { mine: false, lines: [] as string[] } : checkLines(game.context, draft.position, player), checks = check.lines.map(t => line('play-check', t));
  const help = controls.help.textContent ?? '', notices = notice ? [line('play-notice', notice)] : [];
  const m: ReaderModel = { state: turnState(check.mine, code), title: '', named: false, headTools: [], primary: [], secondary: [], tools: [], summary: null };
  if (!onlineActive && writer.blocked) {
    Object.assign(m, { title: writer.warning, tools: [button('Load the newer game', { onPress: () => {
      const now = readStored();
      if (!now.resume) { liveGame = false; home(); return; }
      writer.load(now.save); void start({ ...now.resume, level: levelOf(now.save!.skill), playedMs: savedPlayTime(now.save) });
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
    const parts = subjectModel(m, res.subject, res.side, closeX(armed ? `Cancel ${res.name}` : `Close ${res.name}`, () => {
      if (armed) pressResource(res); else { shown = null; notice = ''; reading = ended ? 'result' : 'normal'; update(); }
      res.control.focus({ preventScroll: true });
    }));
    m.primary = [...notices, ...(armed ? [line('play-step', armedStep(draft.armedMoves, draft.now, selected, player))] : []), ...(armed && res.hint ? [line('play-first-step', res.hint)] : []), ...checks];
    m.secondary = [...(parts.owner ? [parts.owner] : []), parts.short, line('play-mark-line', '')];
  } else if (draft.length) {
    m.state ||= text.ready;
    Object.assign(m, { title: checks.length ? 'Check.' : freeText() || stepLines().at(-1) || 'Your turn is staged.',
      primary: [line('play-step', help || (draft.canFinish ? `${onlineActive ? text.send : text.finish}, or undo.` : text.mustContinue))] });
  } else if (code && !ended) {
    // The piece's own effect lines come before its general rule (reading decision 18).
    const parts = subjectModel(m, { kind: 'piece', type: typeOf(code) }, colorOf(code));
    m.primary = [...notices, ...checks];
    m.secondary = [parts.short];
  } else if (thinking) {
    // The computer chooses: the state alone. The computer acts: the sentence of the step that plays.
    const [first = '', ...rest] = sentences(acting); Object.assign(m, { title: notice || first, secondary: (notice && first ? [first, ...rest] : rest).map(t => line('play-last', t)), art: playedCard(cpu(), playingAction?.move) });
  } else {
    const idle = selected == null && inspected == null && !draft.armed && !ended && !notice && !check.mine && !writer.warning;
    Object.assign(m, { title: notice || (check.mine ? check.lines[0] : ''),
      primary: checks.slice(check.mine && !notice ? 1 : 0), secondary: [line('play-instruction', idle && last || 'Choose a piece.')] });
  }
  if (onlineActive) { m.title = gameWords(m.title); m.state = gameWords(m.state); for (const node of [...m.primary, ...m.secondary]) { const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT); while (walk.nextNode()) walk.currentNode.textContent = gameWords(walk.currentNode.textContent ?? ''); } }
  if (writer.warning && !onlineActive) {
    m.primary.unshift(line('play-notice', writer.warning));
  }
  return m;
}
/** Temporary panels stay in the rail on wide screens. Outside input closes only. */
function closeFloating(focus = true) {
  const target = scrollOpen ? historyButton : floatingSource;
  scrollOpen = null; gameHelp?.close(); shown = null;
  update();
  if (focus && target?.isConnected) target.focus({ preventScroll: true });
}
function toggleScroll(kind: 'history', source: HTMLElement) {
  const open = scrollOpen !== kind; closeFloating(false); scrollOpen = open ? kind : null;
  renderHistory(); placeFloating();
  (open ? scrollPanel.querySelector<HTMLButtonElement>('button') : source)?.focus({ preventScroll: true });
}
function currentHistory() {
  return historyGroups(game.history, [], (before, move) => gameWords(sentence(before, move, before.turn !== player, cards(before.turn))),
    (turn, side) => `${Math.ceil(turn / 2)} · ${side === player ? text.you : onlineActive ? 'Opponent' : text.computer}`, text.stagedTurn);
}
function historyRows(groups: ReturnType<typeof currentHistory>): HTMLElement[] {
  if (!groups.length) return [line('', text.noHistory)];
  return groups.map(group => {
    const section = el('section', 'play-history-turn');
    section.append(el('h4', '', group.title));
    for (const item of group.lines) {
      const ink = line('play-history-line', item.line);
      ink.dataset.historyKey = item.key;
      section.append(ink);
    }
    return section;
  });
}
function renderHistory() {
  const groups = currentHistory();
  const openHistory = document.querySelector<HTMLElement>('.history-dialog .sheet-body');
  if (openHistory) openHistory.replaceChildren(...historyRows(groups));
  if (!historyStrip) return;
  historyStrip.hidden = !game.history.length;
  // The closed History is one row: its name and the newest record.
  const preview = groups.flatMap(group => group.lines).slice(0, 1);
  const records = preview.map(item => { const record = el('span', 'play-history-record', item.line); record.dataset.historyKey = item.key; return record; });
  historyButton.querySelector('[data-button-label]')!.replaceChildren(el('span', 'play-history-name', text.history), ...(records.length ? records : [el('span', 'play-history-record', text.noHistory)]));
  historyCompact.replaceChildren(...records.map(record => record.cloneNode(true)));
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
  body.append(...historyRows(groups));
  scrollPanel.replaceChildren(head, body);
  if (focused) scrollPanel.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  if (was !== scrollOpen && !calm() && !matchMedia('(prefers-reduced-motion: reduce)').matches) sheetMotion(scrollPanel, true);
}
function placeFloating() {
  if (!reader || !screen) return;
  // A power or card panel floats only in the normal reading: the result stays in its docked place (decision 124).
  const source = reading === 'normal' && shown?.card === -1 ? shown.control : undefined;
  const wasFloating = reader.dataset.floating === 'true';
  reader.dataset.floating = String(!!source);
  reader.classList.toggle('kd-paper', !!source);
  if (floatingSource && floatingSource !== source) floatingSource.setAttribute('aria-expanded', 'false');
  floatingSource = source ?? null;
  if (source) { source.setAttribute('aria-controls', reader.id); source.setAttribute('aria-expanded', 'true'); }
  reader.setAttribute('aria-label', shown?.name ?? text.last);
  const place = (panel: HTMLElement, anchor: HTMLElement) => {
    const box = screen.getBoundingClientRect(), at = anchor.getBoundingClientRect();
    const rail = screen.dataset.layout === 'wide', left = rail ? parseFloat(screen.style.getPropertyValue('--board-x')) + parseFloat(screen.style.getPropertyValue('--board')) + parseFloat(screen.style.getPropertyValue('--gap')) : Math.max(4, at.left - box.left);
    const width = Math.min(rail ? parseFloat(screen.style.getPropertyValue('--rail')) : 380, box.width - 8);
    // The wide rail keeps its command tray in view; History opens over the turn text, below the opponent bar.
    const wide = screen.dataset.form === 'wide', readerY = parseFloat(screen.style.getPropertyValue('--reader-y'));
    const history = wide && panel === scrollPanel, { top, height } = panelBox(wide ? parseFloat(screen.style.getPropertyValue('--action-y')) : box.height,
      history ? readerY : at.top - box.top, history ? readerY : at.bottom - box.top);
    panel.style.setProperty('--panel-left', `${Math.min(left, box.width - width - 4)}px`);
    panel.style.setProperty('--panel-top', `${top}px`); panel.style.setProperty('--panel-width', `${width}px`);
    panel.style.setProperty('--panel-height', `${height}px`);
  };
  if (source) { place(reader, source); if (!wasFloating && keyed) detail.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }); }
  if (scrollOpen) place(scrollPanel, historyButton);
}
function outsidePanel(event: Event) {
  if (event.type === 'pointerdown') swallowedPointer = false;
  if (document.body.dataset.page !== 'game' || document.querySelector('dialog[open]')) return;
  if ((event.target as Element).closest?.('.daylight-help-sheet, .daylight-help-shade')) return;
  if ((event.target as Element).closest?.('.play-menu-button')) return;
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
      gameHelp?.openRule({ kind: 'card', id }, row, game.context, cpu());
    } });
    row.classList.add('play-rival-row'); if (used >> k & 1) row.append(' ', el('small', '', readingBText.used)); return row;
  });
  const close = closeX(`Close ${res.name}`, () => { shown = null; notice = ''; update(); res.control.focus({ preventScroll: true }); });
  const list = el('div', 'play-rival-rows'); list.append(...rows);
  Object.assign(m, { title: res.name, named: true, headTools: [close], primary: [list] });
}
/** The narrator supplies one rule line and one route to the full rule. */
function subjectModel(m: ReaderModel, subject: LearnSubject, side: Color, action?: HTMLButtonElement) {
  const entry = learningEntry(subject, game.context, draft.position, side);
  gameHelp?.setTopic(subject, game.context, side);
  Object.assign(m, { title: entry.name, named: true, headTools: [
    ...(gameHelp ? [gameHelp.infoButton] : []), ...(action ? [action] : []),
  ] });
  return { owner: subject.kind === 'power' ? line('learn-owner', `${side === cpu() ? readingText.computerPower : readingText.yourPower} · ${entry.uses}`) : null,
    short: line('learn-short', side === cpu() && subject.kind === 'power' ? opponentLines[subject.id] ?? entry.short : entry.short) };
}

function helpAvoid() {
  return [reader, ...screen.querySelectorAll('.play-opp, .play-own, .play-turn')].map(node => node.getBoundingClientRect());
}

const replyText = () => [...replySteps.flatMap(step => effectEndLines(game.context, step.before, step.move, step.after, player)), ...replySteps.map(step => sentence(step.before, step.move, true, cards(cpu()))).filter(Boolean)].join(' ');
const cardArt = (side: Color, k: number) => { const id = game.context.rules.hands[side][k], art = RELEASED_CARDS.find(c => c.id === id)?.art; return `/${art ?? 'ui/cards/back.webp'}`; };
/** The power as an enamel object: its name and its uses left. The computer's power only reads. */
function addPower(side: Color, parent: HTMLElement) {
  const r = game.context.rules, king = r.kings[side];
  if (!king) return;
  const uses = usesAllowed(king.power, r);
  const res: Resource = { subject: { kind: 'power', id: king.power }, side, key: uses ? POWER_TAG[king.power] ?? null : null, name: POWER_NAME[king.power], short: powerLines[king.power] ?? '', card: null, control: button(POWER_NAME[king.power], { onPress: () => pressResource(res) }) };
  const coin = el('span', 'play-power-coin'), emblem = decorativeImage(el('img'), `/ui/emblems/${king.king.toLowerCase()}.webp`);
  const notches = el('span', 'play-power-notches'); notches.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < (uses ?? 0); i++) notches.append(el('i', 'play-power-notch'));
  coin.append(emblem, notches);
  res.control.classList.add('play-power');
  const label = res.control.querySelector('[data-button-label]')!;
  const copy = el('span', 'play-power-copy'); copy.append(label, el('small'));
  res.control.append(coin, copy); resources.push(res); parent.append(res.control);
}
/** The four shared cards as painted cards. The Ribbon setting hides the paintings. */
function addCards(parent: HTMLElement) {
  const r = game.context.rules, hand = el('div', 'play-hand'); hand.setAttribute('role', 'group'); hand.setAttribute('aria-label', text.yourCards); parent.append(hand);
  r.hands[player].forEach((card, k) => {
    const key = card === 'MirrorB' ? 'mirrorb' : (Object.keys(TAG_POWER) as PowerTag[]).find(tag => TAG_POWER[tag] === card) ?? null;
    const res: Resource = { subject: { kind: 'card', id: card }, side: player, key, name: cardName(card), short: cardLine(card), card: k, control: button(cardName(card), { onPress: () => pressResource(res) }) };
    res.control.prepend(decorativeImage(el('img'), cardArt(player, k))); res.control.append(el('small', 'play-card-state'));
    // Keep words intact when a two-word card name wraps at the top edge.
    const words = res.name.split(' '), label = res.control.querySelector('[data-button-label]')!;
    label.replaceChildren(...words.flatMap((word, i) => [...(i ? [' '] : []), el('span', '', word)]));
    res.control.classList.add('play-card'); res.control.dataset.frost = String(key === 'freeze'); res.control.style.setProperty('--fan-angle', `${(k - (r.hands[player].length - 1) / 2) * 4}deg`);
    res.control.style.setProperty('--fan-drop', `${Math.abs(k - (r.hands[player].length - 1) / 2) * 2}px`); resources.push(res); hand.append(res.control); trackCard(res.control, key === 'freeze');
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
  gameHelp?.close(); skipBoard();
  if (ended) return; // the last reply can end the game inside skipBoard: the result keeps its place (decision 129)
  clearChoice(); selected = inspected = null; reading = 'normal'; shown = res;
  const reason = res.side === player && res.card != null && res.key ? refusalReason({ draft, player, inputLocked: thinking },
    { kind: 'card', index: res.card, key: res.key }) : null;
  const spent = res.control.dataset.spent === 'true', short = res.side === cpu() && res.subject.kind === 'power' ? opponentLines[res.subject.id] ?? res.short : res.short;
  // The owner line of the reading area names who has a power; the cancel line names a card or a power (reading decisions 19 and 22).
  if (res.side === cpu() || !res.key) notice = '';
  else if (draft.armed === res.key) { if (res.key !== 'freeze') cue('tick'); draft.arm(res.key); shown = null; res.hint = undefined; notice = ''; update(); announce(cancelLine(res.subject.kind)); return; }
  else if (spent) notice = text.spent;
  else if (thinking) notice = fault ? sideText.computerFailed : text.wait;
  else if (!draft.armable(res.key)) notice = draft.open ? text.noTarget : text.notYet;
  else {
    draft.arm(res.key); notice = '';
    if (res.key !== 'freeze') {
      cue('lift'); cue('clink'); pulse('light');
      if (res.card != null) later(90, () => { if (res.control.isConnected && draft.armed === res.key) edgeLight(res.control, { ms: 300, width: 2.4 }); });
    } resources.forEach(r => { r.hint = undefined; });
    const key = subjectKey(res.subject); if (!readHints().has(key)) res.hint = stepLine(res.subject);
  }
  if (notice && reason) notice = reason.line;
  if (notice && res.key !== 'freeze') { cue('no'); pulse('refuse'); shake(res.control, { ms: 200, amplitude: 3 }); }
  update();
  if (notice && reason) gameHelp?.showRefusal(reason, res.control, helpAvoid().filter((_, i) => i !== 2));
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
  setFxMotion(motion, reduce);
  homeView?.reveal.sync();
  if (screen?.isConnected && seatRings) updateSeats();
  const pace = reduce || pieceView === 'symbols' ? 'off' : motion;
  board?.setMotion(pace);
  // Motion Off ends a running Replay: its restore shows the current draft.
  if (pace === 'off') boardReplay.cancel();
}
startFx((name, options) => {
  if (!sound) return;
  if (sfx) { sfx.playDaylightSound(name, options); return; }
  void import('../../render/sfx').then(audio => {
    sfx = audio;
    audio.setSound(sound);
    if (sound) audio.playDaylightSound(name, options);
  }).catch(() => {});
});
setFxVibration(vibration);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', setMotion); setMotion();
/** The layout classes of decision 34 (layout.ts). The game box is the viewport after the safe areas, so its size is W and H. */
function layout() {
  if (!boardBox?.isConnected) return;
  const l = gameLayout(screen.clientWidth, screen.clientHeight, gameType(game.context.rules)), changed = form !== l.form;
  form = l.form;
  Object.assign(screen.dataset, { layout: l.kind === 'rail' ? 'wide' : 'portrait', form: l.form, short: String(l.form === 'compact') });
  const values = { board: l.board, opp: l.opp, own: l.own, fin: l.fin, reader: l.reader, 'usable-height': l.H, rail: l.col,
    col: (l.W - l.col) / 2, gap: l.gap, 'rail-top': l.railTop, 'rail-h': l.railH, 'board-x': l.boardX, 'board-y': l.boardY,
    'reader-y': l.readerY, 'hand-y': l.handY, 'action-y': l.actionY };
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
    if (descriptions.length) cell.setAttribute('aria-description', gameWords(descriptions.join(' ')));
    else cell.removeAttribute('aria-description');
  }
  // Playback holds its target. The next board input clears the opponent cue.
  const marks = mergeMarks(resultMarks(pos, (playingAction ? lastActions.slice(0, -1) : lastActions).filter(action => action.before.turn === cpu())), preview, ...(ended ? [] : [stateMarks(game.context, pos)]));
  if (checkPulse) {
    marks.check = checkPulse.square;
    marks.checkProgress = checkPulse.progress;
  }
  board.mark(marks);
}
/** Account settings and the game menu share the same save writer. */
function settings(): Settings {
  const write = () => {
    if (!onlineActive && shell.route.place === 'game') writer.settings(prefs(), () => snapshot(draft, resigned, player, elapsedGame(), arrangement));
    else writer.settings({ ...prefs(), skill: readSave().save?.skill ?? SKILLS[level] }, () => snapshot(new DraftTurn(next.game), null, 0));
  };
  return {
    pieceView, coords, sound, vibration, motion,
    setPieceView: value => { pieceView = value; store('kingdown.piece-view', pieceView); applyPieceView(); },
    setCoords: on => { coords = on; if (screen) screen.dataset.coords = String(coords); write(); },
    setSound: on => { sound = on; sfx?.setSound(sound); if (sound) sfx?.unlockSound(); write(); },
    setVibration: on => { vibration = on; setFxVibration(on); storeVibration(prefs()); },
    setMotion: value => { motion = value as Pace; setMotion(); write(); },
  };
}

function openPeopleLayer(open: (onClose: () => void) => PeopleSheet) {
  if (document.querySelector('dialog[open]')) return;
  const sheet = open(() => { void shell.closeLayer(); });
  if (sheet.isOpen) shell.openLayer(sheet.close);
}

let settingsDialog: HTMLDialogElement | undefined, settingsOpener: HTMLElement | undefined;
function openSettings(source: HTMLElement) {
  shell.settled(() => {
    if (shell.route.place !== 'play' || settingsDialog || document.querySelector('dialog[open]')) return;
    settingsOpener = source;
    const dialog = settingsSheet(settings(), { account: buildAccountSection(), onClose: closeSettings });
    settingsDialog = dialog;
    document.body.append(dialog);
    dialog.showModal();
    dialog.querySelector('h2')!.focus({ preventScroll: true });
    shell.openLayer(() => shutSettings(false));
    if (peopleStatus === 'checking') void loadPeople().catch(() => {});
  });
}
function shutSettings(history: boolean) {
  if (!settingsDialog) return;
  settingsDialog.close();
  settingsDialog.remove();
  settingsDialog = undefined;
  const source = settingsOpener?.isConnected ? settingsOpener : homeSettingsButton();
  settingsOpener = undefined;
  source?.focus({ preventScroll: true });
  if (history) void shell.closeLayer();
}
function closeSettings() { shutSettings(true); }
function fromSettings(open: (source: HTMLButtonElement) => void) {
  closeSettings();
  shell.settled(() => {
    const source = homeSettingsButton();
    if (shell.route.place === 'play' && source) open(source);
  });
}

function buildAccountSection() {
  const host = people;
  const section = el('section', 'settings-account'), me = host?.host.me();
  section.append(el('h3', '', 'Account'));
  if (host && me && peopleStatus !== 'failed') {
    const name = me.handle ?? host.user?.name ?? 'Player';
    section.append(profilePortrait(name, host.user?.avatar), el('p', '', name),
      button('Sign out', { onPress: () => { void host.signOut().catch(() => announce('Sign-out cannot finish. Try again.')); } }),
      button('Blocked players', { onPress: () => fromSettings(source => openPeopleLayer(onClose => blockedPlayers(host.safety, source, onClose))) }),
      button('Delete account', { kind: 'danger', onPress: () => fromSettings(source => openPeopleLayer(onClose => deleteAccount(source, host.deletion, onClose))) }));
  } else if (peopleStatus === 'checking') section.append(el('p', '', 'Checking sign-in…'));
  else {
    const signIn = button(text.signIn, { onPress: () => fromSettings(source => accountSignIn(source, true)) });
    signIn.setAttribute('aria-haspopup', 'dialog');
    const note = peopleStatus === 'failed' ? peopleLoadError : accountNote;
    if (note) section.append(el('p', 'account-note', note));
    section.append(signIn);
  }
  return section;
}
function showAccount() {
  const account = settingsDialog?.querySelector('.settings-account');
  if (!account) return;
  const next = buildAccountSection();
  if (!account.isEqualNode(next)) account.replaceChildren(...next.childNodes);
}

let gameDialog: HTMLDialogElement | undefined;
function showGameDialog(dialog: HTMLDialogElement, back?: () => boolean) {
  gameDialog = dialog;
  document.body.append(dialog);
  dismissSheet(dialog, closeGameDialog);
  dialog.showModal();
  dialog.querySelector<HTMLElement>('[tabindex="-1"]')?.focus({ preventScroll: true });
  shell.openLayer(() => shutGameDialog(false), undefined, back);
}
function shutGameDialog(history: boolean) {
  const dialog = gameDialog;
  if (!dialog) return;
  gameDialog = undefined;
  dialog.close();
  dialog.remove();
  if (dialog.classList.contains('guide-dialog')) { closeGuidePanel(); update(); }
  menuButton.focus({ preventScroll: true });
  if (history) void shell.closeLayer();
}
function closeGameDialog() { shutGameDialog(true); }
/** At a game end, Menu (Offer draw, Resign) and the Resign confirm are stale and cover the result. The Guide and History stay. */
function closeStaleDialogs() {
  if (gameDialog?.classList.contains('game-menu-dialog')) closeGameDialog();
  // The cancel event takes the path of Escape: the confirm gives back its history layer.
  if (resignDialog?.element.open) { resignDialog.element.dispatchEvent(new Event('cancel')); resignDialog.element.close(); }
}
function closeMenu(next?: () => void) {
  const route = shell.route, current = screen;
  closeGameDialog();
  if (next) shell.settled(() => {
    if (shell.route === route && screen === current && screen.isConnected) next();
  });
}
function openMenuDialog() {
  gameHelp?.close();
  closeFloating(false);
  shell.settled(() => {
    if (!screen.isConnected || document.querySelector('dialog[open]')) return;
    const dialog = el('dialog', 'kd-dialog sheet-dialog game-menu-dialog');
    dialog.setAttribute('aria-labelledby', 'game-menu-title');
    const actions = el('div', 'online-menu-actions');
    const state = onlineActive ? people?.controller?.state() ?? onlineState : undefined;
    if (state) {
      if (state.canOfferDraw) actions.append(button('Offer draw', { onPress: () => { void people!.controller!.offerDraw(); closeMenu(); } }));
      if (state.abortOpen) actions.append(button('End with no result', { onPress: () => { void people!.controller!.abort(); closeMenu(); } }));
      if (people && state.view && humanOpponent(state.view)) actions.append(...playerSafety(people.safety, { game_id: state.view.game_id },
        () => { void people?.controller?.refresh(); }, closeMenu, menuButton, openPeopleLayer));
    }
    dialog.append(gameMenu(settings(), {
      saveLine: !ended && !onlineActive ? writer.warning : '',
      onClose: () => closeMenu(),
      onHome: () => closeMenu(() => home(true)),
      onGuide: () => closeMenu(openGameGuide),
      onHistory: game.history.length ? () => closeMenu(openGameHistory) : undefined,
      onResign: () => closeMenu(openResign),
      showResign: !ended,
      onlineActions: actions,
    }));
    showGameDialog(dialog);
  });
}
function openResign() {
  if (ended || document.querySelector('dialog[open]')) return;
  const dialog = resignDialog.element;
  const closed = () => { void shell.closeLayer(); };
  dialog.addEventListener('kd-before-close', closed, { once: true });
  resignDialog.open(menuButton);
  shell.openLayer(() => {
    dialog.removeEventListener('kd-before-close', closed);
    dialog.close();
  });
}
function openGameGuide() {
  if (document.querySelector('dialog[open]')) return;
  const dialog = el('dialog', 'kd-dialog guide-dialog');
  dialog.setAttribute('aria-label', text.guide);
  let guideSection: string | undefined, guideEntry: string | undefined;
  function show(section?: string, entry?: string) {
    guideSection = section; guideEntry = entry;
    dialog.replaceChildren(guidePage(guideSection, guideEntry, show, announce, { backLabel: 'Game', onBack: closeGameDialog }));
    dialog.scrollTop = 0;
  }
  function backGuide() {
    if (!guideEntry || guideSection === 'How a turn works' || matchMedia('(min-width: 900px)').matches) return false;
    show(guideSection);
    return true;
  }
  show();
  showGameDialog(dialog, backGuide);
}
function openGameHistory() {
  if (document.querySelector('dialog[open]')) return;
  const dialog = el('dialog', 'kd-dialog sheet-dialog history-dialog');
  const head = el('header', 'sheet-head'), title = el('h3', '', text.history);
  title.id = 'game-history-title'; title.tabIndex = -1;
  dialog.setAttribute('aria-labelledby', title.id);
  head.append(title, closeX('Close history', closeGameDialog));
  const body = el('div', 'sheet-body');
  body.append(...historyRows(currentHistory()));
  dialog.append(head, body);
  showGameDialog(dialog);
}

function closeHomeGuide() {
  shell.go({ place: 'play' });
  root.querySelector<HTMLElement>('.home-guide-btn')?.focus({ preventScroll: true });
}

function renderPlace(route: Route) {
  homePoll?.update();
  if (route.place !== 'play') clearInviteLinkStatus();
  if (route.place !== 'play' && route.place !== 'you' && route.place !== 'person') leaveHome();
  if (route.place === 'online') { void openOnline(route.entry!); return; }
  if (route.place === 'join') {
    onlineActive = false; people?.stopGame();
    void loadPeople().then(async host => { const { landingPage } = await import('../people/screens/landing'); if (shell.route.place === 'join') { document.body.dataset.page = 'join'; root.replaceChildren(landingPage(host.host, route.entry ?? '')); } }).catch(() => shell.go({ place: 'play' })); return;
  }
  if (route.place === 'person') { personFlow(); return; }
  if (onlineActive) { onlineActive = false; onlineState = undefined; people?.stopGame(); liveGame = false; }
  if (enteredAt !== undefined && liveGame && !onlineActive) { stopGameTime(); save(false); }
  gameHelp?.close(); closeGuidePanel();
  if (route.place === 'game') {
    if (liveGame && !ended) { void start({ game, draft, level: gameLevel, player }); return; }
    const now = readStored();
    if (now.resume) { writer.load(now.save); void start({ ...now.resume, level: levelOf(now.save!.skill), playedMs: savedPlayTime(now.save) }); return; }
    shell.go({ place: 'play' }); return;
  }
  if (route.place === 'play') { home(); return; }
  if (route.place === 'you') {
    shell.go({ place: 'play' }, false, true);
    home();
    openSettings(homeSettingsButton() ?? root);
    return;
  }
  endResult?.(); rewind?.finish(); seatFrame?.finish(); boardReplay.cancel(); generation++; engine.cancel(); endEntry(); endCardFlight(); cancelCheckPulse(); board?.dispose(); board = undefined; endReply = null;
  document.body.dataset.page = route.place;
  if (route.place === 'guide') root.replaceChildren(guidePage(route.section, route.entry,
    (section, entry) => shell.go({ place: 'guide', ...(section && { section }), ...(entry && { entry }) }),
    announce, { onBack: closeHomeGuide }));
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
void symbolsReady.then(() => { applyPieceView(); document.querySelectorAll<HTMLImageElement>('.mini-board:not(.mini-painted) .mini-glyph[data-code]').forEach(img => { img.src = symbol(Number(img.dataset.code)); }); });
