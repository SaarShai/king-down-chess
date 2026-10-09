# 01 · The Quiet Table look on every screen

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 00

## Scope

- Owner choice: the base look is the Quiet Table only, with no dark stage, also in device dark mode. The deck's rule for this decision: "One look for every screen." So the game, the first-visit title and the Workshop surround all stand on the parchment floor.
- Demo: `dir-quiet-table` option A (light floor), `table.css` lines 5–21 (the light tokens). Leave out its dark-stage rules and its Light/Dark picker.
- Files: `index.html` (head), `public/manifest.webmanifest`, `src/style.css` (`:root`, `body`, `#board.painted`, `#title-screen` and its `::backdrop`), `src/workshop/workshop.css` (`#workshop::backdrop`), `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (a floor option), `src/render/PaintedView.ts` (pass the option), `src/main.ts` (create the view), `docs/visual-design/contrast.mjs`, `docs/specs/web-redesign/samples/01.mjs`.

## Plan

1. [x] Declare the page light only: `color-scheme: only light` on `:root`, and `<meta name="color-scheme" content="only light">`. Add no `prefers-color-scheme` rule.
   Done in 5570f57. `src/style.css` has no `prefers-color-scheme` rule. The browser gives the computed value as "light only".
2. [x] Set the browser bar colour to parchment `#f3ead7` in `index.html` and in the manifest `theme_color`.
   Done in 5570f57.
3. [x] Add the kit tokens that the app does not have (`--accent-bright`, `--gold-bright`, the mark colours, `--fs-body` 16 px, `--fs-3xl`, `--lh-tight`, `--track-display`, `--space-7`, `--radius-pill`, `--shadow-sheet`, `--dur-1..4`, the easing tokens) and the Quiet Table tokens (`--floor`, `--line`, `--wash`, `--fg`, `--fg-soft`). Replace the inline `#9c3a2d` and `#e9c071` with tokens. Keep every old token name; the Workshop and the dialogs use them.
   Done in 5570f57, with the kit values (`kit/tokens.css` and `table.css` lines 5–21 at dd93e39). Two more tokens: `--floor-base #f2e9d6` and `--floor-edge #e6d7b9`, the two stops of `--floor` (Comments). The three `#9c3a2d` gradients use `--accent-bright`; the `#e9c071` of the Workshop ring and the border of the title's primary button use `--gold-bright`. The other `#e9c071` uses were the title's gold text on the night stone; on the floor they are `--gold-ink` (item 5). Two `rgba(233, 192, 113, …)` forms of `#e9c071` stay: the 50 % ring of the title's primary button (ticket 16 changes the title buttons) and the 35 % wash of the Workshop capture square. A token there needs `color-mix()`, which needs newer browsers than the page needs now (`:has`, `dvh`). Every old token stays.
4. [x] Give `body` the floor gradient over the base colour `#f2e9d6`.
   Done in 5570f57: `background-color: var(--floor-base); background-image: var(--floor)`. The root (`html`) has `--floor-base` too.
5. [x] The first-visit title: replace its night stage (`#title-screen` background and `::backdrop`) with the floor. Its text uses the ink tokens. The six kings, the lineup and the wordmark keep their art; check their rims on the light floor. The buttons do not change here (ticket 16).
   Done in 5570f57. The wordmark is `--ink`, "Down" is `--gold-ink` (as in the chosen Home demo), the "Chess" line and the lineup names are `--ink-soft`. The art does not change; only its CSS shadows and filters do (Comments). The buttons keep their look; the focus ring is `--focus` (the night ring `#8cc0ff` goes).
6. [x] The Workshop surround: `#workshop::backdrop` uses the floor colours, not `--night`.
   Done in 5570f57. The Workshop fills the screen with flat `--parchment`, so this backdrop does not show; it changes nothing that a player sees (Comments: a question for the owner).
7. [x] Add a `floor` option to `createScene`: the default stays `#e6e1cf`; `null` only clears the canvas. `PaintedView` takes the option; only `main.ts` passes `null`. The plugin and the trial pages keep the default. Make `#board.painted` transparent.
   Done in d272317 (the option, `FLOOR`, the pure `paintFloor`, `scene.d.mts`, `PaintedView`; unit tests in `docs/2d-first-pieces/board/floor.test.mjs`) and 5570f57 (`main.ts` passes `null` in one call line; `#board.painted` is transparent). After the review, the default is the pure `floorOf` (FLOOR when no floor is named, the PaintedView path of the plugin page), so `npm test` sees a change to it.
8. [x] Add contrast pairs for ink-soft, gold-ink, danger and focus on `#f2e9d6` and `#e6d7b9`, for the title text on the floor, and for an off-state label (3:1 or more).
   Done in 34935b7. The four title-on-night rows go (no screen stands on the night stone now).
9. [x] The sample state table `samples/01.mjs`.
   Done in e6787a2: rest, selected, title and workshop, each also with the device in dark mode (`-dark`), at phone and desktop size. The sample tool takes a new optional `scheme` field for this (`samples/README.md`).

## Verification

- [x] Browser probe (in `visual-design`): under an emulated dark scheme, the computed `color-scheme` is `only light`; the body, the title and the Workshop backdrop have the same background as under the light scheme; a pixel outside the board frame shows the floor (the canvas is clear there).
  Section 9 of `docs/visual-design/verify.mjs` (b920058). It also reads the title's `::backdrop` and checks that each background is the parchment floor. It passed in the full run and in 3 more runs (4 of 4). After the review, the probe waits for the scene's first frame before it reads the canvas, and it hides every layer over the body (not only the canvas) for the pixel compare. Two mutants now fail at the right line: `main.ts` with no `{ floor: null }` ("the canvas is clear outside the board's frame") and an image on `#board.painted` ("outside the frame the screen shows the floor under the canvas"). The new probe passed in the full run and in 3 more runs. A unit test (`src/page-head.test.ts`) reads the `color-scheme` and `theme-color` tags and the manifest `theme_color`. The same reads on a build of the base (90cd0dc), with a scratch script: `color-scheme` "normal", the title and Workshop backdrops `rgb(34, 29, 24)` (the night), the board `rgb(230, 225, 207)`.
- [x] `npm run check:browser plugin-ui` and `plugin-ui-http`: the plugin board keeps its `#e6e1cf` floor (a pixel outside the board art). Record the plugin page size before and after (spec rule 5).
  `plugin-ui` passes 3 of 3, with the new floor line (d272317): the canvas pixel (1, 1), above the board's frame, is `230,225,207,255`. In the review, `plugin-ui-http` ran against the disposable loopback database of `docs/plugin-preparation.md` (`PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_plugin_test`, after `npm run plugin:db:init-test`, because the schema did not have migration 0004). It runs the same floor line, and it passes 4 of 4; `plugin-ui` passes 3 more of 3. The first build note was wrong: the database is on this Mac, only the variable was not set. The plugin page: 4,291,757 bytes before (90cd0dc), 4,291,834 bytes at 5c0a41d (+77), and 4,291,869 bytes after the review (+112, the `floorOf` helper), below the 4,350,000-byte line.
- [ ] The plugin session knows of the new board resource version (spec rule 5): `scene.mjs`, `scene.d.mts` and `PaintedView.ts` change, the default floor stays. Tell it before the pull request. The pull request stays a draft until this box and the owner's yes are ticked.
- [x] `contrast.mjs` passes the new pairs.
  `node docs/visual-design/contrast.mjs`: all 36 pairs pass. Lowest: gold-ink on `#e6d7b9` 4.62:1, danger on `#e6d7b9` 4.73:1; the off label (ink-soft at 75 %) 3.31:1 on `#e6d7b9`, 3.68:1 on `#f2e9d6`, 3.59:1 on a disabled button.
- [x] `king-effects`: the title kings still run on the new stage.
  Passed in the full run: six effects at 20 fps on the title, stopped while hidden, removed on close, none with reduced motion.
- [x] `npm test` and `npm run check:browser` pass.
  `npm test` (on the tree of e6787a2): vitest 78 files passed and 1 skipped, 1,438 tests passed and 13 skipped; `node --test` 45 of 45 (42 before, and the 3 new floor tests). `npm run check:browser` (at e6787a2): all 15 passed. After the review: `npm test` passes, vitest 79 files passed and 1 skipped, 1,440 tests passed and 13 skipped (the new `src/page-head.test.ts`), `node --test` 46 of 46 (the new `floorOf` test); `npm run check:browser`: all 15 passed.
- [ ] Rendered sample, 390×844 and 1440×900, with the device in light and in dark mode: the game screen at rest (today's layout on the new floor), a piece selected, the first-visit title, the Workshop. Before and after. Ask the owner about the title on the floor. The owner's yes, with the date, in Comments.
  Rendered: `SAMPLE=01` against a build of the base (90cd0dc) and of the branch, 16 renders each, no fault (Comments). Waiting for the owner's yes.

## Risks

- Forced-dark modes (Samsung Internet, Chrome auto-dark) can still invert a page. Test once on an Android device if one is at hand.
- An installed app keeps the old bar colour until its manifest refreshes.
- `scene.mjs` and `PaintedView.ts` also run in the plugin page: the default must not change. A change there makes a new plugin resource version on main.
- The frame's cast shadow and the contact shadows (multiply) must look right over a transparent canvas.
- The title kings were drawn for a dark stage: a rim or a glow can look wrong on parchment. The sample shows it.

## Does not do

- No layout change (ticket 03). No dark stage, no floor choice. No change to the title buttons (ticket 16). The Clay look keeps its own background.

## Comments

### 2026-10-09 · Build notes (branch `claude/wr-01-quiet-table`)

- **Base.** The branch starts from `claude/wr-00-check-helpers` (90cd0dc), because ticket 00 waits for its merge.
- **Two more tokens, and why.** `--floor-base #f2e9d6` and `--floor-edge #e6d7b9` are the middle and the edge of `--floor`. `--floor` uses them, the body and the backdrops use `--floor-base` as their colour, and `contrast.mjs` reads them (it reads hex tokens only). So each floor colour has one source.
- **The backdrops** (`#title-screen::backdrop`, `#workshop::backdrop`) use `var(--floor-base, #f2e9d6)` and `var(--floor, none)`. The fallbacks serve a browser whose `::backdrop` does not inherit the custom properties.
- **The title on the floor.** The art does not change. These CSS parts change, so that the title stands on parchment, not on night stone:
  - the stone board under the kings: `brightness(0.9) sepia(0.2)` (was 0.62 and 0.25, dimmed for the night);
  - the kings' and the lineup's drop shadows: warm ink `rgba(43, 38, 33, …)`, a little lighter (were black);
  - the back kings: brightness 0.94 and 0.86 (were 0.86 and 0.72; a dimmed king looks muddy on parchment). `title-kings.mjs` reads each filter as one brightness and one drop shadow, so the form stays;
  - the lineup ledge: a soft ink shadow and a `--line` hairline (were a dark stone strip and a gold edge); the lineup icons: a pale disc with the ring and the glyph in the name's colour (were a dark disc);
  - the wordmark: `--ink` with a pale lift and a soft gold glow; "Down" `--gold-ink`; the crown: a `--gold-ink` line.
- **For the owner, with the sample (the title on the floor).** With motion on, two kings' effects almost do not show on parchment: Spirit's halo and Frost's ground mist are pale light, and pale light does not show on a pale floor. Flame's fire, Mud's grass, Shadow's hands and Stratus's wind still show. Two more screenshots show the title with the effects on, before and after (`live-before-desktop.png`, `live-after-desktop.png`; see Renders). The effects are shared with the board, where they stand on stone, so this step does not change them. Question: is the title on the floor good as it is, or do Spirit and Frost need a stronger effect on the title only?
- **For the owner, with the sample (the Workshop).** The Workshop fills the screen and has its own flat parchment (`#f3ead7`), so its new floor backdrop does not show: the Workshop renders are the same before and after. The Workshop has no dark stage. Question: do you want the floor gradient on the Workshop page too? This step does not change `#workshop` without your yes.
- **Plugin page (spec rule 5).** `scene.mjs`, `scene.d.mts` and `PaintedView.ts` change; the default floor stays, and `plugin-ui` checks it. The page grows by 77 bytes (4,291,834). The plugin session must hear of this change before the pull request: it makes a new board resource version on main.
- **Light and dark renders.** The page is the same in both schemes. A pixel compare of the 8 light and dark pairs of the branch: 6 are equal, 1 (selected, desktop) differs by 3 levels of 255 at most, and 1 (title, phone) differs only at the King of the lineup (an image scaled at a different step; at most 55 levels in 453 pixels).
- **The frame's cast shadow and the contact shadows** draw over the clear canvas as they did over the old floor: the frame's shadow is a soft ink edge on the parchment (the desktop render), and the contact shadows stand on the board's own stone.
- **Renders** (out of Git): `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/f713c296-a557-4c06-99e1-90ecc1f52371/scratchpad/samples-before/` and `.../samples-after/` (16 renders each: 4 states, light and dark, phone and desktop), and in their parent folder two contact sheets (`sample01-phone-sheet.png`, `sample01-desktop-sheet.png`) and the title with the effects on (`live-before-desktop.png`, `live-after-desktop.png`, and the phone pair).
- **Not tested here** (Risks): a forced-dark browser (Samsung Internet, Chrome auto-dark) on an Android device; no device is at hand. `color-scheme: only light` is the opt-out that Chrome's auto-dark reads.

### 2026-10-09 · Review record (three reviews: fidelity, correctness, checks)

Accepted 10, rejected 0. The correctness review found no fault. Fidelity 1 and checks 1 are the same fault.

- **Fidelity 1, checks 1 (major): `plugin-ui-http` did not run, and no box tracks the message to the plugin session.** Accepted. The check runs against the local test database and passes 4 of 4 (Verification). A new Verification box tracks the message to the plugin session; it stays open until the pull request.
- **Fidelity 2: the rgba forms of `#e9c071` stay.** Accepted: the Plan 3 evidence said more than the code. The evidence now names the two rgba forms and says why they stay (ticket 16 owns the title buttons; a token there needs `color-mix()`, which needs newer browsers than the page needs now). No code change.
- **Fidelity 3: the Workshop backdrop does not show.** Accepted. The Workshop fills the screen with flat parchment. Plan 6, the visual-design README and a new owner question (Comments) say so. `#workshop` does not change without the owner's yes.
- **Fidelity 4: two doc words.** Accepted. The README now says that only `--on-night` has a use (the Workshop note, on `--stone-900`). The owner question says "almost do not show on parchment".
- **Checks 2: the canvas read could come before the first frame.** Accepted. The probe waits for `window.view.scene.frames > 0`. The mutant with no `{ floor: null }` now fails at "the canvas is clear outside the board's frame".
- **Checks 3: the floor compare hid only the canvas.** Accepted. The probe hides every layer over the body. The mutant with an image on `#board.painted` now fails at "outside the frame the screen shows the floor under the canvas". No assertion line changes, so no `Removed-check` trailer is necessary.
- **Checks 4: no unit test sees `createScene`'s default floor.** Accepted. The pure `floorOf` gives the default, and a `node --test` case checks it for undefined (the plugin page), null and a colour.
- **Checks 5: contrast rows go with no `Removed-check` trailer.** Accepted. `contrast.mjs` is not a registered check, so the hook does not count its rows. The branch history stays; the reasons are here. In 34935b7: `--on-night` on `--night` (the title buttons) changes to `--on-night` on `--stone-900`, the one place that uses `--on-night` now (the Workshop note). `--on-night-soft` on `--night` (the "Chess" line) goes: that line is `--ink-soft` on the floor now, with its own rows. `#e9c071` on `--night` ("Down") goes: "Down" is `--gold-ink` on the floor, with its own rows. `#8cc0ff` on `--night` (the title's focus ring) goes: the title uses `--focus`, with its own rows on the floor. The `#e6e1cf` row keeps its colours and minimum; only its description changes (that floor is now on the plugin page and the trial only).
- **Checks 6: no check reads the meta tags or the manifest.** Accepted. `src/page-head.test.ts` checks `color-scheme` "only light", `theme-color` `#f3ead7` and the manifest `theme_color` `#f3ead7`.
