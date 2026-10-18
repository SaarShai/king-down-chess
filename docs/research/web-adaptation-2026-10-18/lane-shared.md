# Shared game code survey

PR 61 adds shared chess rules, search support, and board changes. The web app gets the code at merge, but its current setup does not enable castling or en passant. Symbols-only pieces, beginner notes, short move text, and new card text helpers also need web connections. Board load, motion, coordinate labels, instructions, and short-screen layout change on the web without those connections. The phone scroll fix needs web CSS and an input guard. Keep the web Workshop, lessons, daily army, local play, game links, saved games, review, and settings. This survey checks source code only. Runtime behavior and test results are **unverified** in this survey.

## Scope and evidence key

- **M** means `main`, commit `38a6bbffb3b85f10bb9e6d23e8e1f394b781b4f4`.
- **R** means `claude/release-candidate`, commit `682e58bd47e38aa1e571deb17afb64f3183149a1`.
- A reference such as `R:src/read.ts:219` means that file and line on R. Read it with `git show claude/release-candidate:src/read.ts`.
- The comparison is `git diff main..claude/release-candidate -- <lane paths>`. It contains 19 changed files: 14 production files and 5 test files. `src/screen/*` and `src/workshop/*` have no changes in this comparison. `src/main.ts` and `src/game.ts` also have no changes.
- S means a small connection or merge review. M means work across setup, state, and display. L means a large change to the game flow. For kind (a), S means review of inherited code; it does not mean a web build is necessary. For kind (e), S means preserve and verify; it does not mean a feature gap.
- Read-only source inspection supports the claims below. No test, run, browser check, install, live-site call, or repo write forms part of this survey. No tracker ticket changes. Only this requested scratch file is written.
- Shared dependencies outside this lane appear only where they change the result: `src/ai/zobrist.ts`, the painted scene, and the pure match setup module. Account and server adoption belong to the other survey lanes.

## (a) Shared code that reaches the web at merge

### SH-01 — Optional chess rules and position state

- **Kind:** (a). The web calls the engine, but it does not enable the new option through New game.
- **Evidence:** `R:src/rules/rules.ts:637` and `:764`; `R:src/rules/engine.ts:83`, `:198`, `:1034`, `:1093`, `:1772`, `:1890`, `:1913`, `:1928`, `:1939`, `:1972`; `R:src/rules/setup.ts:63`, `:95`, `:173`, `:206`, `:244`. Origin: commit `bee0000a`; review fixes: `70f3ef72`; ticket `R:docs/specs/chatgpt-mvp/issues/03-classic-chess-rules.md:32`.
- **Web today:** `M:src/game.ts:31`, `:67`, `:70` uses start positions, legal moves, and move application. The classic army choice uses `RNBQKBNR`, with no castling or en passant.
- **Behavior:** `classicChess` defaults to false. When true, it adds both moves, rook movement on castling, rights loss, en-passant expiry, FEN fields, and distinct `O-O` / `O-O-O` text. Rights account for swaps, pushes, changes of piece type, and takes. A frozen rook cannot castle. These are new abilities, not a default rule change for web play.
- **Work / dependencies:** S for merge. No web build for the current mode. SH-11 enables the feature; SH-17 carries it through web links. Keep this change with SH-02.
- **Risks:** Do not enable it for every classic-looking army or old saved game. The en-passant state checks for a nearby pawn, not a legal take. A pinned or frozen pawn can thus delay repetition recognition. The code shows this limit in `epAfter`; ticket 03 records it at line 53. Strict chess repetition is not fully equivalent. Runtime parity with the flag off is unverified here.
- **Owner taste call:** No for the rule repairs. Yes before the web enables this optional mode; see question 1.

### SH-02 — Search and repetition support for chess moves

- **Kind:** (a). The web uses this search and this position key.
- **Evidence:** `R:src/ai/search.ts:114`, `:219`, `:346`, `:364`, `:394`, `:456`, `:504`, `:867`, `:894`; `R:src/ai/zobrist.ts:139`; `M:src/game.ts:50`, `:103`, `:122`, `:147`.
- **Web today:** Game repetition uses `positionKey`. The computer uses the worker or the same search on the page. The worker receives the page rules.
- **Behavior:** Search makes and reverses the rook step, saves rights and en-passant state, generates both chess moves, and includes the state in its key. New key groups append to the old groups. Positions with no new state add no new key terms.
- **Work / dependencies:** S for merge. Depends on SH-01 and the appended key groups in `src/ai/zobrist.ts`. No new web worker transport is necessary: the existing rules and position payloads carry the fields.
- **Risks:** Keep engine and search move application together. A partial copy can make the computer disagree with the game. The extra state enters the shared hot path even with the option off. Speed and unchanged search results are unverified here. No speed gain is claimed.
- **Owner taste call:** No. Correct search and repetition state have one required result.

### SH-03 — Spoken move descriptions

- **Kind:** (a). The web calls `describeMove` now.
- **Evidence:** `R:src/move-text.ts:79`, `:88`, `:93`, `:100`; `M:src/screen/play.ts:290`; `M:src/ui/table.ts:204`, `:211`; `M:src/ui/home.ts:38`; `M:src/screen/moments.ts:122`.
- **Web today:** Move announcements, history labels, Home, and the result detail use the same description helper.
- **Behavior:** Firewall gets its own description. Castling gets a short/long description. A pawn take away from its landing square names en passant. Other ordinary descriptions keep their path.
- **Work / dependencies:** S for merge. Chess descriptions depend on SH-01 and SH-11 for normal web access. Firewall words become useful when a web card deal exists.
- **Risks:** The current New game form has no card-deal field (`M:src/new-game.ts:30`). Do not describe these new sentences as a complete web card feature. Exact spoken output needs a later check.
- **Owner taste call:** No for naming the actual move. Any further change to the words needs approval.

### SH-04 — Shared instructions and pawn read text

- **Kind:** (a). The web calls all the changed instruction paths.
- **Evidence:** `R:src/context-line.ts:26`, `:36`; `R:src/turn.ts:58`, `:65`, `:85`; `R:src/ui/table.ts:100`; `R:src/read.ts:152`, `:175`, `:211`, `:282`; `M:src/ui/table.ts:22`, `:216`, `:242`; `M:src/screen/play.ts:258`; `M:src/ui/guide.ts:31`.
- **Web today:** Many board instructions say “Tap”. The short pawn read shows the first movement sentence. Paladin guide text reads the live removal rule.
- **Behavior:** The changed strings use “Select”. The pawn short read now includes both movement sentences, including its start-rank double step. Paladin removal words move into one helper; that refactor keeps the same rule readings. `powerText` delegates its web word replacements to `webWords` with the same replacements (`R:src/powers-ui.ts:25`, `:29`).
- **Work / dependencies:** S for merge. No new caller. The new `teach` field is separate work in SH-13.
- **Risks:** Longer pawn text can use more space. This is not a complete word change across the web: unchanged Workshop strings still say “Tap” (`M:src/workshop/ground.ts:1312`). Rendered fit is unverified.
- **Owner taste call:** Yes for changed instructions and longer short text on the web. See question 5. The Paladin helper refactor needs no taste choice.

### SH-05 — Flexible short-screen table rows

- **Kind:** (a). The web imports the changed CSS.
- **Evidence:** `R:src/ui/table.css:7`, `:109`, `:117`; `M:src/main.ts:14`; `M:src/ui/table.css:109`, `:117`.
- **Web today:** In short portrait windows, the context row and context element use a fixed 57 px height.
- **Behavior:** Player rows accept an optional `--strip-row`. Their fallback sizes stay the same. The short portrait context row can grow beyond its minimum; the element uses `min-height`. The web does not set `--strip-row` in the inspected source, so that new hook alone changes no strip size.
- **Work / dependencies:** S for merge. SH-04, SH-13, and SH-14 can add pressure on text space.
- **Risks:** The context can now take more vertical space. The outer table still has a fixed viewport height. Board height, bottom controls, and stable touch targets need a later short-window and zoom check. The branch change does not prove that all web overflow is fixed.
- **Owner taste call:** Yes for the space tradeoff. See question 6.

### SH-06 — First visible board frame

- **Kind:** (a). The web constructs `PaintedView` and awaits `ready()`.
- **Evidence:** `R:src/render/PaintedView.ts:92`; `R:docs/2d-first-pieces/board/scene.mjs:952`; `R:src/render/PaintedView.test.ts:28`; `M:src/main.ts:69`, `:188`. Commits `88f1188a`, `ad4bb0f9`.
- **Web today:** The canvas can appear before the stone board image is decoded. Startup waits for scene loading.
- **Behavior:** The canvas stays hidden through load, then appears on the next animation frame. The stone image load waits for decode. `ready()` now includes the reveal frame.
- **Work / dependencies:** S for merge. Keep the scene load change with the wrapper change.
- **Risks:** A hidden browser tab can delay `ready()` and the startup steps after it until a frame runs. A stone image error still permits the scene fallback; the code does not require successful stone load. The new unit test uses a scene stub, so it is not visual proof of a flash-free web load.
- **Owner taste call:** No. Removing a premature empty board frame is a fault fix.

### SH-07 — Touch drag handling and a drag guard

- **Kind:** (a). The web uses the changed pointer handlers.
- **Evidence:** `R:src/render/PaintedView.ts:50`, `:110`, `:297`, `:304`, `:323`; `R:src/render/PaintedView.test.ts:49`; `M:src/screen/play.ts:488`, `:502`; `R:src/plugin/screens/board.ts:82`.
- **Web today:** The view captures a drag from a piece of the side to move. The web controller separately refuses input when busy, in review, or outside the player's turn.
- **Behavior:** A new `canDrag` callback can stop drag capture. Touch start prevents page scroll only for an allowed piece drag. Pointer cancellation clears the press. The default callback returns true, so the web does not inherit the plugin's turn guard.
- **Work / dependencies:** S for inherited code. SH-16 supplies the missing web policy and CSS if the owner wants board scrolling.
- **Risks:** The new source tests cover taps, drags, cancellation, and a disabled drag. They do not prove the web's actual touch behavior. The web canvas still uses `touch-action: none`; a merge alone does not enable vertical scroll.
- **Owner taste call:** No for cancellation and valid drag repair. Yes for adopting a web scroll policy; see question 4.

### SH-08 — Coordinate labels that fit the frame

- **Kind:** (a). The web already passes `webInk: true`.
- **Evidence:** `R:src/render/board-ink.ts:16`; `R:src/render/PaintedView.ts:209`; `R:src/render/board-ink.test.ts:25`; `M:src/main.ts:69`; `M:src/screen/settings.ts:47`.
- **Web today:** The coordinate font grows as the board shrinks. Its old size has no new 40-unit cap.
- **Behavior:** `coordInk` caps the font at 40 scene units and caps its inset. It hides labels below 8 CSS px. This threshold occurs below a board width of 192 CSS px. It does not change the saved coordinate switch.
- **Work / dependencies:** S for merge. No web option connection is necessary.
- **Risks:** A user with Coordinates on can see no labels on a very narrow board. The tests check the size formula; actual glyph fit and zoom remain unverified.
- **Owner taste call:** The overlap repair has one purpose. The hide threshold and smaller text are a web display choice. See question 6.

### SH-09 — Reduced motion and passive board effects

- **Kind:** (a). The web uses this view and the underlying scene.
- **Evidence:** `R:src/render/PaintedView.ts:146`, `:167`, `:177`, `:205`; `R:docs/2d-first-pieces/board/scene.mjs:605`, `:723`, `:854`, `:873`, `:883`; `M:src/screen/settings.ts:37`, `:40`, `:66`.
- **Web today:** The view disables idle effects under reduced motion, but its old `applyLively` keeps move gaits and capture effects enabled. The web defaults Pace to Off under reduced motion; a saved pace can override that default.
- **Behavior:** The view now passes the system motion choice to the scene. Reduced-motion moves use a plain slide and a take fade, with no scene shake. Pace Off still skips move playback. `motion()` becomes public for callers. The imported scene also limits passive idle redraws to about five seconds after a change, instead of an open-ended idle loop.
- **Work / dependencies:** S for merge. Keep the scene and view changes together. This scene change sits outside the named source paths, but it is a direct runtime dependency.
- **Risks:** Normal moves keep their full path when motion is allowed. Passive king and pawn effects can stop after idle time on the web. That is a visible change even with no new web option. Sound contact, reverse playback, and end ceremonies need later checks with saved pace and system motion choices. Power or battery savings are unverified.
- **Owner taste call:** Reduced-motion compliance is a fault fix. The plain-slide style and five-second idle limit need a web choice. See question 7.

### SH-10 — Rule and render test changes

- **Kind:** (a). Shared source coverage reaches main; it adds no player control.
- **Evidence:** `R:src/rules/classic-chess.test.ts:20`, `:40`, `:111`, `:169`, `:213`; `R:src/rules/power-fixes.test.ts:470`, `:483`, `:515`, `:544`; `R:src/render/PaintedView.test.ts:28`, `:49`; `R:src/render/board-ink.test.ts:25`; `R:src/render/marks.test.ts:93`.
- **Web today:** The common rules and board already have tests, but these new chess and input cases do not exist on M.
- **Behavior:** New chess tests cover published move-tree counts, rights, en passant, replay text, repetition, and engine/search agreement. Render tests cover reveal timing, touch input, coordinate sizes, and symbol preview drawing. The Darkness random-board test builds one seeded board set, then tests each of five readings separately. Its engine assertions remain; this change does not change a Darkness rule.
- **Work / dependencies:** S for merge. Supports SH-01, SH-02, SH-06, SH-07, SH-08, and SH-12.
- **Risks:** Tests are source evidence only in this survey. None runs here. The split reduces work in each test case; it does not establish a faster game or prove a current pass.
- **Owner taste call:** No.

## (b) Plugin use that the web can adopt with small changes

### SH-11 — Enable the new Classic mode in web setup

- **Kind:** (b). The shared engine arrives under SH-01; only the plugin connects the new setup option today.
- **Evidence:** `M:src/main.ts:133`; `M:src/new-game.ts:30`; `M:src/screen/play.ts:642`, `:651`; `R:src/match/setup.ts:20`, `:29`, `:45`, `:87`; `R:src/match/worker.ts:61`.
- **Web today:** Choosing the classic army supplies `CLASSIC_CHESS`. The setup type has no `classic` flag. `newGame` sets kings, design, and preset rules, with no chess flag.
- **Lift / behavior:** Reuse the plugin's Classic option rule: fixed chess army, Fairy off, explicit classic flag. Set `classicChess` before creating the position. Keep old saved games under their stored rules. The pure setup validation can serve the web; do not copy the match worker.
- **Host coupling:** The pure setup module has no host call. Plugin setup submission uses the app client and tools. A local web game needs only the option-to-rules connection.
- **Work / dependencies:** M. Depends on SH-01, SH-02, and SH-17. The web already copies rules into saves and restores them before replay (`M:src/screen/play.ts:722`, `:730`); extend that flow rather than build new storage.
- **Risks:** A simple army-label change can alter old user expectations. Chess with powers can offer both a king's two-square step and castling. Keep the distinct move texts and choice path. Full strict chess repetition has the SH-01 limit.
- **Owner taste call:** Yes. See question 1.

### SH-12 — Symbols-only board and matching move preview

- **Kind:** (b). The renderer support is shared; only the plugin enables it.
- **Evidence:** `R:src/render/PaintedView.ts:125`, `:130`, `:252`, `:262`; `R:src/render/marks.ts:62`, `:187`; `R:src/plugin/board-view.ts:17`; `R:src/plugin/art.ts:3`; `M:src/screen/settings.ts:10`, `:45`; `M:src/screen/save.ts:16`.
- **Web today:** Piece letters add labels to painted figures. They are not a symbols-only look. No web caller invokes `setSymbols`.
- **Lift / behavior:** Reuse `setSymbols`, decoded side-specific icon images, and the ghost callback. The scene gets an empty piece board while the wrapper draws symbols and marks. The preview uses the same symbol at half opacity. Add a separate web setting and save field.
- **Host coupling:** Image loading and the renderer have no `window.openai`, widget-message, tool, or frame dependency. Plugin settings arrive through the client. Lift the image loader, not its client or fixed board element singleton.
- **Work / dependencies:** M. Depends on web settings/account field agreement and the asset build. The plugin turns Pace Off for symbols; the web must define the same behavior or add symbol motion.
- **Risks:** Do not replace Piece letters. The plugin map contains fixed piece icons. A web Workshop design uses `T`; the loader needs a valid design/token symbol before this option covers all web games. An empty scene also affects figure labels and fallen-king art. Those combinations need a later check.
- **Owner taste call:** Yes. See question 2.

### SH-13 — Beginner notes after an enemy fairy move

- **Kind:** (b). The helper and context field arrive, but the web supplies no note.
- **Evidence:** `R:src/read.ts:219`; `R:src/context-line.ts:13`, `:49`; `R:src/plugin/screens/board.ts:110`, `:355`, `:366`, `:381`, `:482`; `M:src/ui/table.ts:216`; `M:src/screen/play.ts:279`.
- **Web today:** The web has full lessons and piece reads. `refreshTable` does not pass `teach` to `contextLine`.
- **Lift / behavior:** Reuse `teachNote` and a per-game record of which note appears. It handles an archer shot, ogre shove, beast chain, Paladin removal, and Maester swap. Show each kind after the enemy action at Beginner. Record a note only when it appears; reset for a new game. Keep the shared context priority so results, refusals, and active actions take precedence.
- **Host coupling:** The helper has none. Plugin integration reads its seat, level, and move history from a server view. Use the web's sides, skill, and local history. No tool or widget state is needed.
- **Work / dependencies:** S for the local connection. Depends on SH-04 and available context space under SH-05. Preserve SH-19 lessons.
- **Risks:** Undo, review, rematch, and lesson entry need clear note state. The first-game hint and selected-piece lesson text in the plugin are separate from `teachNote`; copying only that function does not copy all beginner help.
- **Owner taste call:** Yes. See question 3.

### SH-14 — Short last-move text and piece titles

- **Kind:** (b). New pure helpers serve the plugin; the web keeps its current text layout.
- **Evidence:** `R:src/move-text.ts:66`; `R:src/read.ts:7`; `R:src/plugin/screens/board.ts:164`, `:352`; `M:src/ui/table.ts:22`, `:204`; commit `e1713bc6` keeps lower-case web piece names.
- **Web today:** The table uses `describeMove` for the last move and `readText` for a piece. A piece read starts with a lower-case name.
- **Lift / behavior:** `shortMove` adds compact side, card/power, action, and square text. `pieceTitle` supplies side plus a capitalized piece name. Either can serve a web display without replacing screen-reader descriptions.
- **Host coupling:** Neither helper uses the host, messages, tools, or frame. The plugin's row and context layout are its own DOM.
- **Work / dependencies:** S for text reuse; M if the web also copies the new row layout. Depends on SH-05 for fit and SH-15 for card naming. No automatic web text change follows from adding these exports.
- **Risks:** Keep full spoken text. A custom design uses the web's design-aware reads; a compact fixed name must not lose its identity. The lower-case web read is an explicit branch repair, not an unresolved missing title.
- **Owner taste call:** Yes if the owner wants either new form. See question 5.

### SH-15 — Shared card names, turn costs, and rule lines

- **Kind:** (b). The new helpers are shared exports, but their new UI callers are in the plugin.
- **Evidence:** `R:src/powers-ui.ts:13`, `:16`, `:25`, `:27`; `R:src/plugin/screens/setup.ts:75`, `:122`; `R:src/plugin/screens/collection.ts:41`; `M:src/workshop/ground.ts:70`, `:72`, `:1279`.
- **Web today:** Workshop has its own card name and rule-text helpers. Normal web setup has no card-deal field. Existing king power text already uses web wording.
- **Lift / behavior:** Reuse `cardName`, `cardCost`, and `ruleLine` for a web card setup or guide. MirrorB appears as Mirror; MorphP appears as Morph. Costs distinguish free-then-move, a full turn, and the copied card's cost.
- **Host coupling:** None in the helpers. Plugin setup screens use client state and tools, which the local web setup does not need.
- **Work / dependencies:** S for these helpers. A complete web card setup is separate work, with deal, hands, and controls from the setup survey lane. Do not count this item as that complete feature.
- **Risks:** Workshop also shows lab variants and variant letters. A global helper replacement can remove useful distinctions. `ruleLine` expects nonempty text without its final full stop; check each caller before reuse.
- **Owner taste call:** Yes for web labels, cost display, and guide layout. See question 5.

### SH-16 — Allow web board scrolling where no drag is valid

- **Kind:** (b). The shared handler is present; the complete scroll policy is in plugin CSS and its board controller.
- **Evidence:** `M:src/style.css:691`; `R:src/plugin/app.css:169`; `R:src/plugin/screens/board.ts:82`; `R:src/render/PaintedView.ts:112`, `:309`; `M:src/screen/play.ts:488`, `:502`.
- **Web today:** `touch-action: none` blocks browser panning on the painted canvas. The controller rejects invalid moves after input reaches it. It does not set the new drag callback.
- **Lift / behavior:** Use the plugin's vertical-pan CSS and connect `canDrag` to the local game's valid drag state. Permit scroll from empty or enemy squares, and from any square when the board cannot take a drag. Keep taps for reads and animation skip.
- **Host coupling:** The scroll CSS has no host call. Replace the plugin seat, screen, and network-lock tests with web lesson, review, busy, turn, and player-side tests. Do not copy its app frame or composer spacing.
- **Work / dependencies:** S. Depends on SH-07. Any exposed interface must include the callback; `M:src/main.ts:69` types the view as `BoardView`, while the new callback is on `PaintedView`.
- **Risks:** Touch scroll and piece drag compete. Keep keyboard input, two-player play, review reads, and move skip. Source tests do not replace a real phone gesture check. Runtime is unverified.
- **Owner taste call:** Yes to enable this web interaction change. A confirmed broken valid drag has one right fix. See question 4.

## (c) Web work with no plugin equivalent

### SH-17 — Carry optional chess rules through web game links

- **Kind:** (c). The plugin uses a game ID and server state. It has no equivalent of the web's complete local game URL.
- **Evidence:** `M:src/screen/links.ts:13`, `:51`; `M:src/main.ts:45`, `:55`, `:177`, `:186`; `M:src/screen/play.ts:651`, `:722`, `:730`; `M:src/marks-model.ts:41`; `R:src/plugin/screens/board.ts:195`, `:229`; `R:src/plugin/client.ts:10`.
- **Web today:** A share link carries preset name, kings, design, army or FEN, and move text. It carries no explicit `classicChess` option. The receiver sets rules before replay. A local save already carries a rules object.
- **Required change:** If SH-11 proceeds, add a clear web setup/rule field to the URL path and restore it before position creation and replay. Preserve old links. Check New game, saved restore, rematch, and return from lessons under both flag values. Do not add a second save system.
- **Work / dependencies:** M. Depends on SH-01, SH-02, SH-11. No host transport can replace this work.
- **Risks:** Merely serializing FEN chess fields is insufficient: the flag-off reader ignores them. An army-based link can also replay `O-O` with no castling rights. The web's existing `clickPath` treats en passant as victim then landing square. The plugin accepts either square. Reuse that small selection rule if the owner chooses one-step input. The current painted animation has no explicit rook path, and reverse playback rebuilds only the primary move (`R:src/render/PaintedView.ts:146`, `:156`). A simultaneous rook slide is unverified, not an inherited feature.
- **Owner taste call:** No for correct link and restore behavior once Classic is approved. Yes for the choice of one-step input and a rook animation. Include those choices in question 1.

## (d) Plugin-only code that does not belong on the web

No changed production module in this lane is wholly host-only. The new helpers are pure, and the board is already shared. Do not classify them as unusable just because only the plugin calls an export today.

The host transport is outside this lane and is not a missing local-game feature. `R:src/plugin/app.ts:34` reads `window.openai`; `R:src/plugin/client.ts:24`, `:35` uses the tool client and widget state; `R:src/plugin/screens/board.ts:199` submits a turn through a tool. Keep those dependencies out of the local connections in SH-11 to SH-16. The frame, widget draft, and server game revision are not replacements for the web's local game, save, or link.

## (e) Web features that already exist and must stay

The following items are preservation requirements. Some have no complete plugin equivalent. Others already use shared code on both hosts. Its screen list is at `R:src/plugin/client.ts:3`; its screen connections are at `R:src/plugin/app.ts:74`. There is no lesson runner, Workshop editor, daily-army entry, local two-player mode, or local game-link route in those lists.

### SH-18 — Workshop and a design in a real game

- **Kind:** (e). No gap.
- **Evidence:** `M:src/main.ts:96`, `:198`; `M:src/workshop/ground.ts:116`; `M:src/workshop/store.ts:9`, `:24`, `:26`; `M:src/new-game.ts:91`, `:96`; `M:src/screen/play.ts:649`; `R:src/render/PaintedView.ts:122`.
- **Web today:** The Workshop edits and stores designs, gives them figures and rules, runs local piece/power/card examples, and can bring a design into a game. Design links open the Workshop. The plugin Collection reads rules; it is not this editor.
- **Work / dependencies:** S to preserve. No changes in `src/workshop/*`. SH-12 must support its design token. SH-15 must retain lab names.
- **Risks:** Shared engine, read helpers, and imported scene art still affect it despite no Workshop diff. The scene now loads custom figure images with anonymous CORS (`R:docs/2d-first-pieces/board/scene.mjs:966`). Actual figure loading is unverified.
- **Owner taste call:** No to preserve. Changes to the editor or its lab words need approval.

### SH-19 — Guided lessons and return to the saved game

- **Kind:** (e). No gap.
- **Evidence:** `M:src/main.ts:94`; `M:src/screen/play.ts:316`, `:330`, `:351`, `:368`, `:707`; `R:src/plugin/screens/board.ts:359`.
- **Web today:** A lesson uses a separate game and today's rules. It checks a goal, undoes a wrong move, records progress, and returns to the real game with its state. The plugin borrows lesson completion words in a piece read. It does not run this lesson flow.
- **Work / dependencies:** S to preserve. SH-13 adds a smaller help path; it must not replace lessons. SH-11 must keep rule restore correct.
- **Risks:** A note or new mode must not enter the saved game from a lesson. A lesson must not erase chess rights or change the live game rules on return. Runtime is unverified.
- **Owner taste call:** No to preserve.

### SH-20 — Daily army, examples, custom army, and old rule presets

- **Kind:** (e). No gap.
- **Evidence:** `M:src/main.ts:45`, `:111`, `:114`, `:124`, `:132`, `:140`; `M:src/screen/moments.ts:38`; `M:src/new-game.ts:38`; `R:src/match/setup.ts:20`, `:45`.
- **Web today:** It supplies a date-seeded army, example armies, an Ogre exercise, custom back ranks, and older rule presets. Daily results have share text. The plugin setup has pools, arrangement, Classic, cards, and powers; its setup type has no daily seed or old-preset field.
- **Work / dependencies:** S to preserve. SH-11 must keep army choice separate from the new rule flag.
- **Risks:** Replacing web setup wholesale with plugin setup loses these routes. A date-based army is not the plugin's “daily” move deadline. Do not treat those as the same feature.
- **Owner taste call:** No to preserve. Removing or changing a mode needs approval.

### SH-21 — Two people on one device and manual handover

- **Kind:** (e). No gap.
- **Evidence:** `M:src/new-game.ts:27`, `:55`; `M:src/turn.ts:55`; `M:src/screen/play.ts:160`, `:168`, `:662`; `R:src/plugin/screens/board.ts:77`.
- **Web today:** Both sides can be human. End turn hands the device to the other side. Undo and turn words use the active side. The plugin board selects computer or link mode from a server game kind; it has no device mode.
- **Work / dependencies:** S to preserve. SH-04 words, SH-07 input, SH-13 notes, and SH-16 drag rules must respect both players.
- **Risks:** A fixed “my seat” copied from the plugin can disable every second turn. A beginner note must not call the next local player the enemy of a fixed account.
- **Owner taste call:** No to preserve.

### SH-22 — Local saved game, offline continuation, and game links

- **Kind:** (e). No gap in existing King Down modes.
- **Evidence:** `M:src/screen/save.ts:19`, `:22`, `:31`; `M:src/screen/play.ts:707`, `:728`; `M:src/main.ts:152`, `:180`, `:196`; `M:src/screen/links.ts:13`, `:51`; `R:src/plugin/screens/board.ts:78`, `:199`.
- **Web today:** One local game restores from rules, start state, and move list. Optional account loading can fail without blocking local play. A friend can receive the game through a URL. The plugin's local widget draft depends on a server game; it is not a full offline game save.
- **Work / dependencies:** S to preserve existing behavior. SH-17 is the new-mode gap. Settings added by SH-12 must respect the existing settings split.
- **Risks:** A tool call or server read must not become a requirement for local moves. Do not discard local state when optional account loading fails. A first visit still needs assets; this item makes no claim that a new device can start without a connection.
- **Owner taste call:** No to preserve.

### SH-23 — History review, move replay, and committed-move undo

- **Kind:** (e). No gap.
- **Evidence:** `M:src/screen/play.ts:127`, `:132`, `:577`, `:605`; `M:src/game.ts:77`; `M:src/screen/keys.ts:42`, `:50`, `:74`; `R:src/plugin/screens/board.ts:188`.
- **Web today:** It reviews a chosen history position, replays moves, steps by key, and can take back local game moves under its turn rules. The plugin Undo only pops an unsent draft step. Those operations are not equivalent.
- **Work / dependencies:** S to preserve. SH-09 changes motion underneath replay. SH-11 and SH-17 require both pieces of a castle to restore correctly. SH-12 adds another display mode to review.
- **Risks:** Do not replace the local turn core with the plugin draft model. Preserve cursor reads and live-game return. Rook animation and symbols during reverse playback remain unverified.
- **Owner taste call:** No to preserve.

### SH-24 — Web settings and existing threat marks

- **Kind:** (e). No gap for existing settings or Show threats.
- **Evidence:** `M:src/screen/settings.ts:10`, `:24`, `:33`, `:45`, `:47`, `:61`; `M:src/screen/play.ts:233`; `M:src/screen/save.ts:16`; `R:src/plugin/client.ts:9`; `R:src/plugin/board-view.ts:19`.
- **Web today:** Sound, auto-queen, coordinates, pace, piece letters, threats, and computer skill already exist and save. Threats come from the shared threat list. The plugin board settings type has symbols-only and threats; it sets its board pace itself.
- **Work / dependencies:** S to preserve. SH-08 and SH-09 change display under existing switches. SH-12 is a distinct new option.
- **Risks:** Copying plugin settings can remove web controls or force Fast/Off over a saved pace. Do not count Show threats as a new web feature. Keep settings field lists in agreement when adding one.
- **Owner taste call:** No to preserve. New settings and default choices need approval.

### SH-25 — Piece guide, range reads, legend, and keyboard input

- **Kind:** (e). No gap for these shared basics.
- **Evidence:** `M:src/ui/guide.ts:31`, `:62`, `:75`; `M:src/screen/play.ts:219`, `:224`, `:231`, `:265`; `M:src/marks-model.ts:5`, `:59`; `M:src/screen/keys.ts:39`, `:58`, `:74`; `R:src/plugin/screens/board.ts:5`, `:6`, `:349`.
- **Web today:** It reads piece rules, previews reach and moves, draws rails and check causes, and accepts keyboard play. The plugin already imports much of this code. Its use is not evidence of a missing web legend.
- **Work / dependencies:** S to preserve. SH-04 changes words. SH-08 changes edge labels. SH-12 supplies a new preview image path. SH-17 can add a new move-selection case.
- **Risks:** Keep the standard ghost path when symbols are off. Keep board cursor reads and full move descriptions when adding compact text. No replacement of the marks or guide system is necessary.
- **Owner taste call:** No to preserve. New titles or a different move row need approval.

## Open questions for the owner

1. **How does Classic enter the web?** Options: (1) add an explicit chess-rules option; (2) change the current classic army choice; (3) leave the capability off. **Pick: 1.** Keep old games and links under their old rules. On yes, plan SH-11 and SH-17 together. Pick one-step en-passant selection from the plugin. Show a rendered sample before any new rook motion.
2. **Does the web get Symbols only?** Options: (1) add it beside Piece letters; (2) keep painted figures only. **Pick: 1.** Include a design/token symbol and preserve the saved pace choice. On yes, plan SH-12 and a sample for symbols, preview marks, and a custom design.
3. **Does Beginner get short move notes?** Options: (1) one note per enemy fairy action kind per game; (2) piece reads and lessons only. **Pick: 1.** On yes, connect SH-13 to local history and keep full lessons.
4. **Can a web board gesture scroll the page?** Options: (1) vertical scroll except during a valid piece drag; (2) keep the current canvas scroll block. **Pick: 1.** On yes, plan SH-16 with the local drag guard and later phone gesture checks.
5. **Which new text does the web use?** Options: (1) shared “Select” instructions and full pawn movement, with current titles and move row; (2) also add short move text and side-plus-piece titles. **Pick: 1.** Keep the branch's lower-case web read. Use the new card labels and costs when web card setup is planned. On yes, accept SH-04 for the web and keep SH-14 as a later display choice. Review SH-15 labels with the card setup sample.
6. **How does the compact board use limited space?** Options: (1) accept the growing context row and capped/hidden edge labels; (2) retain fixed context height and revise the label rule. **Pick: 1, subject to a web sample.** On yes, use SH-05 and SH-08 as the proposed base. Check short portrait, zoom, board size, and bottom controls before approval of the build.
7. **Does the web use the new quiet motion?** Options: (1) keep the reduced-motion slide/fade and five-second passive effect limit; (2) keep the reduced-motion repair but retain continuous passive effects when motion is on. **Pick: 1.** On yes, include SH-09 in the web sample and compare normal, reduced, and Off. No measured power-saving claim forms part of this choice.
