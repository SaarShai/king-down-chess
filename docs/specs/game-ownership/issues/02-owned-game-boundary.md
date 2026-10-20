# Integrate the game-owned boundary without changing search behavior

Type: task
Status: resolved
Blocked by: 01
Parent: U04

## Outcome

Each game owns its immutable rules and search lifetime. Product helpers cannot read another game's active rules. Preserve current moves, human atomic turns, computer action budgets and commit order.

## Work

1. Extend the existing compiled browser/worker check with controlled multi-action games, cancellation and retained warm state. Compare independent game workers with interleaved games. Capture per-action limits and accepted action order; Node fixed-depth probes alone do not close this gate.
2. Use the smallest boundary supported by ticket 01: owned immutable definitions and private synchronous helper entry points, with no product callback escape. Keep search state per game. Keep the server's existing isolated worker/reset policy.
3. Migrate `Game` and its actual local/account/Workshop helper callers in one working slice. Include status, setup, notation, preview and save/reload. Do not add a second authority or compatibility API.
4. Replace the baseline tests that pin unsafe ambient behavior with assertions for the corrected product boundary. Add an import check that prevents product callers from bypassing it.
5. Preserve existing complete-turn rejection, repetition, uses and continuation. Run relevant mechanics, state, worker and browser checks once, obtain independent review, then publish only a staging preview if product source changes.

## Verification

- Different game configurations cannot change each other's legal moves, status, setup or notation.
- Nested calls and errors restore internal scope; asynchronous work cannot escape through the public API.
- Preview does not mutate accepted state. An invalid later action rejects the complete human turn.
- Compiled computer fixtures preserve budgets, action order and cancellation. Warm state remains within its owning game.
- Save/reload and the signature-mechanics web–ChatGPT journey still pass.
- Product imports enforce the boundary. Original project and production remain unchanged.

## Limits

No new rules, art, AI policy, per-node allocation scheme, generic effect language or mandatory server-worker removal. Arbitrary simulation evaluator overrides are not covered by ticket 01; treat their ownership explicitly if this change reaches those callers.

## Current plan

- Root owns `Game`, its `Engine` wrapper, isolated match integration and the import guard. Each reset/load creates a new search lifetime; the wrapper keeps a worker only within that lifetime.
- An isolated writer owns the concrete `GameRules` facade and local/account/render/Workshop callers. Its scope stays private. Save, preview, draft, setup and later rendering callbacks receive the owning definition.
- A second isolated writer owns search-state ownership and the compiled worker check. Same-game search stays warm. Tests compare different-rule searches with independent fresh workers, then cover multi-action budgets and cancellation.
- Integrate and review each slice, run relevant mechanics, database and browser checks, publish only a staging preview, then repeat the actual web–ChatGPT signature-mechanics journey. Record exact commits and artifact. No production action.

## Implementation and review

`GameRules` copies and freezes the definition, including nested hands, powers and designs. Its private synchronous scope restores the internal rules after each operation and error. Product callers get concrete methods; they cannot pass a callback into that scope. Setup entropy runs outside the scope, and product search rejects callback options.

`Game` owns this definition and a search lifetime. A new game or loaded position starts a new lifetime. `Engine` keeps its worker within that lifetime, copies the requested position and options, and discards obsolete replies. Cancellation terminates the worker. The inline fallback clears shared search tables when the owner changes and keeps them warm for the same owner. Server match workers keep their existing isolation and per-action reset policy.

Local and account play, saved positions, drafts, notation, hints, board effects, lessons, Guide and Workshop use the owning definition. The import guard rejects direct, aliased, namespace, re-export and dynamic-literal access to the private rule-dependent operations. The test-only scope and worker are removed.

Independent review found two simulation constructors that still depended on the ambient definition. Both now pass the run's rules. A regression checks a designed piece and the threefold toggle. The old runner-side repetition override is removed because `Game` now applies its own rule. No other confirmed core or UI finding remains.

The bundle review finds no new search-table allocation: the earlier account board already imported the search module through move sounds. The website's eight-file static account dependency set grows by 5,759 bytes raw and 1,999 bytes gzip. The final inline board grows from 928,682 to 959,625 bytes raw and from 329,167 to 340,855 bytes gzip. No dependency is added.

## Verification

- Focused ownership and import checks: 4 files, 50 tests pass, plus 53 artwork checks.
- Compiled Chromium search check passes. Current/2017 cold searches visit 2,859/3,388 nodes; warm repeats visit 145/106. Interleaved independent workers match their controls. Inline owner switches match cold controls.
- Haste `Ra1xa5!H`, `Ra5xe5` and free Freeze `!F:d5`, `Ke1-d2` retain one worker and the 1,000 ms / depth-2 budget for each action. The fixture constrains the first action only. Cancellation stays silent and the replacement matches its cold control.
- The full suite with the disposable database runs 237 files: 4,253 tests pass, 2 fail and 11 opt-in/environment tests skip. Both failures are test migrations: the isolated match copy omits the new source dependencies, and a power-text assertion reads ambient rules. The repaired two-file run passes all 105 tests, plus 53 artwork checks. This is a full run followed by focused repairs, not a second full run.
- The new archived engine builds. All 141 engine archive checks pass with the disposable database, plus 53 artwork checks.
- Browser checks pass for lesson return, powers, Workshop, web account play and embedded HTTP/MCP play. Web account play includes atomic Haste, a lost reply with one accepted retry, reload/result, March, Maester swap and Morph with history and spent-card checks.
- New-game browser checks expose stale visual assertions against unchanged styles. The assertions now describe the existing gold selection edge and focus ring. Independent review confirms they preserve the visual checks. A subsequent menu timing failure also reproduces on the pre-integration product: the move appears in history before its animation ends, so the next menu click skips that animation. Event probes confirm the consumed click. The check now waits for the existing ready-action state; the shared menu helper and product behavior stay unchanged. The final integrated check passes in 18.8 seconds, including saved setups, older saves, custom armies, powers, Workshop designs, keyboard and phone layouts, with no page or console errors.
- Source `be0786da` is published only to preview `dpl_Tx6SkvtZnmT7R15NumP1Srp8owM6` and the staging alias. The [actual host proof](../owned-staging-proof.md) records website and ChatGPT actions for March, Maester swap and Morph. Both interfaces show the same eight actions and spent cards. The older save also opens with its prior history.
- Three later fresh native ChatGPT opens pass without **Try again**; the last resumes all eight actions after a tool-definition refresh. An earlier mount shows an unexplained `Internal error`. Its cause remains open and does not become a claim of reliable startup. The debugger-associated test path also remains unresolved.
- An independent evidence review checks the source, engine, preview, histories and fresh-open records. Its corrections are applied: narrow the older-save claim to observed history and report the exact fresh-open count. All 161 documentation checks pass.

The three task worktrees remain available for diff review. No temporary probe is included in the product. U05 retains broader mechanic and interaction coverage. The fixed cross-game leak is retained search-state contamination, not a measured unbounded heap leak.

Compiled evidence is saved in `evidence/staging-game-ownership/compiled-search/` beside the application repository. Fixed-depth node counts prove search-state behavior; they are not a broad speed or playing-strength claim.
