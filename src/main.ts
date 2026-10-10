import './style.css';
import { Engine } from './game';
import { setEvaluator } from './ai/eval';
import { PaintedView, type BoardView } from './render/PaintedView';
import { setSound } from './render/sfx';
import { STYLES } from './render/styles';
import { POWERS_BALANCED, RULES_2017, RULES_2021, parseKings, setRules, type Rules } from './rules/engine';
import { CLASSIC_CHESS, POOL, randomBackRank } from './rules/setup';
import { TRY_THESE } from './try-these';
import { initLessonShelf } from './lesson-shelf-ui';
import { mulberry32 } from './sim/rng';
import { defaultSetup, newGameDialog, parseSetup, setupOfGame, type Setup } from './new-game';
import './dialog-dismiss';
import { firstVisit, openTitle, startFirstDeal } from './ui/title';
import './ui/table.css';
import { initMenu } from './ui/menu';
import { initTable } from './ui/table';
// Before ui/home-view: the CSS keeps its order (game-end.ts brings ceremony.css, then home.css).
import { connectPlay, isSide } from './screen/play';
import { shouldShowHome } from './ui/home';
import { initHome } from './ui/home-view';

import { connectGuide } from './ui/guide';
import { gameLinkless } from './screen/links';
import { LOOK_KEY, connectSettings } from './screen/settings';
import { readSave } from './screen/save';
import { connectKeys } from './screen/keys';

const params = new URLSearchParams(location.search);
/** `?rules=2017|2021` plays an older rule set. No parameter = the measured 2026 rules. */
const preset = { 2017: RULES_2017, 2021: RULES_2021 }[params.get('rules') ?? ''];
/**
 * `?kings=spirit:mercy,mud:march` — White first; one value gives both sides the same king
 * (docs/RULES.md §4). The default is **no powers**; the New game dialog picks each side's power.
 */
const kings = params.get('kings');
// Before the first Game: its constructor builds a position and asks for its status.
/** With any power in play, the balanced readings apply (an older `?rules=` preset still overrides them). */
const withPowers = (k: Rules['kings']): Partial<Rules> => (k[0] || k[1] ? POWERS_BALANCED : {});
if (preset || kings) {
  const k = kings ? parseKings(kings) : undefined;
  setRules({ ...(k ? withPowers(k) : {}), ...preset, ...(k ? { kings: k } : {}) });
}
/**
 * `?army=` or `?fen=`, with `&moves=`: a game sent by a friend (`gameLink`). It keeps this device's
 * settings, and replaces the autosave after a confirm, unless it continues the saved game.
 */
const linkMoves = params.get('moves');
const link = linkMoves != null && (params.has('army') || params.has('fen'));
/** A plain `?fen=` position (not a game link): it wins over the autosave, and the account's saved game does not replace it. */
const fen = link ? null : params.get('fen');

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

// The adopted Q6 residual net: stronger play at the same time budget, validated before adoption.
setEvaluator('residual');
const engine = new Engine();
/** `?look=painted|clay`, else the saved choice. Painted 2D is the default (owner, 2026-09-27). */
const look = params.get('look') ?? (() => { try { return localStorage.getItem(LOOK_KEY); } catch { return null; } })() ?? 'painted';
// Clay (three.js) is a separate chunk, fetched only for that look; painted needs none of it.
// The painted board stands on the page's parchment floor: the scene draws no floor of its own.
const view: BoardView = look === 'clay' ? await (await import('./render/clay')).createClayView($('board')) : new PaintedView($('board'), { floor: null, webInk: true });
view.onLoadError = () => { $('asset-status').textContent = 'A piece cannot load. Reload to try again.'; play.refresh(); };
(window as unknown as Record<string, unknown>).view = view; // tools/styleboard2.mjs aims its crops with view.screenOf()
/** The next game's setup: the last one started from New game (remembered across visits). */
let setup: Setup = defaultSetup();
/** Settings → Account and the cloud save, loaded after the board is drawn (null until then, or offline). */
let account: typeof import('./account/account') | null = null;

// The parts that the turn core calls. Their closures read `play` only after it exists.
const guide = connectGuide({ shownPos: () => play.shownPos(), preset });
const settings = connectSettings(view, { look, skill: () => play.skill(), setSkill: level => play.setSkill(level), save: () => play.save(), drawMarks: () => play.drawMarks() });
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
  params, preset, withPowers, look, fen, engine, guide, settings, home,
  keys: () => keys, account: () => account, setup: () => setup, openNewGame: () => openNewGame(),
});

initLessonShelf(play.startLesson, () => $('return-game').click());

/** The Workshop (docs/WORKSHOP.md): its own chunk, loaded on the first tap. It opens over its caller, which stays open. */
let workshop: Promise<ReturnType<typeof import('./workshop/dialog')['workshopDialog']>> | undefined;
function openWorkshop(code?: string): void {
  workshop ??= import('./workshop/dialog').then(m => m.workshopDialog());
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
  if (s.army === 'daily') { const d = today(); play.newGame(randomBackRank(mulberry32(+d.replace(/-/g, ''))), null, false, d); }
  else if (s.army === 'classic') play.newGame(CLASSIC_CHESS);
  else if (s.army === 'ogre') play.newGame(undefined, OGRE_PRACTICE, false, null, ['human', 'human']);
  else if (back) { try { play.newGame(back); } catch (e) { alert((e as Error).message); } }
  else if (s.army !== 'random') {
    play.newGame(s.army);
    const example = TRY_THESE.find(row => row.code === s.army);
    if (example) play.say(example.watch);
  } else play.newGame(randomBackRank());
}, preset);
const openGameSetup = (choices: Setup): void => dialog.open(choices, play.warning());

const openNewGame = (): void => openGameSetup(setup);
const openToday = (): void => openGameSetup({ ...setup, army: 'daily' });
$('new-game-btn').onclick = openNewGame;
initMenu({ playAgain: () => play.newGame(randomBackRank()), today: openToday, resignSide: play.resigner });
initTable(() => { void play.showPly(null, false); });
const keys = connectKeys($('board'), play, play.commands);

/** A plain `?fen=` wins over the autosave; restore player settings before loading the game. */
const saved = params.has('fen') && !link ? null : readSave();
if (saved) {
  play.seat(saved.white, saved.black);
  settings.applySettings(saved);
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
const showHome = !link && shouldShowHome(params, { hasSave: !!saved, titleSeen: titleSeen(), firstVisit: firstVisit(saved?.moves.length ?? 0) });
const showTitle = !showHome && !link && !params.has('fen') && !params.has('army') && !params.has('design') && params.get('title') !== '0' && !titleSeen();
const titleClosed = showTitle ? openTitle(firstVisit(saved?.moves.length ?? 0), !!saved?.moves.length, () => settings.pace()) : Promise.resolve('continue' as const);

// The playable game has one art direction; study controls stay in the study.
view.applyStyle(STYLES.clay);
if (params.get('labels') === '1') settings.showLabels(); // `?labels=1` turns the letters on over the saved choice
view.setLabels(settings.labels());
view.setCoords(settings.coords());
settings.applyPace();
const lans = linkMoves?.split('_').filter(Boolean) ?? [];
const continues = !!saved && (params.get('army') ? saved.back === params.get('army') : !saved.back && saved.fen === params.get('fen'))
  && saved.moves.every((m, i) => lans[i] === m);
const openLink = link && (!saved?.moves.length || continues || confirm('Open the game from this link? It replaces your current game.'));
if (link) history.replaceState(null, '', gameLinkless()); // a reload then resumes the autosave
play.restore(saved, { link: openLink, continues, urlRules: !!(preset || kings), title: showTitle });
await view.ready();
if ($('asset-status').textContent === 'Loading pieces…') $('asset-status').textContent = '';
guide.fill(); // after every setRules path (URL preset / save restore)
setSound(settings.sound());
play.moments.restore();
play.refresh();
if (showHome) home.open();
if (!fen) play.save(); // pin the random back rank so a reload keeps this game (and keep an opened link's game)
void import('./account/account').then(m => { account = m; m.changed(); m.startAccount(play.fromAccount); })
  .catch(() => { /* offline on a first visit: play on without an account */ });
const designLink = params.get('design');
if (designLink) {
  const url = new URL(location.href);
  url.searchParams.delete('design');
  history.replaceState(null, '', url); // a reload then shows the game
  openWorkshop(designLink);
}
const titleChoice = await titleClosed; // the computer waits for the player, and no dialog opens over the title
await play.previously.start();
if (titleChoice === 'start') startFirstDeal(SETUP_KEY, (s, army) => { setup = s; play.newGame(army); });
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
