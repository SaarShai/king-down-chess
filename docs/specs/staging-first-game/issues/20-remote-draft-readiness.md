# 20 — Diagnose remote draft readiness in W7 source checks

Status: resolved

## Failure

The corrected combined source suite in `evidence/staging-next-ticket-candidates/u09-integrated/source-suite-final.log` has four board failures. Staged move and mate checks read selected-piece titles. D9 reads `Move 1.` before the saved-draft description. D10 reads an empty context note before the opponent draw note. The earlier log's later draft-clearing assertion is not the initial failure in this run; a separate controlled run must confirm it before any product change.

These cases cross from a source page stamped `test-engine` to real fixture games with their actual stored engine. They correctly use asynchronous server preview. Renderer animation completion alone does not prove a draft preview or rollback read has completed.

## Plan and checks

1. Incorporate accepted bootstrap correction `52c16b1a`. Add passive diagnostics only after a selected assertion fails, so the probe cannot turn the failure into a pass by delaying it. Capture view revision/action/draw note, transport inflight, saved draft prefix and tool names; omit account identifiers.
2. Under a CPU grant, reproduce the four cases and identify each exact incomplete operation. Do not assume all four share a cause. Keep gameplay and privacy assertions unchanged.
3. Make only a confirmed readiness or product correction, then run the exact selected cases through `npm test` with typecheck and art checks. Get an independent read and normal hooks. No full board run or archive change is authorized here.

## Evidence

- Four-case unchanged-product diagnostic reproduces all four initial failures. Each shows one transport call in flight. The move case has not yet completed its initial empty preview; mate, saved-draft restore and draw rollback each await their draft preview. Log: `/tmp/kingdown-u09-w7-diagnostic.log` (exit 1 after passing typecheck).
- Test-only readiness corrections wait for mounted/view-ready transport completion and exact staged LAN persistence, then retain every existing word, draw, Undo, send-count and state assertion. This clears move/mate and the initial D9/D10 assertions. The next controlled run exposes two later failures: D9 invalid fixture injection is overwritten by teardown, and D10 retains a draft after an accepted move with no call in flight. Log: `/tmp/kingdown-u09-w7-readiness.log` (2 pass / 2 fail).
- D9 now clones the host state, changes the fixture and uses the existing host setter. The setter keeps the injected snapshot through real SDK teardown. The host and teardown are unchanged.
- D10 confirms a product gap: the view has accepted revision 3, is waiting for the opponent, and keeps the old base draft at revision 2. `restorePreview` formerly returned before checking that draft on a waiting/finished view. The approved narrow correction runs existing `draftLans` validation and drops invalid saved data before the unchanged request-readiness guard. Valid same-base draw revisions still restore their draft; no preview is requested for a waiting or finished turn.
- Final exact four journeys pass (182 cases are outside selection). Full `board-model.test.ts` and `plugin-widget-state.test.ts` pass 62 tests. Both `npm test` commands pass full typecheck and 54 art checks. Log: `/tmp/kingdown-u09-w7-green.log` (exit 0).
- Temporary diagnostics are removed. No sleeps, timeout changes, fingerprint substitutions, rule changes or weaker assertions are added. The previous-turn boundary remains parked. Final independent read finds no confirmed should-fix: the existing validator precedes the request guard, and mounted/transport readiness plus exact staged LAN and setter injection preserve the original contracts. Normal commit hooks follow.
