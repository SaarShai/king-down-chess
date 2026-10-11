# D. The "rules framework visualization" session: what it changed, and what the plugin MVP must adopt

Source: Claude session `4f9c309c-1bab-444c-b463-5cd4ad0f54f0` (continued from `08f2956c-…`; title "Codex rules framework visualization review"), read on 2026-10-11 at about 15:27 UTC. Git state read from `origin/main` at `13861709`.

**Warning: the local `main` checkout is behind.** Local `main` is at `e73f8061`. `origin/main` is at `13861709` and also has PR #48 (`ce2fe345`) and PR #49 (`13861709`). Build agents must start from `origin/main`, or fetch first.

## 0. Summary in 12 lines

1. The session reviewed the Codex "rules framework". Its verdict: the framework is a balance ledger, not a rule engine. The Workshop rule (When + Does) becomes the one rule unit (`docs/research/rules-ui-2026-10-10/REVIEW.md`).
2. The owner chose mockup **A, "Proving Ground"**, as the new Workshop. A piece keeps **at most 3 rules** (`MAX_RULES = 3`, `src/workshop/model.ts:43`).
3. The owner chose **one move legend** for the whole game: green tile = move, white tile + red target = take only, green tile + red target = move or take, red target + arrow = shot (`src/render/legend.ts`).
4. Merged: PR #41 (legend in the game board, also the plugin board), #42 (Proving Ground Workshop, tickets 01–15 and 18), #47 (amber Show-threats marks), #48 (**engine change**: a designed piece plays in real games, `RULES.design`), #49 (open ends of tickets 09 and 17).
5. Only #48 and #49 change the engine, AI or setup. All new paths are behind `RULES.design !== null`. With no design, perft and all old tests are unchanged.
6. #41 and #48 already changed modules that the plugin page imports (`PaintedView.ts`, `marks.ts`, `legend.ts`, `engine.ts`, `rules.ts`, `setup.ts`, `move-text.ts`, `scene.mjs`). The plugin page size grew to about 4,312,074 bytes (limit 4,400,000; stop-and-ask line 4,350,000).
7. In flight: branch `claude/game-marks` (tickets move-legend 03 and 04). It puts the Workshop's gold coordinates, gold selection glow and slide rails on the game board **and the plugin board**, and replaces the amber threat marks with the Workshop's red threat arrows. Review done; fix agent running.
8. In flight: branch `claude/park-clay`. It moves the clay (three.js) look out of the build into `parked/clay/`. Build agent still running since 13:46 UTC.
9. Owner decision 2026-10-11: **clay is parked**. The plugin must use the painted board only. No clay work.
10. Owner approved the plan for one deploy of kingdown.dev after the clay parking merges. That deploy has not run yet.
11. The "seals" are a Workshop UI word: one wax seal = one rule (one `Ability` block). They are not game-setup toggles.
12. Nothing in this session builds New-game toggles for fairy pieces, arrangement, cards or king powers. The plugin MVP must build those itself.

---

## 1. Timeline of owner requests (newest last)

| When (UTC, 2026-10-10/11) | Owner words | Result |
|---|---|---|
| 10-10 | Review the Codex session and its rules framework and visualization; make 2 mockups | `docs/research/rules-ui-2026-10-10/` (REVIEW.md, mockups A and B, grammar.html) |
| 10-10 | "1. can you show me clearly the difference between A and B? 2. yes, go with my legend, but change the red X to a red target symbol 3. ok 4. rescue - yes, the one with the hands. salvation is the other one." | `compare.html`, red target marks, card art for Rescue and Salvation |
| 10-10 | "yes. and the final choice is A, so implement that." | Specs `docs/specs/move-legend/`, `docs/specs/workshop-proving-ground/` (tickets 01–18) |
| 10-11 04:46–05:00 | Subagents only on the Claude API key, "just for the rest of this session" | `tools/claude-agent.sh` (PR #43, fix PR #44). Not a project rule. |
| 10-11 11:42 | "1. approved. 2. fix 3. resolve all." | Renders of tickets 09–18 approved; landscape fix; D5 threat marks; tickets 16, 17 built |
| 10-11 13:20 | "amber threat marks approved" | PR #47 merged |
| 10-11 13:45 | "clay graphics should be extracted and parked, not included in the build of the game. so nothing that relates to it is currently relevant." | Branch `claude/park-clay` (running) |
| 10-11 13:47 | "1. yes [ticket 17 renders] 2. yes [deploy after clay parking merges] 3. not now [no balance run with designs]" | PR #48 merged; deploy waits |
| 10-11 13:57 | "while clay is parking, do you want to resolve what is left open that can be resolved now?" | PR #49 merged |
| 10-11 14:20 | "do 2-4 (for 4, use the workshop threats). exclude the board change." | Branch `claude/game-marks` (running). This **replaces** the amber-marks approval. |
| 10-11 14:23 | "no need" (for before/after images of game-marks) | The owner wants no images of game-marks; results and merge only |

---

## 2. Change list

Legend for the "Layer" column:
- **Engine** = move generation, captures, powers, cards, setup, FEN, AI values. The plugin server and plugin board get it from the shared modules.
- **Board UI** = shared board drawing (`src/render/PaintedView.ts`, `marks.ts`, `legend.ts`, `docs/2d-first-pieces/board/scene.mjs`). The plugin page imports these, so the plugin board changes too.
- **Web UI** = web app only (`src/screen/*`, `src/style.css`, `index.html`, `src/new-game.ts`). The plugin page does not import these.
- **Workshop** = `src/workshop/*` Workshop dialog. Not in the plugin page, except `model.ts`, `vocab.ts`, `figures.ts` (now pulled in by `rules.ts`).

### 2.1 Merged on `origin/main`

| # | Change | What the player sees | Main files | Layer | Status |
|---|---|---|---|---|---|
| C1 | Rules-UI review and mockups | Nothing in the game. Research and decisions. | `docs/research/rules-ui-2026-10-10/REVIEW.md`, `compare.html`, `mockups/proving-ground.html`, `mockups/binder-and-table.html`, `mockups/grammar.html`, `mockups/shared/marks.js`, `scenes.js`, `grammar.css`, `mockups/assets/` (kings, pieces, cards, emblems, fonts) | docs | merged (`423082fb`) |
| C2 | **Move legend in the game** (move-legend 01) | New move marks on the game board: green tile = move; white tile with red target = take only; green tile with red target = move or take; red target with arrow = shot. A take on an enemy figure: thin red edge, ring and glow under the feet, and a small white badge with the target at the square's top-left. King-power marks: two blue frames. | `src/render/legend.ts` (new, 192 lines), `legend.test.ts`, `src/render/marks.ts` (rewritten to use the legend), `PaintedView.ts` (passes `px` and the board), `renderer.ts` (clay tint), `src/style.css` (`--leg-*` tokens) | **Board UI** (plugin board too) | merged, PR #41 (`b5078331`) |
| C3 | **Proving Ground Workshop** (tickets 01–15, 18) | The Workshop is now one stone board. The piece stands on d4. Brushes Move / Take / Both, Shot tool, Eraser, Mirror, 8 line nubs. Rules are wax seals on a plinth (max 3). Why tag on a square tap. Try with (place friends/enemies, threats eye, Move here, Take back). Ledge of 11 pool pieces + "Yours" + NEW. Tabs: Pieces, Rules (12), Kings and powers (13), LAB cards (14), See all binder grid (15). Share card face (08). Short landscape (09). Motion (10). The old Workshop is deleted (11). | New: `src/workshop/ground.ts` (1,722 lines), `ground.css`, `marks.ts`, `scene.ts`, `why.ts`, `face.ts`, `powers.ts`, `compat.test.ts`. Deleted: `dialog.ts`, `card.ts` (old parts), `sandbox.ts`, `motion.ts`, `look.ts`, `art.ts` gauge, `workshop.css`, `tools/workshop-motion.mts`. | **Workshop** only | merged, PR #42 (`87ae195e`, through #41) |
| C4 | Amber Show-threats marks (move-legend 02, D5) | Settings → Show threats: amber diamond on each covered empty square; amber triangle with "!" on each threatened own piece; both at the bottom-right corner. | `src/style.css` `.mk-cover::after`, `.mk-threat::after`; `docs/visual-design/verify.mjs` | **Web UI** (DOM overlay in `src/screen/play.ts` `drawMarks()`; not in the plugin page) | merged, PR #47 (`d10b1a21`). **Superseded by C9** when game-marks merges. |
| C5 | Short-landscape shelf fix | All seals show without a scroll at 844×390 and 667×375. | `src/workshop/ground.css`, `ground.ts`, `tools/verify-workshop.mjs` | Workshop | merged (`5e68213a`, `e7bdf9bf`) |
| C6 | **Engine: the designed piece** (ticket 16) | Nothing by itself. Makes C7 possible. | `src/rules/design.ts` (new: `DesignSpec`, `genDesigned`, `holds`, `shelterOf`), `src/rules/engine.ts` (`case T`, `canCapture`, `sheltered` level 4, `isAttacked` + `designHits`, `landed` SPENT, `nameOf`, `theName`, `aName`, exported `CAPITAL`, `guardMayLand`), `src/rules/rules.ts` (`Rules.design`, `HISTORY_WHENS`, `playedDesign()`, `parseRule('design=…')`, `setRules` refusals), `src/rules/setup.ts` (FEN letter `U` = spent design), `src/ai/eval.ts`, `src/ai/worker.ts` (`setPieceValues({T})`), `src/workshop/moves.ts` (thin call of `genDesigned`), `src/balance/schema.ts` | **Engine** | merged, PR #48 (`ce2fe345`) |
| C7 | **Play a design** (ticket 17) | New game has "Bring a design" (select under the computer level). Each side gets the same design in place of the back-rank piece nearest its worth (not the king; left one on a tie). The design shows its Workshop figure on the painted board. Move text, read panel and table use the design's name. A game link carries `?design=<code>`. A design with a When that counts moves or cards (`fromMove`, `beforeMove`, `afterCard`) is listed but disabled, with the reason. | `src/new-game.ts` (`Setup.design`, `refusal`, `withDesign`, `parseSetup`), `index.html` (`#design`, `#design-line`), `src/screen/play.ts`, `src/screen/links.ts` (`gameUrl(…, design)`), `src/main.ts`, `src/read.ts`, `src/move-text.ts`, `src/previously.ts`, `src/ui/table.ts`, `src/render/PaintedView.ts` + `docs/2d-first-pieces/board/scene.mjs` (`setFigure(type, urls)`), `src/render/sprites.ts`, `ClayFigure.ts` | **Engine** + **Board UI** + **Web UI** | merged, PR #48 |
| C8 | Open ends (PR #49) | Rules shelf fits 568×320. One place sets a design's value (`src/ai/eval.ts`). The simulation values a design (`src/sim/game.ts`). An unreadable design link shows a message and keeps the saved game. | `src/ai/eval.ts`, `src/ai/worker.ts`, `src/game.ts`, `src/main.ts`, `src/screen/play.ts`, `src/sim/game.ts`, `src/workshop/ground.css` | Engine (AI value only) + Web UI | merged, PR #49 (`13861709`) |
| C9-tools | API-key launcher | Nothing for the player. | `tools/claude-agent.sh` (PR #43, #44) | tooling | merged. The "API key only" rule was for that session only. |

### 2.2 In flight (branches)

| # | Change | What the player sees | Main files | Layer | Status at 15:27 UTC |
|---|---|---|---|---|---|
| C9 | **Game board takes the Workshop's coordinates, glow and rails** (move-legend 03) | Coordinates: gold `#c99a3e` capitals A–H and numbers in Cinzel (weight 600), in the frame. Selected piece: warm gold glow under the feet (the square outline, gold ring and pulse go). Slides: green rails join the move tiles of a line, with an arrowhead at the board edge, a stop bar before a blocking piece, and the rail into the centre of a take. Dark squares, frame and board size do **not** change ("exclude the board change"). | `src/render/legend.ts` (`rail`, `arrowHead`, stop bar, `railLine`, `arrowLine`, `glow`, gradient `glow-gold`), `src/render/marks.ts`, `src/render/renderer.ts` (`Highlights.rails` type), `src/marks-model.ts` (`railsOf(board, from, moves, captures)`), `src/screen/play.ts`, `docs/2d-first-pieces/board/scene.mjs` (no square outline when the host draws marks; gold coordinates on the framed board), `src/workshop/marks.ts` (now draws from `legend.ts`) | **Board UI** (plugin board too; coordinates change only where the board is framed, `setLively`) | branch `claude/game-marks` (`b13e0966`), worktree `.claude/worktrees/game-marks`. Built, reviewed (no must-fix), fix agent `fix-gm` started 15:27. Not pushed/merged yet. |
| C10 | **Show threats uses the Workshop's threat marks** (move-legend 04) | Settings → Show threats: a faint red arrow from each attacker to the own piece it can take, arrowhead on the target, red glow under the attacked piece. The amber diamond and triangle go. Covered empty squares get no mark any more. | `src/move-text.ts` (`threatsIn(pos)` now returns `{ from, to }[]`; the king's attackers come from `checkersOf`), `src/render/legend.ts` (`threat()`), `src/render/marks.ts` (draws `Highlights.threats`), `src/screen/play.ts` (`drawMarks()` keeps only the keyboard cursor), `src/screen/settings.ts`, `src/main.ts`, `src/style.css` (amber CSS deleted) | **Board UI** + Web UI. `move-text.ts` and `marks.ts` are in the plugin page. | branch `claude/game-marks` (`2b3df0f2`). Same status as C9. |
| C11 | **Park the clay look** | Menu → Extra loses Look and Reset view. `?look=clay` or a saved clay look opens the painted board, with no error. `dist/` shrinks from 20.8 MB to 8.7 MB. | `git mv` of `src/render/clay.ts`, `renderer.ts`, `ClayFigure.ts`, `OgreMaterial.ts`, `fx.ts`, `palette.ts`, `sprites.ts`, `voxels.ts`, `styles.ts`, `src/render/prototype/`, `public/prototype/`, `public/models/`, `public/sprites/`, clay tools → `parked/clay/`. Edits: `src/main.ts`, `src/entry.ts`, `src/render/PaintedView.ts` (drops `resetView`, `applyStyle`), `src/render/marks.ts` (gets the `Highlights` type), `src/render/legend.ts`, `src/screen/{play,settings,keys}.ts`, `vite.config.ts`, `public/sw.js`, many `tools/verify-*.mjs`. Guard: `tools/parked.test.ts`. Spec: `docs/specs/park-clay/spec.md`; README `parked/clay/README.md` | Web UI + Board UI (types only); no rule change | branch `claude/park-clay` (`17725935`, 3 commits, 1 uncommitted ticket edit), worktree `.claude/worktrees/park-clay`. `build-park` started 13:46 UTC and has not ended. Then 2 reviews, a fix, PR, merge, deploy. |

---

## 3. Engine and rules detail (C6, C7, C8)

The plugin server and the plugin board share `src/rules/*`. They get these changes for free. They are inert unless `RULES.design` is set.

### 3.1 The new rule field

- `Rules.design: DesignSpec | null` (`src/rules/rules.ts`), default `null`.
- Made by `parseRule('design=<share code>')`. `design=` alone clears it. A bad code throws `design: not a share code of a design`.
- `setRules` throws when the design breaks a Workshop limit (`limit()` from `src/workshop/model.ts`), or when a rule uses a When in `HISTORY_WHENS = ['fromMove', 'beforeMove', 'afterCard']`.
- `DesignSpec` (`src/rules/design.ts`): `{ squares: Square[]; lines: Dir[]; rules: Rule[]; like: {squares, lines} | null; code?: string }`.
  - `Square = { x, y, mark }`, `x, y` in −3..3, `mark` in `'both' | 'move' | 'take' | 'shoot' | 'moveShoot'`.
  - `Dir` = `n ne e se s sw w nw`.
  - `code` holds the share code for name and figure. The engine does not read it.
- The design plays in the type slot `T` (15, the paused Templar). One design per game. Both sides get the same design.

### 3.2 The rule vocabulary (the "seals")

One rule = one When + one Does (`Rule { when: When; does: Ability }`). A piece has at most 3 rules (`MAX_RULES`).

The 10 Does blocks (`Ability`, `src/rules/design.ts`; labels from `src/workshop/vocab.ts:62-112`):

| `a` | Label | Group | Options |
|---|---|---|---|
| `step2` | Steps 2 | Moving | — |
| `movesLike` | Moves like… | Moving | `as`: king, knight, bishop, rook, queen |
| `linesPass` | Lines pass | Moving | `over`: own, any |
| `chain` | Takes again | Taking | — |
| `cannotBeTaken` | Can't be taken | Safe | `by`: pawns, allButKing |
| `push` | Pushes | Moving others | `then`: follow, stay |
| `swap` | Swaps | Moving others | `with`: friend, enemy |
| `becomes` | Becomes | Changing | `into`: choice, Q, R, B, N, A |
| `cannotTake` | Can't take… | Holding back | `what`: king, pawns, any |
| `removedAfter` | Removed too | Holding back | `what`: piece, any |

The Whens (`When`): `always`; `zone` (startRank, ownHalf, enemyHalf, lastRank, capital); `near` (king, friend, enemy, or a body letter); `fromMove n` / `beforeMove n` (5, 10, 15, 20; refused in games); `afterFirstCapture`; `afterCard` (refused in games); `takes`; `firstTake`; `reaches lastRank`.

Bodies (`Body`): P N B R Q A L G M S O (pawn, knight, bishop, rook, queen, archer, paladin, guard, maester, beast, ogre).

### 3.3 Engine hooks (all behind `RULES.design`)

- `genPieceRaw` `case T` → `genDesigned(board, from, mode, out, RULES.design)`.
- `canCapture`: "always" `cannotTake` / `cannotBeTaken`.
- `sheltered`: new shelter level 4 ("only a king may take"); `dropSheltered` and `isAttacked` read it.
- `isAttacked`: Templar terms off while a design is set; new forward test `designHits`.
- `landed`: sets `SPENT` after a design's first take when a rule reads it.
- FEN: `U` / `u` = a design after its first take (`H` stays the spent guard).
- Names: `nameOf(t)`, `theName(t, article)`, `aName(t)` give the design's name for `T`. Use these in plugin move text, not `NAMES[t]`.
- AI: `setPieceValues({ T: round(worthOf(design) * PAWN_V) })` in `src/ai/worker.ts` and the main-thread search; `src/sim/game.ts` too (C8).

### 3.4 Coupling risk for the plugin

- `src/rules/rules.ts` now **imports `src/workshop/model.ts`** (and through it `vocab.ts`, `figures.ts`). The plugin page grew by 8,604 bytes for this (4,298,020 → 4,306,624). Any future growth of those Workshop files grows the plugin page.
- `src/match/worker.ts` now hashes `src/workshop/` into the engine id (`engine = sha256:…`). So **any edit to a Workshop file changes the match engine hash**, also a pure UI edit. If the plugin stores or compares engine ids for matches, expect new ids after Workshop merges.
- `src/match/match.test.ts` now copies `src/workshop` into its isolated copy.
- The plugin page does not call `setFigure`. If a plugin match ever carries `rules.design`, the plugin board draws `T` as a lettered token, not the design's figure. The plugin server (`src/plugin/server.ts`, `src/match/service.ts`) has no design support today. **The MVP does not need designs**; keep `design: null` in plugin games.

---

## 4. Board-drawing detail (C2, C9, C10) — what the plugin board already has or gets

The plugin page imports `src/render/PaintedView.ts`, `marks.ts`, `legend.ts` (through marks), `board-ink.ts`, `tap.ts`, `docs/2d-first-pieces/board/scene.mjs`, `src/move-text.ts`, `src/powers-ui.ts`, `src/rules/{engine,rules,setup}.ts` (web-redesign spec rule 5, `docs/specs/web-redesign/spec.md:61-65`).

| Element | On main now (plugin board too) | After `claude/game-marks` merges |
|---|---|---|
| Move | green tile | same |
| Take only | white tile + red target | same |
| Move or take | green tile + red target | same |
| Shot | red target + ink arrow | same |
| Take on an enemy figure | thin red edge, ring + glow at feet, badge top-left | same |
| King power target | two blue frames | same |
| Selected piece | square outline + gold ring and pulse at feet | **gold glow under the feet**; no outline, no ring |
| Slides (B, R, Q, paladin, catapult, design lines) | separate tiles | **green rails** joining the tiles; arrowhead at board edge; stop bar before a blocker |
| Coordinates (framed board) | small grey lowercase | **gold Cinzel capitals A–H and numbers** |
| Show threats | web only: amber diamond + triangle (DOM overlay) | **red arrow attacker → target + red glow** drawn by `marks.ts` from `Highlights.threats` (canvas, so the plugin could show it if it fills `threats`) |
| Dark squares, frame | brown stone, thick frame | unchanged (owner: "exclude the board change") |

Colours (`LEG` in `src/render/legend.ts`): green `#7cb342`, hi `#9ccc65`, lo `#6a9a36`, navy `#1c2e5c`, red `#d63428`, white `#fbf7ee`, ink `#2b2621`, power `#2f5ea8`, powerMid `#7fb2ff`, gold `#e9c071`. Target radius `TR = 0.32`, shot radius `SR = 0.27`, shot shift `SO = 0.07` of the tile side.

API of the shared drawing: `kindOf(sq, {moves, captures, shots})` → `'move' | 'take' | 'both' | 'shot' | 'moveshot'`; shape builders `target`, `shot`, `tile`, `occupied`, `badge`; renderers `toSvg()` (SVG) and `paint()` (canvas). Options `px`, `power`, `hover`, `solid`, `cond`.

`Highlights` (marks input): `moves`, `captures`, `shots`, `hint`, `check`, `checkers`, plus on game-marks `rails` and `threats`. **Conflict risk:** `claude/park-clay` moves the `Highlights` type from `src/render/renderer.ts` to `src/render/marks.ts`; `claude/game-marks` adds fields to it in `renderer.ts`. The second branch to merge must move the new fields.

---

## 5. What the plugin MVP must adopt

### 5.1 Free through the shared modules (no plugin work, but test it)

1. **The move legend (C2).** Already on the plugin board. The MVP board shows the owner's legend. Do not draw a second mark set.
2. **Gold glow, rails, gold coordinates (C9)** — when `claude/game-marks` merges. The plugin board changes with no plugin code. Run `npm run check:browser plugin-ui` and `plugin-ui-http`, and record the plugin page size.
3. **Engine changes (C6, C8).** Inert with `design: null`. Perft unchanged. No rule change for normal games.
4. **New name helpers.** `nameOf`, `theName`, `aName` in `src/rules/engine.ts`; `describeMove` already uses them.

### 5.2 Plugin must decide or build

1. **Show threats.** After C10, threats are canvas marks in `marks.ts` (`Highlights.threats`, data from `threatsIn(pos)` in `src/move-text.ts`). The plugin board can offer Show threats with little code: fill `threats` from `threatsIn`. The amber CSS (C4) never reached the plugin and will be deleted. Do not copy amber.
2. **Settings "symbols only" graphic mode (MVP).** Not built by this session. The web app has `?labels=1` letter labels, and `src/piece-icons.ts` `pieceIcon`. The legend marks must stay readable on top of icons. Not related to clay.
3. **Painted board only.** Clay is parked (owner, 2026-10-11). The plugin must not offer a Look choice. After C11, `BoardView.resetView` and `applyStyle` no longer exist on `PaintedView`; plugin code must not call them.
4. **Game-setup toggles.** This session built none of: fairy-piece pool sub-menu, arrangement, classic chess switch, 4-card draw, king-power picker. Reuse instead:
   - kings and powers: `KINGS`, `PLAIN_KINGS = ['Spirit', 'Shadow']` (defaults when powers are off, matches the owner's MVP note), `parseKing`, `parseKings`, `POWERS_BALANCED`;
   - cards: `ALL_CARDS`, `CARD_ONLY`, `parseRule('hands=…')`, `parseRule('piles=…')`;
   - pieces: `POOL`, `CLASSIC_CHESS`, `randomBackRank` (`src/rules/setup.ts`);
   - New-game model: `Setup`, `defaultSetup`, `parseSetup`, `withDesign` (`src/new-game.ts`). `Setup` now has `design: string | null`; the plugin can keep it `null`.
5. **"Bring a design" in the plugin.** Out of MVP scope. If added later: pass `design=<code>` in the rules, call `setFigure(T, urls)` on the scene, and set the AI value with `setPieceValues`.
6. **Seals / max 3 rules.** These belong to the Workshop piece editor, not to game toggles. They matter to the plugin only if the plugin ever shows or plays custom pieces. The MVP toggle list has no such item.

### 5.3 UI ideas the plugin board may copy (optional, from the Proving Ground)

- **Why tag:** tap a square, see "base mark + each rule's stamp = mark now" (`src/workshop/why.ts`, a rerun with each rule removed). Good for a "why is this legal?" help, but it reads Workshop designs, not pool pieces with powers.
- **Wax seals** as one-sentence rule cards (`src/workshop/text.ts` `lineParts`, `ruleText`). Could feed a piece help sheet.
- **Card face for sharing** (`src/workshop/face.ts`): a piece as a card. Could serve the profile "scroll" or badges look.
- **Kings tab / LAB cards tab** (tickets 13, 14): power and card previews on a board run inside `withRules(over, fn)`. The plugin could reuse that to preview a king power or a card in the picker sub-menus.
- **Cards that show on the Workshop board:** Freeze, IceWall, Leap, March, Mimic, Vault (spec decision 30). Card art for Rescue = hands, Salvation = graveyard (owner, 2026-10-10).
- Touch targets: 44 px everywhere, 24 px minimum for nubs and knots (spec decision 9).

---

## 6. Risks for the plugin

| Risk | Detail | Action |
|---|---|---|
| Plugin page size | ~4,312,074 B after #48; limit 4,400,000; stop-and-ask 4,350,000. game-marks adds legend shapes; park-clay saves 27 B. | Measure with `node tools/plugin-ui-build.mjs` after each merge. |
| Engine hash churn | `src/match/worker.ts` hashes `src/workshop/` | Do not assume a stable engine id across Workshop merges. |
| `Highlights` move | park-clay moves the type to `marks.ts`; game-marks edits it in `renderer.ts` | Merge order matters; fix the second merge. |
| Local main stale | Local `main` = `e73f8061`; `origin/main` = `13861709` | Fetch before branching. |
| Plugin release | The legend (#41) and engine (#48) changes are on main but the plugin was not released ("No plugin release until the owner asks", move-legend D7). | The plugin MVP release will ship these marks for the first time. |
| Threat look weak | Reviewer of game-marks: the red arrow is thin (2 px at 60 %) and easy to miss; ask the owner if it should be 3 px at 80 % (`src/render/legend.ts:389`, `marks.ts:535`). | Watch for an owner decision before copying. |
| In check, double mark | With Show threats on, a checked king gets the check line and a threat arrow (`src/screen/play.ts:232`, `:235`). Nit, maybe fixed by `fix-gm`. | Check after merge. |
| Catapult rail | A catapult lob over its screen draws as a line take (`src/marks-model.ts:164`). Nit. | Check after merge. |
| Game link "No" path | Answer No to "Open the game from this link?" and the link's kings still apply. Old bug, recorded in ticket 17. | Not plugin, but the invite flow may meet the same question. |

---

## 7. Still running or planned in that session (merge later)

Order the session planned:

1. **`claude/game-marks`** (C9, C10): `fix-gm` running (started 15:27 UTC) → push with the test lock → PR → merge after CI. Owner wants no images.
2. **`claude/park-clay`** (C11): `build-park` running since 13:46 UTC → `review-parka` (nothing clay in the prod bundle; `parked/` excluded; guard real) → `review-parkb` (regressions) → `fix-park` → push → PR → merge.
3. **Deploy** kingdown.dev with `tools/deploy.sh` after park-clay merges (owner: "2. yes"), then a live-site check. The deploy ships C2–C11 to the web for the first time.
4. **TASKS.md update on main:** Proving Ground line (16 and 17 merged, deployed); clay-only tasks marked parked ("Clay king effects", clay browser checks); Open items under 5,000 bytes.
5. Remove the park-clay and game-marks worktrees after merge.

Later items with no ticket (spec "Later, with no ticket"): edit the laws (`RULES` flags) in the Workshop; MATRIX C.1 power/card facts as code; step boards in the Why tag; the "Also changed by" row (now possible after ticket 16); `captureRefusal()` for engine pieces; ranged lines and offsets beyond ±3; Salvation/Rescue/Mirror/Growth history scenes; phone "Words off" switch.

Owner said "not now": a balance run with designs. Removing the `three` package after the clay park needs a worktree with its own `node_modules` (park-clay spec §2.4).

Other open owner items that the session listed (not its own work): Accounts and multiplayer decisions; the card deal (keep March? which cards?); balance framework runs; Turn countdown screenshots; Criterion 4; piece-letter icons; king with no power.

## 8. Commands to fold the changes in later

- See merged work: `git log --oneline origin/main` (PRs #41 `b5078331`, #42 `87ae195e`, #47 `d10b1a21`, #48 `ce2fe345`, #49 `13861709`).
- See in-flight work: `git log --oneline origin/main..claude/game-marks`, `git log --oneline origin/main..claude/park-clay`.
- Driver progress of that session: `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/4f9c309c-1bab-444c-b463-5cd4ad0f54f0/scratchpad/drive2/progress.log` (lines `end build-park`, `FINISHED-park`, `end fix-gm`).
- After each merge, in the plugin branch: rebase or merge `origin/main`, then `npm test` (with the test lock), `npm run check:browser plugin-ui` and `plugin-ui-http`, and `node tools/plugin-ui-build.mjs` for the size.
