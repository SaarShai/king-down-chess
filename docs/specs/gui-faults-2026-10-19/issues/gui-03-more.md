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

## N03 build and proof

- Clear the arrangement move line. Remove its unused letter formatter.
- The harness checks for no text at 390×844 and 1280×800. It checks the moved knight, pawn taps, remounts, the submitted Black order and Ready.
- `npx tsc --noEmit`: pass.
- `npm test`: pass. The test log is `tests-n03-1.txt` in the lane handoff folder.
- Browser check: run after this commit. The next part records its result.
- Taste choices: none.
