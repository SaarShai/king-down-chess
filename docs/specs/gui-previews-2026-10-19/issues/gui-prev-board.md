# GUI previews 2026-10-19: the board screen and play loop

Status: in-progress
Type: task

## Why and the rule
Saar, 2026-10-19: "by the time i get back - everything must be sleek and pixel-perfect and faultless and beautiful to look at and a joy to use." His standing rule: a taste call needs his approval. So this lane builds a PREVIEW of the recommended pick of each item below, on its own branch, at award-level craft. Nothing merges until he approves the item on his approval page. Build each pick exactly as its option text says; do not build the other options; add no idea that the item does not name. Where a pick leaves a detail open, choose the most restrained and clear answer, and name it in your answer as a taste choice.

Record: copy this ticket to docs/specs/gui-previews-2026-10-19/issues/<this file name> in the repo, set its Status to done, and add the check results at the end.

Screens before the change: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md names each image). The expert reviews: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/panel.md, /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/suggestions.md, review-astra.md, review-opus.md; /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/argon-1.md, argon-2.md.
Proof for each item: before and after screenshots of each screen it changes, at the sizes where it shows (plugin harness: 390x844 and 1280x800, light and dark; web: 390x844 and 1440x900), saved as /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-prev-board/previews/A<n>-<screen>-<size>-<theme>-before.png and -after.png. Take the before shots from the branch base, the after shots from your commit. A test for each behaviour change. npm test and the plugin-ui browser check pass. One commit per item.
Art: new or changed images only through Codex's built-in image_gen on the ChatGPT plan (never the paid images API). Match the painted cast (public/pieces/painted-2d/, docs/2d-first-pieces/) and keep every page under its size limit (the plugin page HTML stays under 1,000,000 bytes).

### A14 Turn button: sword only, or sword with words? (your 2026-10-15 choice)

Problem: On 2026-10-15 you chose a sword with no words. All five leads say new players do not know the sword means “End turn”; they rate it the top fault. I keep it as your call.

Build: **Sword plus words**. “End turn” (computer) or “Send your turn” (person) next to a small sword, 16 px bold.

Why this pick: Words on the button follow “recognition rather than recall”; the sword can stay beside the words.

Other options (do not build): Keep the sword only (Your 2026-10-15 choice.); Words only (Remove the sword.)

### A15 Selected piece: the glow hides behind front pieces

Problem: When you select a piece behind another figure, its foot glow hides under the front figure, so you cannot see what is selected. Your legend says “a warm glow and a gold ring at its feet”, but the ring does not draw today.

Build: **Add the gold ring from your legend, drawn on top**. Keep the foot glow; the thin gold ring draws after the front figures.

Why this pick: Drawing your own gold ring over the front figures fixes it with the look you already chose.

Other options (do not build): Lift the whole glow above the front figures (Brighter, can cover the front figure’s feet.); A gold square fill on the selected tile (The panel’s idea; check it against the green move tiles.)

### A17 Frozen piece: no mark on the board

Problem: After Freeze, the board shows nothing on the frozen piece. The look is an open question from the web review (F3, W12).

Build: **Reuse the Workshop frost mark**. Tint, blue ring and turn pips, as in the Workshop.

Why this pick: Reusing the Workshop frost mark keeps one visual language for “frozen”.

Other options (do not build): Ice with a turns-left badge and a thaw (The web-ux F3 design.); A small snowflake badge (The panel’s idea.)

### A18 Moves list says “No moves shown yet” while a move waits

Problem: After you stage a move, the moves line names it, but the list says “No moves shown yet.” Your send-turn choice T5 a says no extra “unsent” mark.

Build: **Change only the empty-list words**. For example “No turns sent yet.”

Why this pick: Changing only the empty-list words keeps T5 a and removes the mixed message.

Other options (do not build): Keep as is (); Label staged moves “Not sent” (This reverses T5 a.)

### A27 Phone board: an empty moves list opens at the start

Problem: On a phone the moves band opens at move 1 and says no moves are shown yet. It touches your moves-band layout and the empty-list words item.

Build: **Keep the band shut until the first move**. It opens by itself when there is a move to show.

Why this pick: A closed band at the start gives the board more room and shows nothing empty.

Other options (do not build): Change only the empty-list words (Keeps your band layout.); Keep as it is (The band opens empty.)

### A39 Take or Shove: the choice covers the squares

Problem: The Take or Shove choice sits at the board centre and covers the piece and the squares the player chooses between.

Build: **Put the choice at the board foot**. The squares stay in view.

Why this pick: With the choice at the board foot, the player sees the move they choose.

Other options (do not build): Put the choice beside the board on a wide screen (Phones keep the centre.); Keep as it is (At the board centre.)

### A8 Motion: quieter and controllable

Problem: Long quiet moves, a dot wave on legal moves, and resting pawn motion make play feel slow; there is no motion setting.

Build: **Shorter quiet moves and an Animations setting**. Quiet moves at most 420 ms (Normal) or 260 ms (Fast); legal-move dots appear together; Animations Normal/Fast/Off beside Sound; no flashing End turn; no idle pawn motion.

Why this pick: Short moves keep the game snappy; a setting respects players who want less motion.

Other options (do not build): Same pace, tap to skip (Keep timing; a tap skips any animation.)


## Plan and checks

Base: `bc62f4ee`. Build A14, A15, A17, A18, A27, A39, and A8 in that order. Keep one commit per item.

For each item: add a behaviour check, run the type check and unit tests, commit, then run `plugin-ui` with the lane runner. Capture the changed screens at device scale 2. Use the saved base build for before screens. Inspect the screen pairs. Keep all work on this branch for owner approval.

The final check covers all seven items. No server contract changes are planned.

## A14 check record

The visible label and sword pass the screen check at both plugin sizes, in both host themes, for computer and person games. The type check passes. The eight after screens are in `previews/`. The full plugin check passes before the capture step in run A14-1. Run A14-4 reaches the fixed 420 second limit. The unit test run remains in the shared test queue.

Taste: the sword is 22 by 16 px. The gap is 6 px. The 16 px label can wrap on narrow screens.

## A15 preview

Keep the foot glow. Draw a 1.5 CSS px gold ring after the last figure row. Use the legend gold and a dark gold edge. The unit check covers both board directions and the final draw order.

## A17 preview

Share the Workshop frost drawing with the painted board. Keep its blue tint, crystal lines, blue ring, and moon pips. Read the mark and turns from the engine. Clear the drawing when the mark ends or its piece leaves. The pips draw after all figures. The unit check covers two sides, two turns, expiry, empty squares, own pieces, and Ice Wall.

A15 saves its plugin and web builds at commit `1694b5f9` for the final screen check.

## A18 preview

Both empty history views say “No turns sent yet.” The staged move line stays as it is. No unsent mark is added. The browser check stages a move, opens Moves, and checks the words.

A17 saves its plugin and web builds at commit `1b24c86b`.

## A27 preview

The phone band stays shut with no sent moves. The first sent move opens it. A manual close still holds on resize. A staged move alone does not open an empty list. The browser check covers these four states.

Taste: “first move” means the first sent move, because this list shows sent history. A18 saves its plugin build at `da987ecc`.
