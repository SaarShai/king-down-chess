# 15 — Keep ceremony labels outside enforcement

Status: resolved

## Scope

U08 requires cosmetic changes to keep the same mechanics identity. The current worker imports `Game`, then `GameRules`, then the ceremony label formatter. Review labels do not enforce moves.

Make `ceremonyMoveLabel` take an explicit owned piece-name resolver. Remove its `GameRules` method and import. Update the sole product caller in `ceremony.ts` and the ambient-import guard. Keep every label, including designed mover, victim and promotion names. Do not change ceremony timing, rules, saves or search. Previous-turn text, help text and Workshop admission remain outside this ticket.

## Plan and checks

1. Add a real-builder mutation to the existing worker-boundary test with product files unchanged. Change only the Flight review label. Its enforcement bytes and identity must stay equal. Capture the expected red before applying the product change.
2. Apply the explicit formatter boundary. Run the formatter, ceremony, ownership guard and existing real-build boundary tests through `npm test`, with typecheck and art checks. Keep the existing mechanics mutation as a negative control.
3. Check designed mover, victim and promotion labels against another ambient design, without changing that ambient state. Get an independent read before commit.

## Release boundary

No archive is published here. Existing archives stay byte-for-byte unchanged. Removing the retained formatter can change the current worker once; the next explicit publication and recovery proof must use the exact accepted bytes. This slice does not claim all cosmetic imports are removed.

## Evidence

- True unchanged-product red: `npm test` selected `tools/plugin-worker-boundary.test.ts` passes typecheck, then fails only the ceremony-label byte assertion. Changing `flies` to `soars` changes the engine from `77c9b761` to `a092cf8e`. Log: `/tmp/kingdown-u08-ceremony-red.log` (exit 1).
- Applied candidate: `KINGDOWN_TEST_FILE='{src/ceremony-game.test.ts,tools/{game-boundary,plugin-worker-boundary}.test.ts}' npm test` passes 3 files / 20 tests, full typecheck and 54 art checks. The same real label mutation now keeps exact enforcement bytes and identity. Existing mechanics and evaluator controls, plus compiled helper load/apply/reload checks, remain in the build test. Log: `/tmp/kingdown-u08-ceremony-green.log` (exit 0).
- Actual caller: `KINGDOWN_TEST_FILE=tools/plugin-board.test.ts KINGDOWN_TEST_NAME='A8: real .* input ends the web final blow and its timers' npm test` passes both mouse/touch cases; 183 cases are outside this selection. Full typecheck and 54 art checks pass. Log: `/tmp/kingdown-u08-ceremony-ui.log` (exit 0).
- Independent reader reviewed the prepared product patch with no confirmed should-fix. There is no product change after that review. The formatter no longer has an ambient-import exemption; the guard checks its implementation too.
- No archive publication, deployment or broader presentation change occurs in this slice.
