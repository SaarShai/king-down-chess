# GUI faults 2026-10-19: more plugin faults (seat, board speech, sound)

Status: in-progress
Type: task

Source: the GUI review merge (/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/review-opus.md, review-astra.md, suggestions.md) and two independent checks of each item in the review merge run (2026-10-19). Each part below is a verified FAULT with one right fix. Build only what each part says. Anything the part calls taste or "for Saar" stays out. Saar's look decisions stand (docs/specs/*/spec.md; the painted look only).

Record: copy this ticket to docs/specs/gui-faults-2026-10-19/issues/<this file name> in the repo, and set its Status to done with the check results at the end.

Gallery for the before state: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md). Render compares: use tools/render-compare (see AGENTS.md) where the part asks for one.

### N03 The arrangement screen shows engine letter codes

Fix: In src/plugin/screens/seat.ts:94, write an empty string to #last-move: `$('last-move').textContent = '';`. Do not add new words. Line 92 (#seat-context) already gives the swap instruction, and the board shows the order.

Files: src/plugin/screens/seat.ts

Proof: Plugin harness at 390x844 and 1280x800 on the arrangement screen: #last-move has no text, and no string "Your back rank" is on the page. Swaps and Ready still work (run the plugin seat tests). Compare with plugin-setup-arrangement-1280x800-light.png.

Web overlap: None. web-adaptation inventory B05 and B06 list seat.ts as a source only; no web ticket changes line 94.

### N10 The plugin board speech gives only the square

Fix: Land this in or after lane gui-board, because F05 changes the same keydown code. In src/plugin/screens/board.ts:253, build the label as sayCursor does in src/screen/keys.ts:62-65: `<square>, <white|black> <piece>` or `empty`, then `, selected` or `, can go here`. Use the plugin view's board, selection and targets. Put the string builder in one small exported function that both files call; do not copy the code. Write the text to the board aria-label and to one polite live region in the plugin board markup (as #cursor-say on the web). Use only the existing web words.

Files: src/plugin/screens/board.ts, src/screen/keys.ts, src/plugin/index.html

Proof: Plugin harness: focus the board, press arrow keys onto a piece, an empty square, the selected square and a target; the live region text matches the web words for each case. The web keyboard tests still pass.

Web overlap: None in the web tickets. web-adaptation inventory B12, B14 and B30 cite board.ts as a source only. Lane gui-board F05 changes board.ts:253; merge after it.

### N11 The plugin plays no sound for a shot, shove, chain or swap

Fix: In the body of sound() at src/plugin/screens/board.ts:109, use the existing soundsFor(momentKind(step.pre, step.move), step.move) from src/screen/moments.ts:61 (momentKind from src/moment.ts). Play `now` and `hit` through snd[...], then snd.check() when inCheck(step.pos). Land it on top of lane gui-board F10, which moves the call site; keep the F10 now/hit timing and change only the sound names. Add no new sound.

Files: src/plugin/screens/board.ts

Proof: A unit or harness test: a shot, a shove, a chain and a swap each call the same snd function in the plugin as on the web; a plain move calls snd.move and a capture calls snd.capture. Check still plays after a checking move.

Web overlap: None. web-adaptation inventory B12 and B15 cite board.ts as a source only. Lane gui-board F10 changes the same sound() call; merge after it.

## Plan and checks

1. N03: Clear the arrangement move line. Check both requested sizes, swaps and Ready. Compare the desktop image with the supplied before image.
2. N10: Share the cursor label builder. Check pieces, empty squares, selection and targets in the plugin. Keep the web words and read text.
3. N11: Share the web sound names. Keep the start, contact and check timing. Test shots, shoves, chains, swaps, moves and captures.
4. Run the type check and tests. Commit each part in order. Run the required browser runner on each commit. Record each result here.

No taste change is in scope.

## Review fix plan and checks

1. Check each review finding against the code. Keep the board name and Enter hint in the full label. Keep the short cursor words in the live region.
2. Reset the label and live text when Escape or blur hides the cursor. Add harness tests for both faults. Update the existing label checks.
3. Run `npm test` with one worker and the named local test database. Keep all test limits. Commit the fix, then run `plugin-ui` through the required runner. Record the results here.

## Review findings

- Review A: no reported fault. N03 clears the text. N11 uses the shared sound map on both paths. The existing F10 tests check the check sound after rest for local play and replay. The twelve N11 cases do not check that sound on their own.
- Review B, finding 1: confirmed. `sayCursor` replaces the full board label with the short cursor text. The fix keeps `Chess board` and `Enter selects a square.` in the label. The live region keeps only the short cursor text. A new harness test checks pieces, selection, targets and empty squares.
- Review B, finding 2: confirmed. Escape hides the cursor, but refresh skips the label update. The fix updates the label on each refresh and on blur. A hidden cursor clears the live text and resets the label to `Chess board`. Two harness cases check Escape and blur. The browser check also checks both paths.
- The report of repeated speech needs a screen reader check. The code has one polite live region, as the ticket requires. No screen reader test is part of these checks.

## N03 build and proof

- Clear the arrangement move line. Remove its unused letter formatter.
- The harness checks for no text at 390×844 and 1280×800. It checks the moved knight, pawn taps, remounts, the submitted Black order and Ready.
- `npx tsc --noEmit`: pass.
- `npm test`: pass. The test log is `tests-n03-1.txt` in the lane handoff folder.
- Browser check: `plugin-ui` passes on the M1 at `e4764a0d` (287.5 s). Log: `checks-n03-1.txt`.
- Compare: `n03-compare-1280x800.png` places the supplied before image beside the harness image. The engine letters are gone. The swap instruction and controls stay visible. The fixtures use different armies and opponents; this is a visual check, not a pixel match.
- Taste choices: none.

## N10 build and proof

- Both screens call `cursorText`. It uses the existing web words.
- The plugin reads its position, selected square and marked targets. It writes the same text to the board label and one polite live region.
- The harness presses arrows and Enter. It checks a piece, an empty square, selection and a move target.
- `npx tsc --noEmit`: pass.
- Focused `npm test`: pass for the shared text and web keys (2 tests). The 51 drawing tests also pass. Log: `tests-n10-1.txt`.
- Browser check: `plugin-ui` passes on the M1 at `3fc1371f` (278.1 s). Log: `checks-n10-1.txt`.
- Update the six older board-label assertions for the new words. This test-only update is part of this commit. The final checks cover it.
- Taste choices: none.

## N11 build and proof

- Use `soundsFor(momentKind(...))` for both local moves and server replay.
- Play the start sound at launch. Play the hit sound once at contact, or at the existing fallback. Keep the check sound after rest and the guard against an old animation.
- Twelve harness cases pass: move, capture, shot, shove, chain and swap, each through local play and server replay. The cases check the web sound map and event order.
- All 156 board harness tests pass in `tests-n11-2.txt`. The web keys and shared text tests pass too.
- `npx tsc --noEmit`: pass.
- Full suite attempts: the first has three old label expectations (fixed in N10) and a five-second match test limit. The next has only the unchanged workshop judge test at its 30-second limit. The match test passes in that next run. Logs: `tests-n11-1.txt` and `tests-n11-2.txt`.
- The judge file passes on its own. The full suite passes with `VITEST_MAX_WORKERS=1`: 194 test files, 3,248 tests passed, 8 skipped. The 51 drawing tests also pass. Test limits stay unchanged. Logs: `tests-judge-1.txt` and `tests-final-1.txt`.
- Browser check: `plugin-ui` passes on the M1 at `0d947cfd` (281.9 s). Log: `checks-n11-1.txt`. This final amendment changes only this proof record; the tested code and tests stay the same.
- Taste choices: none. No part is omitted.

## Final result

- N03, N10 and N11 are complete, in that order, with one commit each.
- The type check, full test suite and all three required browser runs pass.
- The lane folder holds the runner logs, the full browser logs and the N03 image comparison.
- No server code changes. `plugin-ui-http` does not apply.
- No part is omitted. No taste choice is made.
