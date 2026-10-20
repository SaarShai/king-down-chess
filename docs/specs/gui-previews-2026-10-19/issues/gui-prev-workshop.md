# GUI previews 2026-10-19: the web Workshop

Status: done
Type: task

## Why and the rule
Saar, 2026-10-19: "by the time i get back - everything must be sleek and pixel-perfect and faultless and beautiful to look at and a joy to use." His standing rule: a taste call needs his approval. So this lane builds a PREVIEW of the recommended pick of each item below, on its own branch, at award-level craft. Nothing merges until he approves the item on his approval page. Build each pick exactly as its option text says; do not build the other options; add no idea that the item does not name. Where a pick leaves a detail open, choose the most restrained and clear answer, and name it in your answer as a taste choice.

Record: copy this ticket to docs/specs/gui-previews-2026-10-19/issues/<this file name> in the repo, set its Status to done, and add the check results at the end.

Screens before the change: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md names each image). The expert reviews: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/panel.md, /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/suggestions.md, review-astra.md, review-opus.md; /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/argon-1.md, argon-2.md.
Proof for each item: before and after screenshots of each screen it changes, at the sizes where it shows (plugin harness: 390x844 and 1280x800, light and dark; web: 390x844 and 1440x900), saved as /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-prev-workshop/previews/A<n>-<screen>-<size>-<theme>-before.png and -after.png. Take the before shots from the branch base, the after shots from your commit. A test for each behaviour change. npm test and the plugin-ui browser check pass. One commit per item.
Art: new or changed images only through Codex's built-in image_gen on the ChatGPT plan (never the paid images API). Match the painted cast (public/pieces/painted-2d/, docs/2d-first-pieces/) and keep every page under its size limit (the plugin page HTML stays under 1,000,000 bytes).

### A13 Rule seals in the Workshop

Problem: The wax seals have a strong shine.

Build: **Matte wax**. Less shine, softer shadow; same shapes and colours.

Why this pick: A matte seal matches the matte painted look.

Other options (do not build): Flat ink (No wax at all.)

### A29 Workshop: plaques cut at the row edge

Problem: On a wide screen the last rule plaque runs past the right edge, as a scroll row does. On a phone a name is cut hard with no fade. It touches your Proving Ground layout.

Build: **Add the fade to the phone row too**. The same fade as on the wide screen.

Why this pick: A soft fade on the phone shows that the row scrolls, as the wide screen already does.

Other options (do not build): Wrap the plaques onto more lines (No scrolling; the row grows taller.); Keep as it is (The cut shows that the row scrolls.)

### A32 Workshop tabs keep the pawn on the bench

Problem: After a change to Kings, Cards or Rules, the bench still shows the pawn. It changes how the Proving Ground works.

Build: **Show the first item of the new tab**. A change of tab changes the bench.

Why this pick: The bench then always shows something from the tab you chose.

Other options (do not build): Show an empty bench with a short prompt (The player picks the item.); Keep as it is (The pawn stays.)


## Plan and checks

Base: `bc62f4ee`. Branch: `claude/gui-prev-workshop`.

1. A13: use a faint wax light and a soft shadow. Keep each shape and colour.
2. A29: keep the wide row's fade on the phone. Keep the scroll and row height.
3. A32: open the first item of a new library tab. Keep Board on the inspected piece.

Each part has one commit. The type check, full unit suite and browser checks pass. The browser runner checks committed code. The final record changes only this ticket. The code stays on this branch for Saar's approval.

## A13 preview

The wax light uses .06 opacity. The shared shadow uses 1.5 down, 1.2 blur and .22 opacity, as the expert review says. The shapes, colours, symbols and sizes stay the same.

The 2× review finds a second CSS shadow on the large seal. That shadow is removed. Each seal now uses its shared SVG shadow at its own size. This is the extra taste choice for A13.

A unit check covers all ten seals. The browser check reads the shared shadow and each wax light. It also checks that the large seal adds no second shadow.

Twelve before and twelve after screens cover Pieces, the rule shelf, Rules, a rule detail, Share and See all at both web sizes. The 2× review finds no new gap, cut text, overlap, blur or colour fault in these states.

## A29 preview

The phone row keeps the wide row's 24 px fade. The phone override for both mask properties is removed. The row keeps its height, gaps and scroll. No new taste choice is needed.

The browser check compares the phone mask with the wide mask. It also moves the phone row to its end. Eight before and eight after screens cover the Pieces, Kings, Cards and Rules rows at both web sizes. The 2× review shows the soft phone edge and the same desktop layout.

## A32 preview

A new library tab opens its first visible item through the same path as an item tap. Kings starts with Flame. Cards starts with Freeze, or the first card of the spread stack when that stack stays open. Rules starts with Steps 2. Pieces starts with Pawn.

A tap on the current tab keeps its item. Board keeps the inspected piece. A tab change keeps keyboard focus on that tab. In short landscape, the library sheet stays open.

The browser checks cover all four library tabs, a repeated tab, a spread deck, the phone Board tab and the short landscape sheet. The phone check also keeps its Leap test. It checks that a new king clears the old king's armed power.

Taste choices: use the row's current order; apply the first-item rule to Pieces too; keep the open card stack and choose its first visible card. Board stays a view of the current item.

Eight before and eight after screens cover Kings, Cards, Rules and the return to Pieces at both web sizes. The 2× review finds no new cut name, overlap, gap, blur or colour fault.

## Check results

- `npx tsc --noEmit`: pass. The commit hooks also run the type check.
- Full `npm test`, with `VITEST_MAX_WORKERS=1` and the owner's local test database: pass. All 193 unit files pass. There are 3,239 passes and eight skips. All 51 art tests pass. The suite takes 1,205.20 s after the shared test lock opens. No test or check limit changes.
- The first full run uses the default worker count. It has 3,210 passes and 29 time-limit failures. The one-worker run resolves these failures.

| Part | Checked code | Runner | plugin-ui | workshop |
|---|---|---|---|---|
| A13 | `4b88dd1f` | M1 | Pass, 277.3 s | Pass, 151.6 s |
| A29 | `119e579b` | M1 | Pass, 294.1 s | Pass, 187.1 s |
| A32 | `a4654fe8` / `e36aa250` | M1 / this Mac | Pass, 282.9 s | Pass, 132.5 s |

A32's first Workshop check expects Leap to stay armed when Kings opens. The new tab now opens Flame, whose existing seat action clears the old power. The repaired test checks that state and keeps the phone Board Leap check. The commit records the changed check in its `Removed-check` trailer. A recheck starts before that repair commit succeeds; the runner rejects the changed checkout. The clean run at `e36aa250` passes all groups. The repair changes the check and ticket only. The product code matches the passing plugin check and the after screens.

No server code changes. The HTTP browser check is not needed. The full suite includes the plugin size checks.

## Screens and review

All 56 named PNGs use 2× scale. Their sizes are 780×1688 and 2880×1800. Before screens use the branch base. After screens use each part's code commit.

Screen index: `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-prev-workshop/previews/INDEX.md`. The manifest records the source commit for each image.

The Workshop is a web screen. It has no plugin screen or host theme. The plugin checks still guard the shared code. The short labels with an ellipsis and the vertical scroll in the rule shelf and See all match the base. The next item at a row edge fades as the pick requires. No other pixel fault is found in the tested states.

Unbuilt parts: none. Saar still needs to approve the three taste previews.

## Review fix plan

Base: `a8b50245`. Review A and Review B report the same save-loss fault. Review A also reports a phone fade fault.

1. Keep the current draft on an automatic tab change when its save fails. Test a full shelf and a refused storage write. Check the draft, Undo, Copy link, and save recovery after tab changes.
2. Keep the phone row content outside the 24 px fade. Check both scroll limits in Pieces, Kings, Cards, and Rules.
3. Run `npm test` with one worker and the owner's local test database. Commit the fixes and run `plugin-ui` and `workshop` through the given runner. Record each result here. Keep all test and check limits.

Scope: the tab handler, phone row spacing, and the Workshop browser tests. No server code changes.

## Save-loss review finding

Review A P1 and Review B P1: confirmed. The new tab handler calls `show()` for Pieces and Rules. That path replaces the draft and clears Undo. Its save alert then has no current design to show. The Kings and Cards paths also change the bench, so the guard covers all automatic tab choices.

The tab handler now keeps the current design when its save fails. The library tab still changes. The draft, Undo, and save/copy actions stay. A successful save permits automatic item choices again. Direct item taps keep their existing action.

The Workshop browser test now changes through all four library tabs after each save failure. The full-shelf case checks Copy link and deletion to make room. The refused-write case uses the phone size. It checks Copy link, retry, and the next automatic tab choice. Both cases check that the saved or copied design keeps the paint.

The check results below cover both fixes.

## Phone fade review finding

Review A P2: confirmed. The row mask fades across 24 px at each edge. The phone sets only 12 px of padding. Thus, the fade covers the start of the rule headings and the first card edge.

The phone now uses the existing 24 px row padding. Its ledge line uses the same inset. The mask stays the same on wide and narrow screens.

The Workshop browser test measures the first item at the start and the last item at the end of each phone library row. It requires at least 24 px of clear space for Pieces, Kings, Cards, and Rules. It saves eight screens for visual review. All these checks pass.

## Review fix checks

- Save-loss fix: `e66bce0e`. Phone fade fix: `d9a7d88d`.
- The given browser runner checks `d9a7d88d` on this Mac. `plugin-ui` passes in 265.5 s. `workshop` passes in 221.0 s. The runner ends with `check-runner: mac exit 0 at d9a7d88d`.
- The new tests pass. A full shelf and a refused write both keep the draft, Undo, and recovery actions through tab changes. Copy link and save recovery keep the painted square. A successful save permits the next automatic item change.
- All eight phone row screens pass visual review. The first item clears the fade at the start. The last item clears it at the end. The rule headings and the Freeze card are clear at the start. Screens: `previews/review-fix/` in this lane's scratch folder.
- Browser log: `checks-fix-1.txt` in this lane's scratch folder. Raw output: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/gui-prev-workshop-Bk0SDS/`.
- Full `npm test`: pass, exit 0. All 193 unit files pass: 3,239 tests pass and eight skip. All 51 art tests pass. The unit suite takes 1,178.56 s after the shared lock opens. Log: `unit-fix-1.txt` in this lane's scratch folder. The command uses one worker and the owner's local test database. No test or check limit changes.
- No server code changes. The HTTP browser group is not required.

Both review findings are fixed. This final record changes only the ticket. The product code and browser tests match the checked commit, `d9a7d88d`.

## Test repair (2026-10-19)

Plan:
1. Merge `origin/main`. Keep all fault fixes and the A13, A29 and A32 previews.
2. Run the full unit suite on the M1 from committed code. Run the local type check.
3. Class each failure as a changed preview expectation, a missing fixture field, a code fault, or a load-only timeout. Keep every guard and time limit.
4. Run each repaired file on the M1, then run the full suite again. Record counts and commits here.

Pass criteria: the M1 suite has no failures, the type check passes, and all preview behaviour stays. The M1 may skip database tests. This step runs no browser checks or screenshots, as the repair ticket requires.

### Merge and result

Merge commit: `38e50ebc`. It merges `origin/main` at `0a7ec40b` into this branch. The merge has no conflicts. All verified fault fixes and their tests stay. A13 keeps the matte seals. A29 keeps the phone fade and clear edge space. A32 keeps the first-item action and the failed-save guard.

Both full M1 runs pass at `38e50ebc`:

| Log | Passed files | Skipped files | Passed tests | Failed tests | Skipped tests | Duration | Exit |
|---|---|---|---|---|---|---|---|
| `unit-1.txt` | 184 | 12 | 3,122 | 0 | 164 | 327.51 s | 0 |
| `unit-2.txt` | 184 | 12 | 3,122 | 0 | 164 | 326.66 s | 0 |

The skips comprise 156 PostgreSQL tests and eight existing opt-in balance drift tests. No skip is added. The M1 has no PostgreSQL. Logs are in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/prev-green-workshop/`.

No failure needs a kind-a, kind-b, kind-c or kind-d repair. No test, fixture, guard or time limit changes. Thus, no repaired file needs an isolated run. The second full run supplies the final proof. The local `npx tsc --noEmit` check passes.

This step adds no taste choice and changes no screen. No preview needs a new capture. The repair ticket directs this step to use `m1-unit.sh` and to omit browser checks and screenshots. Thus, this step runs no local unit suite, no `npm test`, and no browser check. CI must run the browser checks. The M1 helper runs the unit suite; it does not run the separate art suite from `npm test`.

All repair parts are complete. No failure remains to repair. The three previews still need the owner's approval. This final record changes only the ticket; the product code matches the tested merge commit.
