# Keep card presentation out of the match worker

Status: reviewed and integrated at `d47a67b7`; published with the owned-search/hash slice at `0b504fb3`. All four compiled checks and exact backend recovery pass. Staging first update passes; native fresh-host acceptance is separate.

## Plan and acceptance

1. Remove the one `GameRules.shortMove` method that keeps the card display catalog reachable from the worker. Its only product caller is the shared board. Use the existing free formatter there and pass the owned piece-name lookup.
2. Require an explicit piece-name lookup in the formatter. Migrate its test callers to an explicit ambient lookup and preserve every displayed string. Test owned mover, reserve and promotion names while ambient rules name the design differently. Other `Game.context` methods stay unchanged.
3. In a temporary source copy, build the real worker, change only a released card's label and art path, and build again. Require identical emitted bytes and fingerprint. Change a real mechanics constant as a negative control and require different bytes and fingerprint. Use the existing build helper without omitted inputs or a relabeled save.
4. When the parent releases the lane, run this regression once before the product correction and then after it. Run the focused formatter/ownership/runtime checks through `npm test`. No build, test or hook runs before lane release.

## Scope and release consequences

The retained path is `worker → Game → GameRules.shortMove → move-text.shortMove → cardName → RELEASED_CARDS`. Other worker imports from `powers-ui` use independent exports. The free formatter requires its piece-name lookup; the board supplies its owned lookup, so designed names do not leak between games. The ownership guard permits this pure formatter and continues to refuse the ambient helpers. No board-specific exemption is added.

This removes catalog label/art metadata from the compiled worker graph. It does not complete separation of all narrative text or the evaluator. No class hierarchy, context factory, registry, build exclusion or identity format is added.

The structural cut can change the current worker bytes once. Its exact-byte fingerprint remains the artifact identity. Do not edit or remove the seven retained archive pairs. Publish a new pair only in a later explicit, owner-authorized release step; this ticket does not publish an archive or deploy a build.

## Evidence

- Source inspection finds one product call to `GameRules.shortMove`, in `src/plugin/screens/board.ts`.
- The free formatter also has callers in `src/move-text.test.ts` and one expected-text check in `tools/plugin-ui-check.mjs`; each now chooses a lookup explicitly.
- Preparation changes no rule, art, catalog record or AI source. The regression mutates only disposable copies.
- Pre-fix red restores the three product files and formatter tests from base `44e89092` before the selected mutation case runs. Typecheck passes. Changing only the Freeze label and art path changes the emitted bytes and fingerprint (`d1eb413b` to `c6e6b951`), so the equality assertion fails. Log: `/tmp/kingdown-u08-catalog-red.log`.
- All candidate edits are then restored. The focused `npm test` selection passes 8 files / 155 tests, no skips, full typecheck and 54 artwork checks. It covers the real build mutation and mechanics negative control, move text, owned game rules/history, the product import boundary, released card consistency and runtime/archive publication guards. Log: `/tmp/kingdown-u08-catalog-green.log`.
- The exact selection is `KINGDOWN_TEST_FILE='{src/{move-text,game-rules,game,match/match,content/cards}.test.ts,tools/{game-boundary,plugin-worker-boundary,plugin-runtime-build}.test.ts}' npm test`, through the shared lock with a 180-second lock wait.
- Parent review finds one ownership issue in the first draft: an ambient default would bypass the product import rule. The final formatter requires an explicit lookup; test/checker callers choose one, and the guard permits the now-pure function. Parent review of this correction is clear.
- No archive, browser build/check, staging data or deployment changes occur in this slice. The real-build regression writes temporary worker files only and removes its source copy.

## Integrated release evidence

The combined release publishes `812aef27` and retains the original seven pairs unchanged (eight total). `app-lFNvv3` on clean `0b504fb3` passes all 112 mechanics executions, full plugin, web recovery and local painted/learning checks. Exact backend continuation to `6bd5f93b` passes with that new archive. The staging preview `dpl_67zeLH8qjVLTx5JmWXZVJa2cJ6q1` and alias match the checked index hash; the first saved-game open passes without retry by 20.6 seconds. The outer verification report keeps the earlier intermittent cache failure and fresh native host gate open. No production change occurs.
