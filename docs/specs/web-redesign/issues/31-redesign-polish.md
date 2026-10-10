# Redesign polish

Status: resolved

Decision: decided by delegation (2026-10-09).

## Plan and checks

1. Check each report claim in the current code.
2. Test the existing Previously interface and Menu browser flow before each logic fix.
3. Fix Menu visibility, safe-area padding, scroll shade and row cuts at every width.
4. Count all friend-turn takes. Keep every summary within eight words with Previously. Correct Rescue words and the W11 FEN.
5. Keep web bite discs inside their tiles. Keep the plugin default. Correct tickets 08, 21 and 29.
6. Run npm test, typecheck, all browser checks and both plugin checks. Record plugin bytes.
7. Build W2, W4, W10 and W11. Require zero render faults. Compare each still with final5 and inspect each changed still.
8. Commit and push the branch with the normal hook. Open no pull request.

Pass criteria: every requested item passes; every changed still has an item; Workshop and main.ts have no change; the push succeeds.

## Evidence

Code confirms the report claims. Plugin baseline: 4,296,101 bytes.

The existing Previously interface first fails for the whole-turn count, then passes.
The Rescue summary and detail tests first fail, then pass. Every form keeps the eight-word cap.
The Menu flow first fails at the scroll end. It then passes with the shade hidden.
The flow also checks desktop Tricks, row cuts, a missing checkVisibility method, and Account content changes.
The bite-inset test first fails, then passes. The plugin default drawing branch stays fixed.
The W11 rank is 5pp1: eight squares. Both take plies are legal and take ten pieces.
The existing full-turn height check passes at 320 by 568. No longer chain is needed.

## Verification

- npm test: Test Files 95 passed | 1 skipped (96). Tests 1734 passed | 13 skipped (1747). Scene tests: 50 pass, 0 fail.
- npm run typecheck and npm run build: pass.
- npm run check:browser: all 25 passed.
- npm run check:browser plugin-ui plugin-ui-http: all 2 passed. plugin-ui: 14.7 s. plugin-ui-http: 15.0 s.
- The first HTTP attempt stops before a test because its database setting is absent. A temporary loopback database is created and bootstrapped. The complete rerun passes. That database is stopped by its PID.
- Menu passes three final runs: the focused run, the full suite, and a separate repeat.
- Plugin page: 4,296,101 bytes before and after; zero added bytes.
- git diff --check: pass. main.ts, Workshop and W12 sample source have no change.

Logs: /private/tmp/polish-tests-final.log, /private/tmp/polish-browser-final.log, /private/tmp/polish-plugin-rerun.log and /private/tmp/polish-menu-third.log.

## Answer and renders

Items 1 to 7 are complete. All report faults are confirmed in code and repaired.
The optional longer W11 chain is not needed: the full text already needs four or more lines at 320 by 568. Its existing height assertion passes.
The shade has its own padding gap. A clip keeps scrolling content above that gap while more rows remain. At the scroll end, the shade and clip both clear.
Web bite discs move 3 CSS px inward. Their centre is one radius plus 1 CSS px inside the tile corner. Phone radius stays 7 CSS px. The plugin default stays fixed.
Tickets 08, 21 and 29 now state the current facts. No dependency, saved field or game rule changes.

| Unit | Stills | Faults |
| --- | ---: | ---: |
| W2 | 68 | 0 |
| W4 | 48 | 0 |
| W10 | 8 | 0 |
| W11 | 18 | 0 |

Total: 142 stills, zero faults. Each has a final5 peer.
Every changed still is inspected in its before and after pair. Nineteen product stills have items 2, 3, 4 or 6. Thirty-three exact pixel differences have item 9: capture pixels only, with no product change. No unexplained product change remains.
The phone and desktop W4 bite stills also get a full-size check. No badge crosses its tile or covers the adjacent frame.
Preview PID 2861 is stopped after the capture. The temporary database is stopped by its PID.

Renders and 13 inspected comparison sheets: `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/f713c296-a557-4c06-99e1-90ecc1f52371/scratchpad/build/samples/polish/`.
Every changed still and item: `polish-render-comparison.md` and `polish-render-comparison.json` in that scratchpad root. Raw counts: `polish-pixel-diff.json`.
Per-unit capture logs: `/private/tmp/polish-capture-W2.log`, `/private/tmp/polish-capture-W4.log`, `/private/tmp/polish-capture-W10.log`, `/private/tmp/polish-capture-W11.log`.

The final RESULT records the pushed head. The normal push runs npm test and the repo gate.
