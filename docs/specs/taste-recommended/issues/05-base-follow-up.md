# Base follow-up: token shapes, chat result and Play checks

Status: claimed
Type: task

## Scope

Follow ticket 01-base and its last comment, lane od-base. The owner says
that card and power coins stay round. Profile badges and name pictures
keep their own shape. Controls, menu rows and toggles keep stone a.

## Plan and checks

1. Exclude coins, badge buttons and picture choices in each stone selector.
   Add browser checks for their shape and face. At 393 × 852, compare the
   painted board with `taste/stone-a` and `claude/fault-round-2`.
2. Use a real `kingdown_open` result in the move-in-flight test. Check that
   `_meta.board_id` names the current board and that the move completes.
3. Replace the old Play menu QA step with the quick-start hall. Add a doc
   test that checks the hall controls against the page.
4. Run `npx tsc --noEmit` and `npm test` on this Mac. Run `plugin-ui` on
   the M1 in `~/projects/kd-od-base`, with the shared browser lock.
   No server code changes: `plugin-ui-http` is not required.
5. Get two independent reviews. Fix each confirmed fault. Commit locally
   on `claude/owner-decisions`. Do not push.
