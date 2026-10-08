# The showcase demo kit

The kit gives each showcase demo the real King Down board, the real rules, the real computer player, the app's colours and type, and a tool that renders and checks the demo.

All paths start at the root of the worktree. The showcase folder is `docs/specs/web-ux/showcase/` (below: `showcase/`).

## Rules for builders

1. Link the kit from your page (`../../kit/board.js`, `../../kit/ui.css` ...). Do not copy it into your folder and do not edit it: other demos use the same files, and a copy breaks the paths to `assets/`. If the kit has a bug or needs a feature, tell the lead.
2. Your demo lives only in `showcase/demos/<id>/`: `index.html`, `meta.json` and your own files. Write nothing in any other folder.
3. Use only the real art in `showcase/assets/`. Do not draw new figures.
4. Put `kit/frame.js` in `<head>`, before your styles and scripts.
5. Give `window.demo` its three functions (see "The demo contract").
6. Run the capture. Fix every FAIL before you hand in the demo.
7. Every control is 44 px or more on a phone. Use `data-small-ok` only for a control that has a 44 px target around it.
8. Every animation respects reduced motion (`ui.js` `prefersReducedMotion()`, the `--dur-*` tokens).
9. The keyboard can do every task.
10. Put no AI model name in any file.

## Setup (once)

```sh
node docs/specs/web-ux/showcase/kit/sync-assets.mjs   # copies the art and the fonts into showcase/assets/
node docs/specs/web-ux/showcase/kit/build-engine.mjs  # builds kit/kd-engine.js from src/
node docs/specs/web-ux/showcase/kit/test-engine.mjs   # optional: about 20 s of rules and computer-player checks
```

Git ignores `assets/`, `kit/kd-engine.js`, `renders/` and `dist/` (`showcase/.gitignore`). Run the two setup commands again after a change in `public/ui/` or `src/`.

Do not open a demo as a file. It needs a web server:

```sh
node docs/specs/web-ux/showcase/kit/capture.mjs --serve        # prints a URL such as http://127.0.0.1:52011/
```

Then open `/demos/<id>/index.html` on that URL.

## A new demo in one minute

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Move feed</title>
<script src="../../kit/frame.js"></script>
<link rel="stylesheet" href="../../kit/tokens.css">
<link rel="stylesheet" href="../../kit/ui.css">
<style>
  #board { max-width: 560px; margin: 0 auto; }   /* the board fills its host's width: give the host a size */
</style>
</head>
<body>
<div id="board"></div>
<script type="module">
import { createBoard, KD } from '../../kit/board.js';
const start = () => KD.newGame({ army: 'random', seed: 7 });
const board = createBoard(document.querySelector('#board'), { play: { level: 'beginner', human: 'w' } });
board.setState(start());
let run = 0;                                     // a new state, play or reset stops the old play
window.demo = {
  async state(name) {
    run++;
    board.play.human = 'both';                  // first: no computer move in a still render
    board.setState(start());
    if (name === 'selected') board.selectSquare('e2');
  },
  async play() {
    const me = ++run;
    board.play.human = 'both';
    board.setState(start());
    for (const lan of ['e2-e4', 'e7-e5']) {
      if (me !== run) return;
      await board.playMove(lan);                 // resolves when the animation ends
    }
  },
  async reset() { run++; board.play.human = 'w'; board.setState(start()); },
};
</script>
</body>
</html>
```

Put a `meta.json` beside it (see below) with at least `id`, `title`, `group`, `summary` and `"states": ["start", "selected"]`. Then run the capture.

`demos/kit/` is a full example: a game against the Beginner computer player, a move feed, Undo, Flip and a Moves sheet.

## The demo contract

Each demo sets `window.demo`:

| Function | What it does |
|---|---|
| `state(name)` | Shows one named state at once, for a still render. It can be async. It resolves when the state is on the screen. Each name in `meta.json` `states` must work. |
| `play()` | Plays the demo's short story (about 3 to 10 s) from its start. It resolves when the story ends. The frame's Replay button and the capture video use it. |
| `reset()` | Puts the demo back to its first view, ready for a person to use. |

The capture calls `state()` for each name in order, on one page, without a reload. So:

- Each `state()` builds its whole view itself. It must not depend on the state before it.
- In a scripted state, stop the computer player before you show the game: set `board.play.human = 'both'`, then call `board.setState(...)`. If the computer is to move, `setState` starts it at once.
- Close what an earlier state opened: a sheet (`closeSheet`), a panel, a toast (`hideToast`). `setState` closes the board's own move-choice sheet.
- `play()` can start again before it ends (Replay, or `reset()` then `play()`). Keep a run number and stop the old run after each `await`, as the example above does. `setState` stops the board's part of an old run, but your own loop goes on: without the check its next `playMove` throws "not a legal move".
- In `reset()`, give the game back to the person (`human: 'w'`).

## meta.json

```json
{
  "id": "move-feed",
  "title": "Move feed",
  "group": "feature",
  "feature": "Move list",
  "summary": "One sentence: what the person sees.",
  "problem": "What is wrong today.",
  "idea": "The idea in one or two sentences.",
  "borrows": [{ "from": "Hearthstone", "what": "The history rail: each play as a small card." }],
  "options": [
    { "key": "A", "name": "Folded", "state": "folded", "summary": "One line under the board." },
    { "key": "B", "name": "Rail", "state": "rail", "summary": "Icons in a rail beside the board." }
  ],
  "recommendation": "Which option, and why, in one or two sentences.",
  "joy": 4,
  "ease": 5,
  "effort": "S",
  "states": ["folded", "rail"],
  "notes": ["Any line for the owner or the lead."]
}
```

| Field | Value |
|---|---|
| `id` | The folder name. Required. |
| `title` | Two to four words. Required. |
| `group` | `direction` (a style for the whole app), `feature` (one feature) or `future` (a feature on the roadmap). Required. |
| `feature` | The feature's name, for `feature` and `future`. |
| `summary` | One sentence. Required. |
| `problem`, `idea`, `recommendation` | Short text. |
| `borrows` | What the idea takes from other games or apps, and why it fits King Down. |
| `options` | Two or three options. `state` names the state that shows the option. |
| `joy`, `ease` | 1 to 5. |
| `effort` | `S`, `M` or `L`. |
| `states` | The state names, in order. Lower case, a-z, 0-9 and `-`. Required. |
| `notes` | A list of short lines. |

The frame shows these fields in its Notes sheet. The presentation reads them too.

## Capture and checks

```sh
node docs/specs/web-ux/showcase/kit/capture.mjs <id>                      # renders and checks every state
node docs/specs/web-ux/showcase/kit/capture.mjs <id> --video              # also records play() on a phone
node docs/specs/web-ux/showcase/kit/capture.mjs <id> --states a,b --only phone
```

The tool serves `showcase/` on 127.0.0.1, opens `demos/<id>/index.html?bare=1` on a phone (390 x 844, touch) and on a desktop (1440 x 900), calls `await demo.state(name)` for each state, waits for the animations to end (3 s at most) and saves `renders/<id>/<state>-phone.png` and `<state>-desktop.png`. `--video` saves `renders/<id>/play-phone.webm`.

It fails (exit code 1) on:

- a `meta.json` fault (a required field is missing, a bad `group`, an option with an unknown state);
- a console error or a page error;
- a failed request or an HTTP status of 400 or more;
- sideways scroll;
- a control under 44 x 44 px on the phone (buttons, links, inputs, `[role=button]` and the like; a control inside a 44 px `<label>` passes; a link inside running text passes);
- an image that did not load;
- a `state()` that throws or takes more than 20 s.

It warns (`warn` lines, no fail) on text contrast under WCAG AA: 4.5:1, or 3:1 for large text. It checks text on solid colours only. It skips text over an image, a gradient or a see-through parent, and it can read wrong for text that you place over the board. Check that text yourself. Fix every contrast warning that is true.

It writes all results to `renders/<id>/checks.json`. Set `KD_BROWSER=chrome` to use the installed Chrome in place of the bundled Chromium. Each run works from any folder.

## The parts

### `kit/kd.js`: the rules engine and the computer player

`import KD from '../../kit/kd.js'` (or `import { KD } from '../../kit/board.js'`). This is the app's own code from `src/rules/` and `src/ai/`, built into `kit/kd-engine.js`. A state is immutable: `KD.play` gives a new state. Each state keeps its own rules (normal, Kings' powers or cards), so one page can hold different games.

```js
let s = KD.newGame({ army: 'random', seed: 3 });            // 'random', 'chess', or a back rank such as 'ONAQKBSM'
s = KD.newGame({ army: 'chess', powers: ['Frost:Freeze', 'Flame'] });   // Kings' powers; 'Flame' = its first power; null = no power
s = KD.newGame({ army: 'random', seed: 9, cards: [['Freeze', 'Haste'], ['Flight']] });   // card mode (lab): each side's hand
s = KD.fromFen('7k/8/8/4p3/3A4/8/8/K7 w - - 0 1');          // a scripted position
KD.legal(s, 'e2');            // moves from e2: { from, to, lan, kind, captures, path, push, swap, promo, power, powerName, needsArming, ... }
s = KD.play(s, 'e2-e4');      // a move: a KD.legal move, a LAN string, or { from, to, promo }
KD.undo(s);                   // the state before the last move
KD.status(s);                 // { over, result, winner, reason, check, turn, ply, moveNumber, text }
KD.describe(s, 'Ae3*c5');     // the move as a story (below)
KD.board(s);                  // 64 cells (a1 first): null or { type, color, sq, design? }
KD.threats(s);                // { pieces, squares } the side to move must watch
await KD.think(s, { level: 'beginner', ms: 500 });   // the computer's move, in a Web Worker
KD.ai(s, { level: 'club' });  // the same, on the page (it blocks the page while it thinks)
KD.serialize(s); KD.deserialize(o);   // to save a game or put it in a URL
KD.kings();                   // the six kings, each with two powers: { king, design, powers: [{ power, name, text }] }
KD.powerText('Freeze'); KD.usesLeft(s, 'w'); KD.hand(s, 'w');
KD.lessons;                   // the six lessons: { index, name, fen, task, done }; KD.lessonGoal(i, s, move)
KD.PIECES; KD.sq.index('e4'); KD.sq.name(28);
```

Move kinds: `move`, `capture`, `shoot` (the Archer, without moving), `chain` (the Beast), `push` (the Ogre), `swap` (the Maester), `power`, `promote`, `drop`, `pass`. Levels: `beginner`, `casual`, `club`, `strong`.

**Moves as text (LAN).** `KD.play`, `KD.describe` and `board.playMove` take the `lan` that `KD.legal` gives. Copy it from `KD.legal(s).map(m => m.lan)`; do not guess it. The forms:

| Move | LAN |
|---|---|
| A step, a pawn push | `e2-e4`, `Nb1-c3`, `Ad2-e3` (the piece letter, no letter for a pawn) |
| A capture | `e4xd5`, `Qd8xh4` |
| The Archer's shot (it does not move) | `Ae3*c5` |
| The Beast's chain | `Sd4xd5xd6` |
| The Ogre's push | `Od3>d4-d5` (the Ogre on d3 pushes the piece on d4 to d5) |
| The Maester's swap | `Md4<>e4` |
| Promotion (queen, rook, bishop or knight) | `a7-a8=Q`, `a7xb8=N` |
| Freeze, Ice Wall | `!F:e5`, `!W:e5` |
| Flight, Sacrifice | `Ra1~e2`, `!S:a2=N` |
| Strike, Haste | the piece's move with a mark: `Qd1-e2!`, `Nb1-c3!H` |
| Leap (Mud king) | `Ra1-a4!L` (kind `move`: always offered, no arming) |
| End a Haste turn | `--` |

Letters: `P N B R Q K`, `A` archer, `L` paladin, `G` guard, `M` maester, `S` beast, `O` ogre. A FEN uses the same letters (upper case = White).

**`KD.describe(s, move)`** gives `{ side, piece, from, to, lan, kind, captured, capturedOn, push, swap, promo, power, powerTag, leaves, again, check, checkSq, mate, over, result, text, moment, after, next }`. `text` is the app's sentence ("White archer on e3 takes the bishop on c5 without moving."). `moment` is a short teaching line for a special move, else null. `leaves` is true when the Paladin leaves the board after its capture. `again` is true when the same side moves next. `after` is `KD.board` after the move; `next` is the new state.

**Rules to know** (`docs/RULES.md`):

- There is no castling and no en passant. A pawn promotes to a queen, rook, bishop or knight. `{ from, to }` without `promo` plays the queen.
- Freeze and Ice Wall are free actions: after them the same side makes its move (`story.again` is true, and `KD.status` still names that side). Haste also keeps the turn for the second move.
- Powers with `needsArming: true` (Freeze, Ice Wall, Strike, Haste, Flight, Sacrifice, and the Haste pass) do not show on a plain tap. In the app the player arms the power first: see `board.arm(tag)`.
- `KD.legal` gives `[]` when the game is over. A scripted position with too little material (for example a king and a paladin against a king and a knight) is a draw at once: check `KD.status(s).over` after `KD.fromFen`.
- `KD.status(s).reason`: `checkmate` (also when a king is taken), `stalemate`, `draw50`, `drawRepetition`, `drawMaterial`.
- `KD.play` throws on a move that is not legal. The message names the move.

The engine is the truth. Do not write rules in a demo. Read `docs/RULES.md` when a demo shows a rule.

### `kit/board.js`: the board

```js
import { createBoard, KD, figureArt, moveLabel } from '../../kit/board.js';
const board = createBoard(host, {
  play: { level: 'beginner', human: 'w', ms: 500, pause: 350 },   // omit play: a board for scripts only
  state: KD.newGame(),       // optional
  orientation: 'w',          // who sits at the bottom
  coords: true, headroom: 0.2, interactive: true, sound: true, speed: 1,
  label: 'King Down board',
  choose: async moves => moves[0],         // optional: replaces the board's own choice sheet
  onTap(sq, cell) {},        // return false to stop the board's own tap action
  onInspect(sq, cell) {},    // long press, mouse hover (650 ms) or the I key on a piece
  onMove(story) {},          // after each move (a KD.describe story)
  onSelect(sq) {},           // a piece is selected (null: no piece)
});
```

Size: the board fills the host's width. If the host has a height (a grid or flex area, or a CSS height), the board fits inside it. If not, the host takes the board's height. So give the host a width (`max-width: 560px`, a grid column): on a 1440 px desktop a host with no limit gives a 1440 px board.

`play.human`: `'w'` or `'b'` (the person plays that side, the computer the other), `'both'` (no computer: a script or two players), `'none'` (the computer plays both sides). After a change, call `board.maybeAi()` to start the computer if it is its turn, or call `setState`.

The board plays like the app: tap or drag a piece, then a marked square. A Beast chain takes one tap for each victim. When one tap has two moves (Capture or Push for an Ogre, a promotion, a Sacrifice), the board asks in a sheet. Keyboard: the arrow keys move the cursor, Enter or Space chooses, Escape cancels, I inspects. A live region reads each move.

The board swallows the browser's click after a tap or a long press on it, so that the click cannot land in a sheet the tap opens. Use `onTap`, not a click listener on the board.

| Method | What it does |
|---|---|
| `setState(s)` | Shows a game. Marks the last move and a check. Starts the computer if it is its turn. Stops a running animation, a computer that thinks and the board's choice sheet. |
| `playMove(move)` | Plays a move (a `KD.legal` move or its `lan`) with its animation. Resolves with the story when the animation ends. In play mode the computer then answers: wait for it with `onMove`. |
| `animate(story)` | Plays a `KD.describe` story on the board, without a game. |
| `setBoard(cells)` | Shows 64 cells with no game (a picture). It ends the game on the board (`state` becomes null). |
| `maybeAi()` | Starts the computer if it is its turn (after a change to `board.play`). Resolves when its move has landed. |
| `closeChoice()` | Closes the board's own move-choice sheet. |
| `selectSquare(sq)` | Selects a piece and marks its moves, as a tap does. |
| `select(sq)`, `showTargets(moves)`, `clearSelection()` | The parts of `selectSquare`. |
| `mark(squares, kind, { pop, from, power, colour })` | Kinds: `last`, `check`, `selected`, `move`, `capture`, `shot`, `swap`, `shove`, `power`, `hint`, `threat`, `cover`, `glow` (`colour: '214,52,40'`). `pop` makes the marks appear in a ripple from the square `from`; `power` makes `move` and `capture` blue. `focus` (the keyboard cursor) and `hover` belong to the board: it shows `focus` only while the board has keyboard focus. To point at a square, use `hint` or `glow`. |
| `clearMarks(kind?)` | Removes marks: all, or one kind. The keyboard cursor stays. |
| `arm(tag)`, `pass()` | Arms a king's power for the side to move: `freeze`, `ward` (Ice Wall), `strike`, `haste`, `flight`, `sacrifice`. Freeze, Ice Wall and Sacrifice then mark their targets: a tap plays. Strike, Haste and Flight: tap a piece, then a marked square. `arm(null)` disarms. `pass()` ends a Haste turn without its second move. |
| `undo(plies)` | Takes back moves. |
| `flip(on?)` | Turns the board. |
| `slide(el, from, to)`, `dip(el)`, `shoot(from, to)`, `burst(sq, rgb)` | The animation pieces, for your own scripts. |
| `figure(sq)`, `squareRect(sq)`, `layer` | The figure element, a square's box on the screen, the layer for your own overlays (one square is 12.5 % of it). Figures and marks use z-index 2 to 35, the board's effects 300 to 500: give an overlay z-index 100 to put it over the figures. |
| `play`, `state`, `busy`, `isHuman(turn)` | `board.play.human` and `board.play.level` can change at any time. |
| `destroy()` | Removes the board. |

`figureArt(cell)` gives a figure's image URL and its box. `moveLabel(move)` gives a short name such as "Push to d6".

### `kit/tokens.css` and `kit/ui.css`: look and parts

Link `tokens.css` first, then `ui.css`. Change a token in your own CSS (`:root { --accent: ... }`), never in the kit.

- Tokens: colours (`--parchment`, `--vellum`, `--ink`, `--ink-soft`, `--stone-*`, `--accent`, `--gold*`, `--night`, `--focus`), type (`--font-display` Cinzel, `--font-body` Alegreya Sans, `--fs-xs` to `--fs-3xl`), space (`--space-1` to `--space-7`), `--radius*`, `--tap` (44 px), shadows, motion (`--dur-1` 120 ms to `--dur-4` 480 ms, `--ease-out`, `--ease-in-out`, `--ease-in`, `--ease-spring`). With reduced motion every `--dur-*` is 0 ms.
- Parts: `.btn` (`.btn-primary`, `.btn-quiet`, `.btn-icon`, `.btn-wide`), `.chip` (`aria-pressed`), `.toggle` (a checkbox in a `label.row`), `.row`, `.card`, `.pill` (`.pill-gold`, `.pill-crimson`), `.dot-new` (a quiet tease: two pulses, then still), `.toast`, `dialog.sheet` (`.sheet-grip`, `.sheet-head`, `.sheet-body`: a bottom sheet on a phone, a side panel from 760 px), `.night` (the dark stone surface), `.icon`, `.pi`.
- Helpers: `.stack`, `.cluster`, `.display`, `.muted`, `.sr-only`.
- Text colours that pass WCAG AA on parchment and vellum: `--ink`, `--ink-soft`, `--accent`, `--gold-ink`. On `.night`: `--on-night`, `--on-night-soft`. `--stone-500`, `--gold` and `--gold-bright` are for borders and ornament, not for text on parchment.

### `kit/ui.js`: behaviour

```js
import { openSheet, closeSheet, toast, hideToast, prefersReducedMotion, onMotionChange, animate, haptic, sfx, $, $$, wait } from '../../kit/ui.js';
openSheet('settings');        // a <dialog class="sheet" id="settings">; Escape, [data-close] and the dim area close it
await closeSheet('settings'); // closes it and gives the focus back to the control that opened it
toast('Saved'); hideToast();  // a short message (2.6 s), read by screen readers
animate(el, keyframes, opts); // element.animate that jumps to the end with reduced motion
sfx.move(); sfx.toggle();     // tap, move, capture, check, power, win; silent until the first tap
haptic(12);                   // a short vibration where the device has one
await wait(400, { instant: true });   // a pause that is 0 ms with reduced motion
```

### `kit/icons.js`: icons and art

```js
import { icon, iconEl, ICON_NAMES, pieceIcon, pieceArt, emblemArt, workshopArt } from '../../kit/icons.js';
button.innerHTML = icon('undo') + '<span>Undo</span>';      // a 22 px line icon in currentColor; icon('undo', { label: 'Undo' }) when it is the only name
feed.innerHTML = pieceIcon('archer', 'w') + ' White archer';  // the rulebook piece icon
img.src = pieceArt('ogre', 'b'); img.src = pieceArt('king', 'w', 'frost'); img.src = emblemArt('flame');
```

Icons: `ICON_NAMES` lists them all (menu, hint, undo, moves, close, chevron, chevron-down, flip, back, play, pause, share, sound-on, sound-off, settings, crown, sparkle, lock, eye, swords, flag, book, cards, users, globe, check, info, plus, clock, trophy, bolt, shield, target, help).

Art in `assets/`: `pieces/<type>-<w|b>.webp` (no king), `kings/<design>[-b].webp` (frost, flame, stratus, mud, spirit, shadow; White's king with no power is spirit, Black's is shadow), `emblems/<design>.webp`, `icons/<type>.svg`, `workshop/<name>-<w|b>.webp`, `stone-board.webp`, `stone-board-hd.webp`, `fonts/`.

Workshop figures: antler-guardian, banner-keeper, battering-ram, bell-sage, blade-dancer, clay-golem, crossbow-warden, dart-sentinel, drill-crawler, drum-marshal, eagle-keeper, field-mender, fire-spirit, forge-bearer, fox-pathfinder, hare-scout, hornet-swarm, hourglass-keeper, iron-warden, javelin-runner, lantern-witch, mechanical-spiders, mirror-seer, owl-archivist, ram-bastion, reed-hunter, rooftop-vaulter, shell-bastion, stone-slinger, storm-spirit, tide-caller, water-deity, wind-courier, wooden-catapult.

### `kit/frame.js` and `kit/frame.css`: the viewer

Without `?bare=1` the demo page becomes a viewer: a thin bar (all demos, the title, Phone or Desktop, Replay, Reduced motion, Notes) and the demo in a frame. In a frame (the presentation's "Try it live") or with `?bare=1`, the script only applies `?motion=reduce`. The demo never makes room for the bar. On a narrow screen the viewer shows the demo full size. URL options: `?view=phone`, `?motion=reduce`.

### Files that build the kit

| File | Job |
|---|---|
| `kit/sync-assets.mjs` | Copies the art and the fonts into `assets/` and writes `showcase/.gitignore`. |
| `kit/engine-entry.ts` | The KD API around `src/`. |
| `kit/build-engine.mjs` | Builds `kit/kd-engine.js` (it sets `globalThis.KD`). |
| `kit/test-engine.mjs` | Plays games with the computer and at random, and checks shots, chains, mate, undo, FEN and save. |
| `kit/capture.mjs` | Renders, checks and records a demo; `--serve` serves the showcase. |

## Limits

- The engine file is about 300 KB. The first page load parses it once; the worker loads it again.
- `KD.think` falls back to the page when a worker cannot start. Then the page waits while the computer thinks.
- A drag works with a mouse, a pen and one finger. There is no pinch zoom.
- The board does not draw the effects that the app adds around a king (for example the Frost king's snowflakes). It shows the king art only.
- Sounds are short tones made in code, not the app's own sounds.
- Card mode is a lab mode. A card that puts a piece on the board (a drop: Salvation, Spawn) has no square to tap: play it with `board.playMove`.
- The capture checks text contrast only on solid colours (see "Capture and checks").
