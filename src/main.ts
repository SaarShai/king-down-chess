import { initTable, teachFirstGame } from './ui/table';
import './style.css';
import { Engine } from './game';
import { PaintedView, type BoardView } from './render/PaintedView';
import { setSound } from './render/sfx';
import { HISTORY_WHENS, POWERS_BALANCED, RULES_2017, RULES_2021, parseKings, parseRule, type Rules } from './rules/engine';
import { CLASSIC_CHESS, POOL } from './rules/setup';
import { TRY_THESE } from './try-these';
import { initLessonShelf } from './lesson-shelf-ui';
import { defaultSetup, newGameDialog, parseSetup, setupOfGame, type Setup } from './new-game';
import './dialog-dismiss';
import { firstVisit, openTitle, startFirstDeal } from './ui/title';
import './ui/table.css';
import { initMenu } from './ui/menu';
// Before ui/home-view: the CSS keeps its order (game-end.ts brings ceremony.css, then home.css).
import { connectPlay, isSide } from './screen/play';
import { shouldShowHome } from './ui/home';
import { initHome } from './ui/home-view';
import { connectGuide } from './ui/guide';
import { gameLinkless } from './screen/links';
import { connectSettings } from './screen/settings';
import { readSave, storedSettings } from './screen/save';
import { connectKeys } from './screen/keys';

const params = new URLSearchParams(location.search);
/**
 * `?army=` or `?fen=`, with `&moves=`: a game sent by a friend (`gameLink`). It keeps this device's
 * settings, and replaces the autosave after a confirm, unless it continues the saved game.
 */
const linkMoves = params.get('moves');
/** A game link's `?design=`: the design that plays as `T` (ticket 17); a link with a design that this page cannot read does not open, and says why. */
const linkDesign = (() => {
  try {
    const d = parseRule(`design=${params.get('design') ?? ''}`).design;
    return d?.rules.some(r => HISTORY_WHENS.includes(r.when.on)) ? undefined : d; // `setRules` refuses it
  } catch { return undefined; }
})();
const gameLink = linkMoves != null && (params.has('army') || params.has('fen'));
const link = gameLink && linkDesign !== undefined;
/** A game link that does not open (`gameLink && !link`) also leaves its `?rules=` and `?kings=` out: the saved game stays. */
const unread = gameLink && !link;
/** `?rules=2017|2021` plays an older rule set. No parameter = the measured 2026 rules. */
const preset = unread ? undefined : { 2017: RULES_2017, 2021: RULES_2021 }[params.get('rules') ?? ''];
/**
 * `?kings=spirit:mercy,mud:march` — White first; one value gives both sides the same king
 * (docs/RULES.md §4). The default is **no powers**; the New game dialog picks each side's power.
 */
const kings = unread ? null : params.get('kings');
// Before the first Game: its constructor builds a position and asks for its status.
/** With any power in play, the balanced readings apply (an older `?rules=` preset still overrides them). */
const withPowers = (k: Rules['kings']): Partial<Rules> => (k[0] || k[1] ? POWERS_BALANCED : {});
const initialKings = kings ? parseKings(kings) : undefined;
const initialRules: Partial<Rules> = { ...(initialKings ? withPowers(initialKings) : {}), ...preset, ...(initialKings ? { kings: initialKings } : {}), ...(link && linkDesign ? { design: linkDesign } : {}) };
/** A plain `?fen=` position (not a game link): it wins over the autosave, and the account's saved game does not replace it. */
const fen = gameLink ? null : params.get('fen');

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const engine = new Engine();
// The painted board is the game's only look: an old `?look=` link or saved look opens it too (the clay look is parked).
// It stands on the page's parchment floor: the scene draws no floor of its own.
const view: BoardView = new PaintedView($('board'), { floor: null, webInk: true });
view.onLoadError = () => { $('asset-status').textContent = 'A piece cannot load. Reload to try again.'; play.refresh(); };
(window as unknown as Record<string, unknown>).view = view; // the browser checks aim with view.screenOf()
/** The next game's setup: the last one started from New game (remembered across visits). */
let setup: Setup = defaultSetup();
/** Settings → Account and the cloud save, loaded after the board is drawn (null until then, or offline). */
let account: typeof import('./account/account') | null = null;

// The parts that the turn core calls. Their closures read `play` only after it exists.
const guide = connectGuide({ shownPos: () => play.shownPos(), context: () => play.game().context, preset });
const settings = connectSettings(view, { skill: () => play.skill(), setSkill: level => play.setSkill(level), save: () => play.saveSettings(), refresh: () => play.refresh() });
const home = initHome({
  read: () => play.homeInput(),
  continue: () => { play.refresh(); void play.maybeAi(); },
  rematch: () => play.rematch(),
  review: () => void play.showPly(play.game().history.length, false),
  newGame: () => openNewGame(),
  today: () => openToday(),
});
(window as unknown as Record<string, unknown>).home = home; // Samples read the live game, including a staged turn.
const play = connectPlay(view, {
  params, preset, rules: initialRules, withPowers, fen, engine, guide, settings, home,
  keys: () => keys, account: () => account, setup: () => setup, openNewGame: () => openNewGame(),
});

$('first-lesson').onclick = () => play.startLesson(0);
initLessonShelf(play.startLesson, () => $('return-game').click());

/** The Workshop (docs/WORKSHOP.md): its own chunk, loaded on the first tap. It opens over its caller, which stays open. */
let workshop: Promise<ReturnType<typeof import('./workshop/ground')['groundDialog']>> | undefined;
function openWorkshop(code?: string): void {
  workshop ??= import('./workshop/ground').then(m => m.groundDialog(() => play.game().context));
  workshop.then(w => (code ? w.openDesign(code) : w.open()), () => {
    workshop = undefined;
    alert('The Workshop could not load. Check the connection and try again.');
  });
}
$('title-workshop').onclick = () => openWorkshop();
$('workshop-btn').onclick = () => openWorkshop();

/* ---- New game ---- */
const SETUP_KEY = 'kingdown.new-game';
const loadSetup = (): Setup | null => { try { return parseSetup(JSON.parse(localStorage.getItem(SETUP_KEY) ?? 'null')); } catch { return null; } };
/** Today's army: the same random army for every player on a given local date. */
const today = (): string => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
const OGRE_PRACTICE = '7k/8/6o1/8/2OP4/8/8/K7 w - - 0 1';
for (const row of TRY_THESE) {
  const option = document.createElement('option');
  option.value = row.code;
  option.textContent = `${row.code}${row.code.includes('C') ? ' — Catapult lab' : ''}`;
  option.title = row.watch;
  $('army-examples').appendChild(option);
}
/** Start game: the dialog's setup becomes the next game's, and its army starts. */
const dialog = newGameDialog(s => {
  let back: string | undefined;
  if (s.army === 'custom') {
    back = prompt(`Back rank (8 letters, one K; current draw pool ${POOL}):`, play.game().backRank)?.toUpperCase().trim();
    if (!back) return; // the dialog stays open
    if (back.split('S').length > 2) { alert('One Beast per army.'); return; } // owner, 2026-10-04
  }

  setup = s;
  try { localStorage.setItem(SETUP_KEY, JSON.stringify(s)); } catch { /* private mode: the choices last this visit */ }
  if (s.army === 'daily') { const d = today(); play.newGame(undefined, null, false, d); }
  else if (s.army === 'classic') play.newGame(CLASSIC_CHESS);
  else if (s.army === 'ogre') play.newGame(undefined, OGRE_PRACTICE);
  else if (back) { try { play.newGame(back); } catch (e) { alert((e as Error).message); } }
  else if (s.army !== 'random') {
    play.newGame(s.army);
    const example = TRY_THESE.find(row => row.code === s.army);
    if (example) play.say(example.watch);
  } else play.newGame();
}, preset);
const openGameSetup = (choices: Setup): void => dialog.open(choices, play.warning());

const openNewGame = (): void => openGameSetup(setup);
const openToday = (): void => openGameSetup({ ...setup, army: 'daily' });
$('new-game-btn').onclick = openNewGame;
initMenu({ playAgain: () => play.newGame(), today: openToday, resignSide: play.resigner });
initTable(() => { void play.showPly(null, false); });
// Nothing between connectPlay and this line may call refresh(), drawMarks() or showPly(): they read `keys`.
const keys = connectKeys($('board'), play, play.commands);

/** A partial save needs a recovery choice, also on a plain `?fen=` page. */
const localSave = readSave();
const stored = params.has('fen') && !link && !localSave.partial ? { save: null, unreadable: false } : localSave, saved = stored.save;
if (saved) {
  play.seat(saved.white, saved.black);
  settings.applySettings(saved);
} else if (stored.unreadable) {
  const kept = storedSettings(); // a game that cannot replay keeps its settings: Animations Off still stills the title
  if (kept) settings.applySettings(kept);
}
setup = loadSetup() ?? (saved ? setupOfGame(play.sides(), saved.rules?.kings ?? [null, null], play.skill()) : defaultSetup());
/** `?players=human,ai` (White, then Black): who plays the game this page opens. For the lab and the browser checks. */
const urlPlayers = params.get('players')?.split(',');
if (urlPlayers?.length === 2 && urlPlayers.every(isSide)) play.seat(urlPlayers[0], urlPlayers[1]);

/*
 * Title screen: once per browser tab, never over a game link or a `?fen=`/`?army=` URL. `?title=0`
 * skips it, and so does sessionStorage `kingdown.title-seen` (the browser tools set it).
 */
const TITLE_SEEN = 'kingdown.title-seen';
const titleSeen = (): boolean => { try { return sessionStorage.getItem(TITLE_SEEN) === '1'; } catch { return false; } };
const showHome = !localSave.partial && !link && shouldShowHome(params, { hasSave: !!saved, titleSeen: titleSeen(), firstVisit: firstVisit(saved?.moves.length ?? 0) });
const showTitle = !localSave.partial && !showHome && !link && !params.has('fen') && !params.has('army') && !params.has('design') && params.get('title') !== '0' && !titleSeen();
const titleClosed = showTitle ? openTitle(firstVisit(saved?.moves.length ?? 0), !!saved?.moves.length, () => settings.pace()) : Promise.resolve('continue' as const);

if (params.get('labels') === '1') settings.showLabels(); // `?labels=1` turns the letters on over the saved choice
view.setLabels(settings.labels());
view.setCoords(settings.coords());
settings.applyPace();
const lans = linkMoves?.split('_').filter(Boolean) ?? [];
const continues = !!saved && (params.get('army') ? saved.back === params.get('army') : !saved.back && saved.fen === params.get('fen'))
  && saved.moves.every((m, i) => lans[i] === m);
const openLink = link && (!saved?.moves.length || continues || confirm('Open the game from this link? It replaces your current game.'));
if (gameLink) { // a reload then resumes the autosave
  const url = new URL(gameLinkless());
  if (unread) for (const k of ['rules', 'kings']) url.searchParams.delete(k);
  history.replaceState(null, '', url);
}
play.restore(saved, { link: openLink, continues, urlRules: !!(preset || kings || (openLink && linkDesign)), title: showTitle,
  unreadable: stored.unreadable,
  notice: unread ? `The game link holds a piece that this version cannot read.${saved ? ' Your saved game stays.' : ''}` : '' });
await view.ready();
if ($('asset-status').textContent === 'Loading pieces…') $('asset-status').textContent = '';
guide.fill(); // after every setRules path (URL preset / save restore)
setSound(settings.sound());
play.moments.restore();
play.refresh();
if (showHome) home.open();
if (!fen) play.save(); // pin the random back rank so a reload keeps this game (and keep an opened link's game)
void import('./account/account').then(m => { account = m; m.changed(); m.startAccount(play.fromAccount, play.savedGames); })
  .catch(() => { /* offline on a first visit: play on without an account */ });
const designLink = gameLink ? null : params.get('design'); // without a game link, `?design=` opens the Workshop
if (designLink) {
  const url = new URL(location.href);
  url.searchParams.delete('design');
  history.replaceState(null, '', url); // a reload then shows the game
  openWorkshop(designLink);
}
const titleChoice = await titleClosed; // the computer waits for the player, and no dialog opens over the title
await play.previously.start();
if (titleChoice === 'start') startFirstDeal(SETUP_KEY, (s, army) => { setup = s; play.newGame(army); teachFirstGame(play.game()); play.refresh(); });
else if (titleChoice === 'learn') play.startLesson(0);
else {
  if (titleChoice === 'play') {
    // The saved game's computer waits behind the dialog: it may move only once New game is closed
    // (a started game runs its own computer; maybeAi() does nothing while one is already thinking).
    $('new-game').addEventListener('close', () => void play.maybeAi(), { once: true });
    openNewGame();
  }
  else {
    if (!home.visible && play.ended()) play.moments.showOver();
    void play.maybeAi();
  }
}
