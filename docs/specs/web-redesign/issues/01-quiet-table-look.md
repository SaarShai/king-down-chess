# 01 · The Quiet Table look on every screen

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 00

## Scope

- Owner choice: the base look is the Quiet Table only, with no dark stage, also in device dark mode. The deck's rule for this decision: "One look for every screen." So the game, the first-visit title and the Workshop surround all stand on the parchment floor.
- Demo: `dir-quiet-table` option A (light floor), `table.css` lines 5–21 (the light tokens). Leave out its dark-stage rules and its Light/Dark picker.
- Files: `index.html` (head), `public/manifest.webmanifest`, `src/style.css` (`:root`, `body`, `#board.painted`, `#title-screen` and its `::backdrop`), `src/workshop/workshop.css` (`#workshop::backdrop`), `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (a floor option), `src/render/PaintedView.ts` (pass the option), `src/main.ts` (create the view), `docs/visual-design/contrast.mjs`, `docs/specs/web-redesign/samples/01.mjs`.

## Plan

1. [ ] Declare the page light only: `color-scheme: only light` on `:root`, and `<meta name="color-scheme" content="only light">`. Add no `prefers-color-scheme` rule.
2. [ ] Set the browser bar colour to parchment `#f3ead7` in `index.html` and in the manifest `theme_color`.
3. [ ] Add the kit tokens that the app does not have (`--accent-bright`, `--gold-bright`, the mark colours, `--fs-body` 16 px, `--fs-3xl`, `--lh-tight`, `--track-display`, `--space-7`, `--radius-pill`, `--shadow-sheet`, `--dur-1..4`, the easing tokens) and the Quiet Table tokens (`--floor`, `--line`, `--wash`, `--fg`, `--fg-soft`). Replace the inline `#9c3a2d` and `#e9c071` with tokens. Keep every old token name; the Workshop and the dialogs use them.
4. [ ] Give `body` the floor gradient over the base colour `#f2e9d6`.
5. [ ] The first-visit title: replace its night stage (`#title-screen` background and `::backdrop`) with the floor. Its text uses the ink tokens. The six kings, the lineup and the wordmark keep their art; check their rims on the light floor. The buttons do not change here (ticket 16).
6. [ ] The Workshop surround: `#workshop::backdrop` uses the floor colours, not `--night`.
7. [ ] Add a `floor` option to `createScene`: the default stays `#e6e1cf`; `null` only clears the canvas. `PaintedView` takes the option; only `main.ts` passes `null`. The plugin and the trial pages keep the default. Make `#board.painted` transparent.
8. [ ] Add contrast pairs for ink-soft, gold-ink, danger and focus on `#f2e9d6` and `#e6d7b9`, for the title text on the floor, and for an off-state label (3:1 or more).
9. [ ] The sample state table `samples/01.mjs`.

## Verification

- [ ] Browser probe (in `visual-design`): under an emulated dark scheme, the computed `color-scheme` is `only light`; the body, the title and the Workshop backdrop have the same background as under the light scheme; a pixel outside the board frame shows the floor (the canvas is clear there).
- [ ] `npm run check:browser plugin-ui` and `plugin-ui-http`: the plugin board keeps its `#e6e1cf` floor (a pixel outside the board art). Record the plugin page size before and after (spec rule 5).
- [ ] `contrast.mjs` passes the new pairs.
- [ ] `king-effects`: the title kings still run on the new stage.
- [ ] `npm test` and `npm run check:browser` pass.
- [ ] Rendered sample, 390×844 and 1440×900, with the device in light and in dark mode: the game screen at rest (today's layout on the new floor), a piece selected, the first-visit title, the Workshop. Before and after. Ask the owner about the title on the floor. The owner's yes, with the date, in Comments.

## Risks

- Forced-dark modes (Samsung Internet, Chrome auto-dark) can still invert a page. Test once on an Android device if one is at hand.
- An installed app keeps the old bar colour until its manifest refreshes.
- `scene.mjs` and `PaintedView.ts` also run in the plugin page: the default must not change. A change there makes a new plugin resource version on main.
- The frame's cast shadow and the contact shadows (multiply) must look right over a transparent canvas.
- The title kings were drawn for a dark stage: a rim or a glow can look wrong on parchment. The sample shows it.

## Does not do

- No layout change (ticket 03). No dark stage, no floor choice. No change to the title buttons (ticket 16). The Clay look keeps its own background.

## Comments
