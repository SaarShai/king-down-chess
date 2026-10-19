# GUI faults 2026-10-19: the board screen

Status: in-progress
Type: task

Source: the expert design panel (/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/panel.md) and an independent check of each fault (/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/fault-plan.json). Each part below is a verified FAULT with one right fix. Build only what each part says. Anything the part calls taste or "for Saar" stays out. Saar's look decisions stand (docs/specs/*/spec.md; the painted look only).

Record: copy this ticket to docs/specs/gui-faults-2026-10-19/issues/<this file name> in the repo, and set its Status to done with the check results at the end.

Gallery for the before state: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md). Render compares: use tools/render-compare (see AGENTS.md) where the part asks for one.

### F05

Fix: In src/plugin/screens/board.ts, copy the web keyboard cursor (src/screen/play.ts:72-76 and :262-275): append one aria-hidden #board-marks div to #board, and where the plugin calls board.setPreview(cursor) for the keyboard cursor (board.ts:253 and :410) also place or clear one <i class="mk-cursor"> at board.screenOf(cursor) while cursorShown is true. Remove it when cursorShown is false and redraw it on resize. Keep setPreview for the move preview. The styles in src/style.css:138-144 are already loaded through app.css:1. Do not change #board:focus-visible in src/style.css (a 6 px vellum inset is a new look for Saar), and do not move drawMarks out of src/screen/play.ts.

Files: src/plugin/screens/board.ts

Proof: Browser check in the plugin harness: focus the board, press an arrow key, assert one #board .mk-cursor exists, its box matches screenOf(cursor) within 1 px, and its computed outline or border is 3px rgb(28, 91, 176); after Escape or blur it is gone. Render-compare a light tile before and after.

Web overlap: None in tickets 03-06. Web ticket 14 cites board.ts:251-254 as evidence only; web ticket 09 and 02 change play.ts, so play.ts stays unchanged.

### F06

Fix: In strips() (src/plugin/screens/board.ts:305-316), for your own usable card coins set `b.dataset.state = 'armed'` when mine && armedCard === index && the coin is not spent, else keep 'used' or 'always'; set aria-pressed to 'true' or 'false' on your own usable card coins only (as the power coin does at :300). The existing .coin[data-state='armed'] rule (src/style.css:511: inset 2px ink, 5px gold-bright) then draws the ring, and app.css:132 already leaves it out of the plain ring. The card image at inset 3px covers most of that ring, so add one rule in src/plugin/screens/board.css beside its card-coin img rule (board.css:14): `#game-table .coin.card-coin[data-state='armed'] img { inset: 5px; width: calc(100% - 10px); height: calc(100% - 10px); }`. No new ring, no outer ring (the phone coin gap is 4 px), no change to unarmed coins.

Files: src/plugin/screens/board.ts, src/plugin/screens/board.css

Proof: Browser check in the plugin harness (390x844 dark, card mode): open the Strike read sheet and use it; assert #card-w-<i> has data-state='armed' and aria-pressed='true', the other own coins have aria-pressed='false', and Cancel resets it. Pixel check: the 2-5 px band inside the armed coin is gold-bright. Render-compare against plugin-card-targets-390x844-dark.png.

Web overlap: Web-adaptation ticket 12 Part 2 and inventory B15 port claude/od-board (direct card arming J6, card faces) into the same strips() lines; parked tickets shared-screens-later 10 and 11 change them too. Build F06 before that port or give it to the same writer. Tickets 03-06 do not touch these files.

### F10

Fix: In src/plugin/screens/board.ts, split sound(step) into the hit (capture or move) and the check. In choose() (:182) and in the replay loop (:512-516), make a once-only hit() guarded by the generation token, pass it as the onContact argument of board.animateMove (src/render/PaintedView.ts:19, :146), call hit() again after the await as the fallback (reduced motion, skip, Motion Off, drop), then play the check sound at rest. Copy the pattern of src/screen/play.ts:292-305. Do not add the web's launch sounds (soundsFor / momentKind): that is new sound design for Saar. Sound stays off by default.

Files: src/plugin/screens/board.ts

Proof: Browser check in the plugin harness with Sound On: stub the sound player to log calls with timestamps and stub animateMove's resolve time; assert the capture sound fires before animateMove resolves and exactly once per step, also with reduced motion (fallback path) and after a skip; the check sound fires after rest.

Web overlap: Inventory B12 and the ticket 12 Part 2 od-board port also change board.ts, but not choose() or the replay sound lines. Tickets 03-06 do not touch board.ts.

### F11

Fix: In src/plugin/screens/board.ts, in board.onSquareClick, the drag-select hook and the Escape handler (:214-218), add `if (animating) { board.skip(); return; }` before canRead() or select() runs. The tap only skips; it does not select (as web play.ts:505). Do not change canRead(). choose() needs nothing more: skip resolves animateMove and its .finally() syncs under the token guard. For the replay loop (:512-516) add a local rush flag that the skip sets; when it is set the loop skips animateMove for the remaining steps but still runs board.sync(step.pos) and the hit-sound fallback, then the existing final sync(authoritative), animating=false, refresh() and scheduleComputer(). Do not bump generation. Keep the networkBlocked() locks. Do not change the motion pace (T08 is taste).

Files: src/plugin/screens/board.ts

Proof: Browser check in the plugin harness: start a multi-step computer reply, tap the board during the first step; assert animating becomes false within one frame after the remaining steps, the final position equals the server position, no piece is selected, and the computer schedule still runs. Repeat with Escape. A tap when not animating still selects.

Web overlap: Inventory B12, B14, B29 and the ticket 12 Part 2 od-board port change select() and the Escape handler in board.ts. Tickets 03-06 do not touch board.ts.

### F13

Fix: Center the close mark. The base button (src/style.css:163-166) is display:flex with text-align:left, and these two rules have no justify-content. In src/plugin/screens/board.css:25 change `#board-sheet .sheet-head button` to `width: 44px; min-width: 44px; padding: 0; justify-content: center;`. In src/plugin/screens/seat.css:13 add `justify-content: center;` to `#seat-menu-sheet .sheet-head button`. The page-sheet rule at app.css:203 already centers. Keep the text '×' and '‹ Play' (tools/plugin-ui-check.mjs:1077 asserts the Back text); a new SVG close mark, chevron or gap is taste for Saar.

Files: src/plugin/screens/board.css, src/plugin/screens/seat.css

Proof: Browser check in the plugin harness at 390x844 dark and light: open the board Menu sheet and the seat menu sheet; assert the × glyph's text box center (Range.getBoundingClientRect) is within 1 px of the button center, and the button is 44x44. Render-compare plugin-board-menu-390x844-dark.png.

Web overlap: None; board.css and seat.css are plugin only. Inventory B28 later moves plugin screen CSS; no ticket 03-06 changes them.

## Build plan and checks

Build F05, F06, F10, F11 and F13 in that order. Commit each part with its test.
Use the plugin harness for the proof above. Run the type check and tests.
Run plugin-ui from committed HEAD with the supplied runner. Compare the requested renders.
Do not change the look, sound design, motion pace or shared web screen.

## Results

- F05: the shared cursor mark passes bounds, border, resize, Escape and blur checks. The type check passes. All 129 board tests and 51 artwork tests pass (`/tmp/gui-board-f05-tests-2.txt`). The first run found a blur refresh that removed action buttons before click. Blur now changes only the cursor. The repeat passes. The light-tile render compare reports the expected cursor change: 1,166 pixels exceed threshold 16 (exit 1); images are in `/tmp/gui-board-render/`. The M1 `plugin-ui` check passes at `8b792e42` (271.2 s, runner exit 0). Its log is `checks-f05-2.txt` in the lane folder. The first launch left an empty log and no running PID; the second launch keeps its parent shell until the runner exits.

- F06: use the existing armed state and ring. Own unspent coins expose pressed state. The armed image has a 5 px inset. The first board run passes 129 tests; only the exact gold pixel check fails by one level per color channel. The repeat allows one level, per the render rule. The repeat passes F06 and 135 of 136 board tests. The one failure is an F10 fallback timing assertion collected before its correction. See `/tmp/gui-board-f06-tests-2.txt`. The gallery render compare uses a 390 x 844 copy of its 2x reference image. The new test uses a small rules fixture and host safe areas, so the full images differ beyond the coin. The separate coin pixel proof confirms the gold band.

- F10: the hit callback runs once under the generation guard. Local moves and replay use contact, with an after-motion fallback. Check sounds stay after rest. Sound stays off by default. Tests cover contact, reduced motion without contact, Motion Off, skip, a superseded board state and replay. The type check passes. The first run passes contact, Motion Off, skip, supersession and replay. Its reduced-motion case used the contact timing assertion from before its correction. The saved test checks fallback after rest. The final full run checks the correction.
