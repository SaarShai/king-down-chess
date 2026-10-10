# Ponytail review of the web redesign build

Date: 2026-10-09. Reviewer: an independent agent, with the Ponytail rules at full strength (do less, reuse what exists, use native browser features, cut what nobody asked for).

Sources: the build spec (`docs/specs/web-redesign/spec.md` on main), its 27 tickets (`docs/specs/web-redesign/issues/`), the owner's words (spec §1.1), the deck text (`showcase/deck-data.js`), the demos (`showcase/demos/`), `src/main.ts`, `src/render/`, `docs/2d-first-pieces/board/scene.d.mts`, `src/workshop/dialog.ts`, the check registry (`tools/lib/registry.mjs`) and AGENTS.md. Ticket 00 is merged. Ticket 01 is built and waits for its pull request.

## 1. The short answer

- **27 tickets become 13 pull requests.** Keep 3, simplify 12, merge 8 into other pull requests, cut 4.
- **New time: about 27 agent-hours. With four worktrees in parallel, about 10 hours of clock time**, plus the owner's time to look at three sample batches. The old estimate was about 2 days.
- **Most of the time goes to the process, not to the code.** Ticket 00 and ticket 01 each took about 2 hours. The build part of each was less than one hour. Three critics, a fixer, full test runs before and after each fix, three repeat runs, samples at up to 5 sizes in light and dark, and a separate sample agent and a PR agent took the rest.
- **The app already has much of what the tickets ask for.** The scene plays a move at any speed (`play(move, { speed })`) and lays a king down (`setFallen`). The refusal words exist (`whyNot`). The piece words read the rules in force (`pieceGuide`). The lesson hint exists (`hintMoves` with the lesson goal). The Workshop already draws a piece card with the move and take grids. The demos use the real engine, so their logic (`reachOf`, `trickOf`, the coin CSS, the table CSS) copies across.
- **One item needs the owner's yes before the cut:** the second look (ticket 20). Section 6 lists it, and the simpler forms that the owner sees at the samples.

## 2. Ticket by ticket

Verdicts: **KEEP** (no change), **SIMPLIFY** (cut parts, keep its own pull request or host a merge), **MERGE** (cut parts, build inside another unit's pull request), **CUT** (do not build now). Every merged ticket is also simplified. "W" numbers are the work units of §5.

| Ticket | Verdict | Unit | The main cut |
|---|---|---|---|
| 00 Check helpers | KEEP (done) | – | – |
| 01 Quiet Table look | KEEP (finish) | W0 | No more review rounds |
| 02a No Hint | MERGE | W1 | – (Show me = today's Hint handler in the lesson bar) |
| 02b Turn button | SIMPLIFY | W1 | Save field, `?turn=auto`, ready pulse, 4 s line, 17 of 25 check cases |
| 02c Send your turn | MERGE | W1 | First send as the press (D5), resignation links (D16) |
| 03 The table | SIMPLIFY | W2 | Interim power action, desktop fold, 4 of 7 sizes, 6 of 11 sample states |
| 04 Tap to read | SIMPLIFY | W4 | New word module, frozen attack squares, 4 of 6 reading shapes, the tip |
| 05 Menu and Extra | MERGE | W2 | Live previews, Vibration |
| 06 New game sheet | SIMPLIFY | W7 | A new king picker layout |
| 07 Cause lines | SIMPLIFY | W5 | Sounds in one key, shot lines, motion timing, video |
| 08 Verb marks | MERGE | W4 | The Beast slide during a chain, key line, hover sentences, Leap coin |
| 09 Refusal and choice | CUT | (W4: words only) | Refusal marks, nudge, Take or Shove in the line |
| 10 Power coin | SIMPLIFY | W3 | Cast motion, coin flip |
| 11 Move story | MERGE | W2 | `storyLine`, verb badges, the ◀ ▶ header, a new check |
| 12 Undo rewind | MERGE | W6 | `rewindPlan` for each move kind |
| 13 The tell | MERGE | W6 | Search before the press (D15), `tellPlan`, portrait breath |
| 14 Ceremony | SIMPLIFY | W6 | Result pane layout, spotlight, plan and timing modules |
| 15 Muster | CUT | – | All (agent addition) |
| 16 First visit | MERGE | W8 | Light and dark sample |
| 17 Home | SIMPLIFY | W8 | Replay on open, fold motion, 3 of 5 sizes |
| 18 Lesson shelf | SIMPLIFY | W9 | Board lists, four Guard boards, a new lesson screen |
| 19 Tricks | SIMPLIFY | W10 | Account sync of seals, stamp-and-fly motion |
| 20 Second look | CUT (owner's yes) | – | All |
| 21 Previously | SIMPLIFY | W11 | Open-link sheet, resignation line, video |
| 22 Workshop card | SIMPLIFY | W12 | A new card renderer (reuse the editor's card) |
| 23 Retry | CUT | – | All (agent addition) |
| 24 Card coins | KEEP (blocked) | – | No work; it waits for the card deal |

### 00 · Check helpers — KEEP (done)

No action. The helpers pay for themselves: later units change helper bodies, not assertion lines.

### 01 · The Quiet Table look — KEEP, finish now (W0)

- The build, the three reviews and the sample fixes are done (branch `claude/wr-01-quiet-table`, f3eb28e).
- Remaining: the owner's yes on the renders that exist, the message to the plugin session, the pull request. No new review round.
- Put the two open questions (Spirit and Frost effects on the light title; the floor on the Workshop page) in sample batch 1. Pick for both: no change.
- Cut: the Android forced-dark test (Risks, item 1). No device is at hand, and `color-scheme: only light` is the standard opt-out.

### 02a · No Hint — MERGE into W1

- Keep Plan 1, 3, 4. Plan 3 is small: today's `#hint` handler (now the Show me handler, `screen/play.ts:connectPlay`) already marks a lesson's goal move through `hintMoves` with the lesson goal. Move the button into the lesson controls and rename it "Show me".
- Verification: one case in the W1 check (no `#hint` on the game screen; Show me marks the goal in a lesson). The lesson state joins the W1 sample.

### 02b · The turn button — SIMPLIFY (W1, host)

This is the core of the owner's turn rule. Keep its logic; cut the extras around it.

Cut:
- **Plan 5:** the ready pulse and the line "The computer waits for End turn." after 4 s in the first three games (spec §4.1). Agent additions. Keep the colour change (CSS on `aria-disabled`).
- **Plan 12:** the `staged` save field, its account sync, and the restore checks (spec §4.8). New rule: a reload hands a staged turn over, as today. See §6, item Y2.
- **Plan 13:** keep only the accessibility basics: the focus goes to End turn when the turn waits, Enter presses it, and the focus goes back to the board after the press. Cut the new key scope for Z and R (the keys work as today).
- **Plan 15:** `?turn=auto`. Every check presses the real button through `endTurn(page)` (ticket 00 made it). An app switch for checks is a second code path to keep true.
- **Verification, the `turn` check:** about 25 cases become 8: (1) the computer waits for the press; (2) Undo takes back one ply and stops at the turn start; (3) Undo is off after the press; (4) a Haste first move and a press record `--`, and `#end-haste` is gone; (5) a free Freeze, a move, a press; (6) a staged mate ends on the press, and Undo before the press removes it; (7) Resign during a staged turn; (8) on one device, the next side cannot move before the press. Edge cases with logic go into `src/turn.test.ts` (fast, no browser). Drop: Ice Wall (same path as Freeze), promotion cancel and the Beast chain (today's code, not changed), staged stalemate and repetition (same path as mate), reload, Return to game, account change, the keyboard run, the ready cue.
- **Verification, the compare of main and the branch:** cut. The sample shows the new rule.
- **Sample:** 10 states become 4: End turn off; the turn ready; Haste mid-turn; a staged mate. Phone and desktop.

Keep: Plans 1, 2 (with the fix for an old link that ends mid-turn: without it, such a link opens a game that nobody can move), 3, 4, 6, 7, 8, 9, 10, 11, 14, 16. Keep the unit tests of Verification items 1, 2 and 4.

### 02c · Send your turn — MERGE into W1

- Cut **Plan 7** (D5, the first send is the press). The first send stays as today: End turn, then "Send the game link". From the first link of the friend, the press is "Send your turn". This saves the side-lock logic for one move per game.
- Cut **Plan 9** (D16, the `resign` field and "Send the result"). Agent addition. Defer.
- Keep Plans 1–6 and 8. Keep the guards (`busy`, `gen`) and "commit only after a send that succeeds": they stop a lost turn.
- Verification: 11 link cases become 4: a cancelled share keeps the staged turn; a success hands the turn over and Undo goes off; a double press sends once; a mid-Haste send holds the pass. Sample: 5 states become 2 ("Send your turn", "Send again").

### 03 · The table — SIMPLIFY (W2, host)

- **Plan 3:** cut the interim power action in the context line. Move today's power button (`#powers`) into your strip as it is. W3 replaces it with the coin. The interim code would live for one step and then go (ticket 10, Plan 7).
- **Plan 2:** keep the sizes (the owner's layout). Start from the proto's working CSS grid (`demos/proto/proto.css` 118–231 and 322–347). Use `dvh`, `min()` and one media query for two columns. No sizing in JavaScript.
- **Plan 4:** `src/context-line.ts` is one ordered `if` chain of the ranks that exist now. Its test covers 4 pairs that can collide (check and a staged turn; a read and a mid-way turn; a refusal and a waiting turn; the result and anything), not every pair.
- **Plan 6:** the open Moves list is one native `<dialog>` sheet on every size (the proto's `#sheet-moves`). Cut the second form ("a fold in the column on desktop"). The board does not move in either case.
- **Verification, `game-screen`:** 7 sizes become 3 (390×844 touch, 844×390 touch, 1440×900). The "board does not move" states: 10 become 5 (rest, selected, staged turn, check, Moves list open). Keep 44 px targets, no sideways scroll, one crimson control, square size at 390×844.
- **Sample:** 5 sizes × 11 states become 3 sizes × 5 states, with one before-and-after pair at phone size.
- Merge 05 and part of 11 into this unit.

### 04 · Tap to read — SIMPLIFY (W4, host with 08)

- **Plan 1:** no new `read-text.ts`. The read line is the piece name and the first sentence of today's `pieceGuide(t)` (`read.ts:pieceGuide`), which already reads the rules in force, then "All rules". Add two state words from the position marks ("Frozen", "Ice Wall"). The context line clamps to two lines.
- **Plan 2:** copy `reachOf` from `demos/feat-hold-to-read/read.js` 86–101. It uses the real engine's legal moves. Cut the attack squares of a frozen piece (`attacksOf` probes each square with a dummy knight; complex for a rare case).
- **Plan 4:** six new reading shapes become two: an outline ring on each reached square (crimson for a take), and today's shot sight. An outline differs in shape from the filled move marks, so the rule "shape, not colour alone" holds.
- **Plan 8:** cut the first-read tip and its stored flag.
- Keep Plans 3, 5, 6, 7 (the I key gives keyboard access), 9.
- Verification: `read.test.ts` for each piece type under the rules in force only (see rule 11 in §3). The `read-piece` check: 6 cases become 3 (an enemy read shows the reach; your own piece shows only legal marks; a read keeps the selection). Sample: 5 states become 3.

### 05 · Menu and Extra — MERGE into W2

- **Plan 4:** cut the live previews (a second small board, cropped to three squares). The four switches move into Board help as they are.
- **Plan 7:** cut Vibration and `src/haptic.ts`. No owner choice asks for vibration, and iOS has none. This also removes the haptic parts of tickets 07 and 09.
- **Plans 2 and 3:** one native `<dialog>` with pages, as the demo does (`feat-menu-extra/menu.js`, navigation 359–410). The dialog gives Esc and the focus return. Keep "close the Menu first, then open the next dialog".
- Keep Plans 1, 5 (with the static Coming row), 6, 8, 9.
- Verification: `menu-extra` check with the rows, back and close, Resign asks in the sheet, one Board help switch changes the board, Look and Reset view work. Sample: 6 states become 4.

### 06 · New game sheet — SIMPLIFY (W7)

- **Plan 4:** keep today's king picker in `src/new-game.ts` as it is, inside the sheet. Cut the new layout ("your picker open, the other king as one row with Change"). The owner's option text asks for "three modes, the level in view, Side and Army in one row, Start in a fixed footer"; the picker is not part of it.
- Keep Plans 1, 2, 3, 5, 6 (the warn line in place of `confirm()`), 7.
- Verification: the warn line test; Start in view at 390×844 and 844×390. Sample: phone and desktop.
- It does not need the Menu. Today's New game button opens the same dialog. It can start early (§5).

### 07 · Check shows its cause — SIMPLIFY (W5)

- Keep **Plan 1** `checkersOf` and its random-game test against `inCheck` under the powers rules. This test stops a line that points at no checker.
- **Plan 2:** a still ember ring (recolour today's red ellipse) and a still thin line from each checker to the king, drawn when the move lands. Cut the bloom, the draw-on, and the timing module with its Node test.
- Keep **Plan 4** (the cause words) and **Plan 5** (the check note moves to the landing; one low note). Cut its vibration pulse.
- Cut **Plan 3** (shot lines for takes with no contact). It comes from the demo, not the owner's words.
- Cut **Plan 6** (all sounds in one key). It comes from a path step, not §1.1. It puts the character of every sound at risk and needs a video review.
- Verification: the `their-turn` check, 5 cases become 3 (the ring and lines after a check lands; a staged check shows the staged words; Undo clears them). Sample: 3 stills (an Archer check over pieces, a knight check, a double check). No video.

### 08 · Verb marks — MERGE into W4

- Keep **Plan 1** (the marks model, pure), **Plan 2** (the shove arrow; cut the see-through copy on hover), **Plan 4** (bite numbers on the bitten squares; the chain still collects taps as today), **Plan 8**.
- Cut **Plan 3**, the Beast slide during a chain (`chainPreview` and a second "shown board" that every reader of the board must use). The ticket's own risk list names this risk. The owner's option text asks for "a number for each bite", not a slide.
- Cut **Plan 5** (the Leap coin mark; the move text keeps "Leap"), **Plan 6** (the key line), **Plan 7** (target sentences on hover), and the bite timing module.
- Add the refusal words of ticket 09 to today's `whyNot` (`read.ts:whyNot`): "Only a king can take a guard.", and one line each for Ice Wall, Holy Light and Mercy.
- Verification: `marks-model.test.ts` (Ogre, Beast, Maester, Archer under the rules in force). The `verb-marks` check: the marks for 3 fixed positions, and a tap on a landing plays the shove. Sample: 4 states.

### 09 · Refusal and Take or Shove — CUT

- Plan 1 (the words) moves to W4: a few strings in today's `whyNot`.
- Cut Plan 2 (shield marks, the 260 ms nudge, the pulse), Plan 3 (keep a power armed after a wrong tap), Plan 4 (`scene.nudge`), Plan 5 (Take or Shove in the context line, D12 b). Today's `#move-choice` dialog (`screen/play.ts:choosePushOrCapture`) asks the same question and works. The move from a dialog into the line is an advisor's change, not the owner's.

### 10 · The power coin — SIMPLIFY (W3)

- Keep Plans 1, 2, 3, 4, 7. Copy the coin CSS from `demos/feat-king-powers/demo.css` 86–95 (the coin, the emblem, the diamond notches).
- Cut **Plan 5** (the 250–350 ms cast motion and its timing module). The move plays as today.
- Cut **Plan 6** (their coin flips). Today's moment line names their power on that move.
- `coinState` test: ready, armed, used, always on, no power (not every power in every state). The `powers` check: 5 cases (a tap reads; Use arms; freeze; "Used on move N"; an always-on coin only reads). Sample: 8 states become 4.

### 11 · The move story — MERGE (small part) into W2

- In W2: the Moves line shows the last move's piece icon and today's `describeMove` sentence; each row of the open list gets its piece icon; review gets a "Back to game" button.
- Cut **Plan 1** `storyLine` (a second sentence maker with its own voice), **Plan 2** the verb badge, **Plan 4** the ◀ ▶ header (the arrow keys already step through review), and the new `move-story` check (today's review checks and `lanMoves` cover it).

### 12 · Undo plays backward — MERGE into W6

- Cut **Plan 1** `rewindPlan` (a track for each move kind) and its Node tests.
- In its place, `animateBack` in `PaintedView`: play the reverse scene move with today's `scene.play` (`{ from: to, to: from }`; a swap is its own reverse; for a shove, the mover goes back), then `sync(pre)`. A taken piece and a mark come back at the end of the slide. Any other move kind (pass, Sacrifice, promotion) syncs at once.
- Keep Plans 2, 3, 4, 5.
- Verification: two cases in the `turn` check (Undo after a capture brings the piece back; no animation runs after it). The W6 video shows it.

### 13 · The tell — MERGE into W6

- Cut **Plans 1 and 2** (D15, the search before the press). Today the computer searches after your move. With End turn, it searches after the press. The wait is the same as today: 0.7 to 0.8 s at Beginner, Casual and Club, 2.5 s at Strong (`src/ai/skill.ts`). This cut also removes the engine-sharing risk (Risks, item 2) and the basis of ticket 20.
- **Plan 3:** a fixed lift of 3 px for 200 ms before the computer's move. One opt-in `setLifted(square)` in `scene.mjs` (the plugin page does not change). Cut `tellPlan` and its timing math.
- Cut **Plan 4** (the king lifts for a move with no moving piece; no tell then) and **Plan 5** (the portrait breath and ring; "thinking…" after 1 s comes from W2).
- Keep Plans 6, 7. Verification: one case in the `turn` check (the lift is set before the reply plays).

### 14 · The Ceremony — SIMPLIFY (W6, host)

- Keep the owner's four beats, built from parts that exist:
  - the final blow again at half speed: `scene.play(move, { speed: 0.5 })` exists; pass the speed through `animateMove`;
  - the king falls: `setFallen(square, true)` exists (`ceremony.ts:startCeremony`, `game-end.ts:connectGameEnd`);
  - "King Down" settles in: CSS, copied from `demos/feat-king-down/end.css`;
  - three tiles rise: three buttons that open review at their ply through today's `showPly`.
- **Plan 1:** cut the result pane and the phone exception to rule 9. The ceremony plays on the board, then today's `#over` dialog opens with the tiles in it.
- **Plan 3 and 4:** cut the spotlight (`setSpotlight`, other figures at 45 %) and the cause line inside the sequence. Keep the rule for the final blow (skip a trailing pass).
- Cut the pure `ceremonyPlan` and timing modules. One small function picks the games (D8: your win, any mate on one device).
- Keep Plans 2, 5, 6 (a tap, Esc, Space or Enter skips; reduced motion shows the end frame), 7, 8, 9, 10.
- Verification: the `end` check, 13 cases become 5 (the king falls once; three tiles; a tile opens review; a skip key jumps to the end; a loss is quiet). Sample: one phone video of an Archer mate, and 2 stills.

### 15 · The muster and first sight — CUT

The owner chose "A, One short sheet". The muster is in the deck's note under that feature, and the first-sight tags come from the Coach direction. Both are agent additions. About 2.5 hours and two shared-scene changes. Section 6 says how to bring it back.

### 16 · First visit — MERGE into W8

- Keep Plans 1–5. They are small and the owner chose them.
- Verification: the seed test (`FIRST_DEAL` equals seed 83 of the real draw), and two `visual-design` cases (a first visit shows one Start; Start deals `QRNAKBBS`). Cut the light-and-dark sample: ticket 01 shows the two schemes are equal.

### 17 · Home is the table — SIMPLIFY (W8, host)

- Cut **Plan 4** (the last turn plays once on open) and the 120 ms fold in **Plan 5** (Continue hides Home at once; the board does not move).
- **Plan 2:** the last-move line uses `describeMove` (no `storyLine`).
- Keep Plans 1, 3, 5 (without the fold), 6, 7, 8.
- Verification: the `home` check, 9 cases become 5 (Home with a save; the computer waits; Continue keeps the board in place; a staged turn shows "Your turn is ready"; a link never shows Home). Sample: 5 sizes become 2; 5 states become 3.

### 18 · The lesson shelf — SIMPLIFY (W9)

- Keep **Plan 3** (the shelf of six figures with Learned and Next), Plans 5, 6, 7.
- Cut **Plan 1** (lessons as lists of boards, and the Guard's four boards). The owner chose "A, Piece shelf". "Four small boards" is the deck's title and note for the feature.
- Cut **Plan 2** (the Archer lesson for each Archer reading). The far2 reading is not on main. Its branch updates the lesson when it merges.
- Cut **Plan 4** (a new lesson screen). Keep today's lesson controls with Show me (W1). A short "<Piece> learned" line in the context line replaces the card.
- Verification: the `lessons` check, 6 cases become 3 (the shelf opens; a figure opens its lesson; Learned follows the store). Sample: the shelf.

### 19 · Tricks — SIMPLIFY (W10)

- Keep **Plan 1**: copy `TRICKS` and `trickOf` from `demos/feat-menu-extra/menu.js` 29–58; test each detector against one near miss.
- Keep **Plan 2**: give the seal in W1's press handler. This also gives "only after a send that succeeds" in a link game.
- Keep **Plan 5** and the one gold dot on the Menu button.
- Cut **Plan 3**'s account sync (store the seals in their own key on the device; add sync when the owner asks). This removes the change to `sync.ts` and to `noteLesson`, and the need for ticket 18 first.
- Cut **Plan 4**'s stamp and flight motion.
- Verification: `tricks.test.ts`; two cases in `menu-extra` (a scripted bite chain and a press give a seal and the dot; Undo before the press gives none). Sample: the Tricks page and the dot.

### 20 · The second look — CUT (needs the owner's yes)

§1.1 lists it among "the other picks: ours, for now". It is off by default, so few players see it. It needs the search before the press (cut in 13) and a score baseline from the engine, with a risk of false alarms. About 2 hours. See §6, item Y1.

### 21 · Previously — SIMPLIFY (W11)

- Keep Plans 1, 2, 3 (with `describeMove`), 4 (Motion Off: no replay, the same line), 8.
- Cut **Plan 6** (an open-link sheet in place of `confirm()`), the resignation line of **Plan 5** (D16 is cut), the `alert()` change in **Plan 4**, and **Plan 7** (W1 holds the link words).
- Verification: the `link-game` check, 6 cases become 3 (the friend's turn plays once and the line shows; See again plays it again; Undo cannot take the friend's ply). Sample: one phone still. No video.

### 22 · The Workshop card — SIMPLIFY (W12)

- **Plan 1:** reuse the editor's piece card (`.ws-piece-card`: portrait, name, worth, and the move and take grids; `src/workshop/dialog.ts` 281–414) in a read-only form. No new card renderer.
- Keep Plans 2, 3, 4 (mini cards: figure, name, worth word), 5.
- Verification: the `workshop` check (the Share sheet shows the card; a design link opens it read only; the band word fits at 320×568). Sizes: 5 become 3 (320×568, 390×844, 1440×900).
- It needs no other ticket. Start it now.

### 23 · Retry after a loss — CUT

Decision D13 is an agent pick. The owner's words describe the Ceremony's four beats; Retry is in the deck's note and in a path step. About 1.5 hours, and a second use of the one engine worker after the end.

### 24 · Card coins — KEEP (blocked)

No work in this plan. It waits for the card deal and an engine rule. W3 builds the coin row so that card coins can join it.

## 3. The process

| Today, for each ticket | New | Why quality stays |
|---|---|---|
| One build agent for each of 26 tickets | One build agent for each of 13 units | Fewer, larger units; each still has one owner sample and one merge gate |
| Three critics (fidelity, correctness, tests), then a fixer agent | One reviewer, only for W1 (turn rules), W2 (layout) and W6 (moments). The builder fixes the findings. Other units: the builder checks its diff against its cut list and the owner's words | The risky logic gets a second look; the pure-module tests and the browser checks guard the rest; the owner looks at every visual unit |
| Two outside advisors on the turn button (about 1 hour) | None | Two advisors and three critics already reviewed the turn rules in the spec (§7, Review record) |
| Full `npm run check:browser` before and after the fixes | Named checks during the build; the full suite **once**, at the end of the unit | Main is green at each merge, so a "before" run on main proves nothing new |
| Each new check 3 times, again after each fix round | Each new check 2 times, once, at the end | A flaky check still shows in 2 runs; the full suite also runs it |
| Samples at 2 to 5 sizes, before and after, light and dark, by a separate sample agent that fixes visual faults | The builder runs `SAMPLE=NN`: phone 390×844 and desktop 1440×900. W2 adds 844×390 and one before-and-after pair. One video, for W6 only | The tool's own fault checks (44 px targets, no sideways scroll, controls in view) find the faults; ticket 01 showed light and dark are equal |
| A PR agent pushes and opens a stacked PR | The builder runs `gh pr create` | One command |
| One owner sample review for each ticket | Three sample batches (§5): one page with every still and the video, phone and desktop side by side; one yes or no for each unit | AGENTS.md still holds: a visual unit merges only after the owner's yes. Work goes on while a batch waits |
| Long build notes and review records in each ticket (ticket 00: about 60 lines) | At most 10 lines: what changed, what was cut, the check results, the owner's yes | The commits and the pull request hold the detail |

Spec rules (§2) to change:

- **Rule 3 (sample sizes):** phone and desktop; landscape only for W2.
- **Rule 4 (three runs):** two runs, once, at the end.
- **Rule 6 (compare main and the branch):** the sample is the compare.
- **Rule 8 (a pure motion module and a Node test for each motion):** only where the logic branches (`turn.ts`, `checkersOf`, `coinState`, the marks model, `reachOf`, the trick detectors). A constant duration needs no module and no test.
- **Rule 11 (one test for each Archer reading):** test the reading in force only. The far2 branch is not merged. When it merges, it updates the texts and tests that it changes.

Rules to keep: rule 2 (no button whose destination comes later), rule 5 (the plugin page: the default stays, `plugin-ui` runs when a shared module changes, record the size), rule 7 (the `Removed-check:` trailers; the hook enforces them and they cost little), rule 9 (the table never moves, 44 px targets, `aria-disabled`), rule 10 (words).

Note on parallel work: `npm run check:browser` takes one lock for all worktrees ("One run at a time in all worktrees", `tools/check.mjs`). Four lanes can share it because each unit runs the full suite once. If the lock queue grows, a lane can run in a cloud session (AGENTS.md: cloud sessions install Playwright Chromium).

## 4. Better ways: what exists already

| Need | Use this | Instead of |
|---|---|---|
| Half-speed replay of the final blow | `scene.play(move, { speed: 0.5 })` (`scene.d.mts`) | A new timing module |
| The king falls | `setFallen(square, true)` (`ceremony.ts:startCeremony`) | A new fall in the result dialog |
| Undo plays backward | The reverse scene move through `scene.play`, then `sync(pre)` | `rewindPlan` with a track for each move kind |
| Reading words | `pieceGuide(t)` (`read.ts:pieceGuide`; reads the rules in force) | A new `read-text.ts` |
| Reach of a piece | `reachOf` from `feat-hold-to-read/read.js` 86–101 (the real engine) | A new design |
| Refusal words | Today's `whyNot` (`read.ts:whyNot`) | A new `why-not.ts` module |
| Take or Shove | Today's `#move-choice` dialog (`screen/play.ts:choosePushOrCapture`) | A choice in the context line |
| Show me in lessons | Today's `#hint` handler with `hintMoves` and the lesson goal | New code |
| Stop here | Today's `#stop-chain` button | New code |
| Moves line words | Today's `describeMove` (plugin-shared, tested) | `storyLine` |
| Tricks | `TRICKS` and `trickOf` from `feat-menu-extra/menu.js` 29–58 | New detectors |
| The coin | CSS from `feat-king-powers/demo.css` 86–95 | New styles |
| The game grid | `proto/proto.css` 118–231, 322–347 | A new layout from zero |
| "King Down" text | `feat-king-down/end.css` | New styles |
| Workshop card | The editor's `.ws-piece-card` with its move and take grids | A new card renderer |
| Menu pages, Moves sheet, Resign question | Native `<dialog>` (Esc, focus return, top layer) | Custom sheets and `window.confirm` |
| End turn ready look | CSS on `[aria-disabled]` | A JavaScript pulse |
| Phone and desktop sizes | CSS grid, `dvh`, `min()`, one media query | Sizes computed in JavaScript |
| A fast reply after the press | Nothing: the wait equals today's wait after a move | A search before the press |

## 5. The new plan

### 5.1 Work units

Each unit is one pull request. Hours are for one agent with the new process: build, one full suite, the sample, the pull request.

| Unit | Contents (tickets) | Needs | Hours | Lane |
|---|---|---|---|---|
| W0 | Finish the Quiet Table look (01) | – | 0.25 | A |
| W1 | The turn button in every mode: No Hint, End turn, Undo before the press, Send your turn (02a, 02b, 02c) | W0 | 4 | A |
| W2 | The table and the Menu: strips, bar, context line, one Moves line with icons, the Menu sheet, Board help, Extra (03, 05, part of 11) | builds beside W1; rebases on W1 before its checks | 4.5 | B |
| W12 | The Workshop card (22) | – | 1.5 | C |
| W7 | The New game sheet (06) | rebase on W1 (`ended()`) | 1.25 | C |
| W3 | The power coin (10) | W2 | 1.5 | C |
| W4 | Read and verb marks: tap to read, shove arrows, bite numbers, refusal words (04, 08, words of 09) | W2 | 3 | A |
| W5 | Check shows its cause (07) | W2 | 1.25 | A |
| W6 | The moments: rewind, the tell, the Ceremony (12, 13, 14) | W1, W2 | 3.5 | B |
| W8 | Arrive: first visit and Home (16, 17) | W2, W7 | 2.5 | D |
| W9 | The lesson shelf (18) | W1, W2 | 1.25 | D |
| W10 | Tricks (19) | W1, W2 | 1.5 | C |
| W11 | Previously (21) | W1, W2 | 1.25 | B |
| | **Total** | | **about 27** | |

### 5.2 Lanes (separate worktrees)

- **Lane A:** W0 → W1 → (W2 lands at about hour 5) → W4 → W5. Ends at about hour 9.25.
- **Lane B:** W2 (starts at once, beside W1; rebases on W1 at the end) → W6 → W11. Ends at about hour 9.75.
- **Lane C:** W12 → W7 → (wait for W2) → W3 → W10. Ends at about hour 8.
- **Lane D:** (wait for W2 and W7) → W8 → W9. Ends at about hour 8.75.

Clock time: about **10 hours** from now to the last pull request, plus the owner's sample time. One agent alone needs about 27 hours.

All units change `src/main.ts`. Each unit keeps its `main.ts` change to call lines and rebases on main (or on the unit it stacks on) before its full suite. Units that wait for the owner's yes stay open as stacked pull requests, and the lanes go on.

### 5.3 Owner sample batches

1. **Now:** W0 (the renders of ticket 01 exist) and its two questions.
2. **At about hour 5:** W1 (turn button), W2 (table and Menu), W12 (Workshop card), W7 (New game sheet).
3. **At about hour 10:** W3, W4, W5, W6 (with the one video), W8, W9, W10, W11.

If the owner asks for a change in batch 2 (for example in the layout), the units that stack on W2 rebase on the fix. This is the one risk of the stack; it costs less than the wait.

### 5.4 What this plan does not cut

Ponytail never cuts these: the `gen` guards (no old result over a new game); "commit only after a send that succeeds" (no lost turn); `aria-disabled`, the focus to End turn and 44 px targets; the default floor and marks of the plugin page; the `Removed-check:` trailers; the fix for an old link that ends mid-turn; the unit tests of every pure module that has logic.

## 6. What needs the owner's yes

### 6.1 A cut of an owner choice (§1.1). Propose; do not cut without a yes

- **Y1. Defer the second look (ticket 20).** §1.1: "The other picks: ours, for now … the second look as an opt-in practice aid". It is off by default, it needs a search before the press and a score baseline, and it can give false alarms. Saves about 2 hours now. Pick: defer. On yes: ticket 20 goes to `needs-info`. On no: add it as W13 after W6 (about 2 hours), with the search before the press (about 1.5 hours more).
- **Y2. A reload counts as the press.** §1.1: "Undo works only before the player presses it." This plan cuts the save of a staged turn (spec §4.8). After a reload, the staged plies are handed over, and Undo cannot take them back. This is today's behaviour and is stricter than the owner's rule, never looser. Saves about 1 hour and a change to the account sync. Pick: yes. On no: add the `staged` save field back to W1.

### 6.2 Owner choices that this plan builds in a simpler form. The owner sees each at its sample; a "no" there brings the part back

- **Undo, a rewind (12):** the pieces slide back; a taken piece comes back at the end of the slide, with no fade of its own.
- **The tell (13):** a fixed 3 px lift for 200 ms; no portrait breath.
- **The Ceremony (14):** the four beats stay; no spotlight; the result shows in today's result window after the beats.
- **Verb marks (08):** arrows, bite numbers, the swap ring and the shot sight stay; the Beast does not slide during a chain.
- **Tap to read (04):** the words come from today's rule text, clamped to two lines; two outline shapes, not six.
- **The coin (10):** no cast motion and no coin flip.
- **Tricks (19):** seals and riddles stay; no stamp-and-fly motion; the seals stay on this device for now.
- **The lesson shelf (18):** each piece keeps its one lesson board.
- **Previously (21):** no open-link sheet; the browser question stays.

### 6.3 Agent additions that this plan defers. No yes is needed; the owner can bring any of them back

- The muster and the first-sight tags (ticket 15, about 2.5 h). Note: the deck's title for the feature was "One sheet, then the muster", but the owner's words name option A, "One short sheet". If the owner reads the title as part of his choice, it comes back as one unit.
- Retry after a loss (ticket 23, D13, about 1.5 h).
- The search before the press (D15).
- A resignation in a link, "Send the result" (D16).
- The first send as the press (D5).
- Take or Shove in the context line, and the refusal marks and nudge (ticket 09, D12 b).
- Vibration, and the live previews of Board help (ticket 05).
- All sounds in one key, and the shot lines for takes (ticket 07).
- The Beast slide during a chain, the key line, the hover sentences and the Leap coin mark (ticket 08).
- The first-read tip (ticket 04).
- The ready pulse and the "computer waits" line after 4 s (ticket 02b).
- Home's replay of the last turn on open, and its fold motion (ticket 17).
- The four Guard boards (ticket 18). The deck's feature title was "Four small boards for one piece"; the owner's words name option A, "Piece shelf".
- The account sync of seals (ticket 19).
- The open-link sheet (ticket 21).
- The tests for each Archer reading (spec rule 11), until the far2 reading merges.

This plan changes the approved spec. The owner's yes to this plan approves the cuts in §2 and §3. Section 6.1 needs its own answers.
