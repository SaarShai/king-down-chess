# 30: plugin-ui passes on WebKit again

Status: in-progress

The ChatGPT iPhone app shows the widget in WebKit. tools/lib/checks.mjs can launch WebKit (7f3de41f, b1d69f7d: PLAYABLE_BROWSER=webkit), but no lane ran plugin-ui on WebKit after those commits. On the release candidate (94dde1a2) the WebKit run fails at tools/lib/plugin-cards-check.mjs:82 (checkCardChoices, from od-end): it waits 30 s for `#menu-sheet input:focus`, and the focus never comes. Log: scratchpad/lanes/release-candidate/webkit-base-1.txt.

## Parts

1. Run plugin-ui on WebKit through the check runner: PLAYABLE_BROWSER=webkit <scratchpad>/check-runner.sh <worktree> <m1 folder> plugin-ui. Fix each failure at its cause, one at a time, until the WebKit run passes.
2. For each failure, decide: a product fault (the widget does the wrong thing on WebKit: fix the product, with a unit or browser test), or a check that assumes Chromium behaviour (for example, WebKit does not focus a button or a radio on a click; Safari's focus rules). A check fix must keep the check's intent on both engines; never delete an assert to get a pass, and never raise a time limit.
3. Chromium plugin-ui and plugin-ui-http still pass at the final commit.

## Out of scope

The S5 client-state merge (it joins the release candidate later; its WebKit run comes after that merge).

## Plan and checks

1. Run the unchanged release code on WebKit through the approved runner. Record each failure and its cause.
2. Fix each product fault or browser-specific check assumption at its source. Keep each assertion and each time limit. Add or extend a test for each behaviour.
3. Run `npx tsc --noEmit` and `npm test` with the local test database. Commit the changes on `claude/webkit-rc`.
4. Run WebKit `plugin-ui` until it passes. Run Chromium `plugin-ui` and `plugin-ui-http` at the final commit. If the known 400 px end-card flake occurs in unchanged code, repeat once and record both runs.
5. Record each cause, fix, test, checked head and final runner exit line under `30 result`. Write the complete report to the lane report file.

Pass criteria: each required command exits 0; each browser log has the final runner exit line; the final code commit passes both browsers; no requested part is omitted without a reason.
