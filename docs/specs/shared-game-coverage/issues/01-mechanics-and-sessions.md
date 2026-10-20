# Prove the complete shared mechanics and session paths

Type: task
Status: claimed
Parent: U05

## Outcome

Prove the full released mechanic roster and important interactions through shared website and embedded account play. Reuse existing tests and repair confirmed gaps. Complete the remaining local and account session criteria before advancing.

## Checkable work

1. Audit the released roster and current engine/service/browser evidence in parallel, without duplicating U04.
2. Extend the existing compiled browser checks for missing roster actions and interaction effects. Assert accepted state and reload, not just visible controls.
3. Add focused checks and fixes for confirmed session gaps. Preserve separate local and account authorities.
4. Run relevant checks once per changed tree. Obtain independent review. Record exact source, output paths, failures and repairs.
5. Verify actual staging website and ChatGPT. Update the blueprint only when the evidence satisfies U05.

## Current evidence

U04 already proves game-owned immutable rules, search isolation, multi-action budgets, cancellation, and the representative March/Maester/Morph web–ChatGPT journey. Its full-suite run and focused repairs are preserved. This ticket extends that evidence; it does not count the same journey as full roster coverage.

## Integrated changes and receipts

- `833c0eef`: drafts require the stored engine identity as well as account, game, revision and rules. Focused identity checks: 210 tests in five files, typecheck and 53 artwork checks pass.
- `90c3121d`: 55 named replay fixtures cover six fairy types, 21 released cards, 12 powers and 16 high-risk interactions. Each turn checks its expected effect and save/reload. Focused fixture checks: 56 tests plus 53 artwork checks pass.
- `2989b61c`: HTTP/MCP fixture views and saved-state audits carry the real implementation identity. Focused tooling checks: 23 tests plus 53 artwork checks pass.
- `93d2cbd3`: the `shared-mechanics` browser check drives both compiled clients through real board controls, real HTTP/MCP and one disposable database. It checks accepted state, stored surface, history, uses and remount. Browser execution is pending; registration is not a pass.
- `92be70f0`: account screen close releases clocks, observers, frame callbacks and sheet listeners. Delayed replies cannot access removed account DOM. Isolated worker verification: 106 tests, typecheck and 53 artwork checks pass. Root integration adds board/renderer disposal and guards connection/display-mode callbacks.
- Equal-revision reads now replace the complete seat projection, including empty/redacted command lists. The unchanged board keeps interaction state while its private data is replaced. This fixes stale cached payloads; no visible message disclosure was demonstrated.

## Verification selected for the final tree

Run the combined focused lifecycle, board, motion, keys, turn and level checks. Then run `shared-mechanics`, `painted-game`, `web-online` and `plugin-ui-http` through the existing browser wrapper. Reuse U04's unchanged new-game/same-device setup evidence. `web-online` supplies actual offline network-cut, reload, lesson/Workshop preservation and AI reply checks. Record all run folders and failures below before closure.

The actual staging check will use the existing authorized account and ordinary games. Full roster coverage belongs to the compiled web and MCP/AppBridge matrix. Actual ChatGPT smoke supplements it. Do not claim that all matrix rows were replayed in the live ChatGPT host. Staging has one auth user; no extra credentials or product fixture endpoint are needed for this acceptance gate.

## Final focused verification

The first integrated run passes 398 tests and finds 11 failures. Six assertions expose unchanged-revision draw-offer controls that need a refresh. Three draft cases use an obsolete synthetic view without implementation identity. The teardown case sends an invalid raw message instead of the SDK lifecycle. The rematch watch exposes lost recent-activity timestamps after a delta read clears commands.

Repairs keep the product identity guard, use the real AppBridge teardown, refresh visible action metadata, and reread the existing cached command window. The service still caps this window at 50 commands. There is no second polling state store or extra API request.

The repaired combined run passes all ten selected files and all 54 artwork checks, with no skip; see `/tmp/kingdown-u05-final-focused-2.log`. It includes source browser checks for input, motion and disposal. An independent reader finds no should-fix in the product lifecycle/privacy change; a final polling-delta review follows. Compiled interface checks and actual staging remain pending.

## Limits

No exhaustive claim for all possible card/power combinations. Use small complete admission tables and targeted high-risk interactions. No production or original-project writes. Keep the unresolved startup error separate from mechanics claims.
