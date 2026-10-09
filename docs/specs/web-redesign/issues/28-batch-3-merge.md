# Batch 3 merge

Status: claimed

Decision: decided by delegation (2026-10-09).

## Plan and checks

1. Check the branch and each lane report. Merge new main commits first.
2. Revert the parked Workshop change on the sheets lane. Merge words,
   board, sheets and end in that order. Keep both intents in each conflict.
3. Run typecheck and `npm test` after each merge. Run all browser checks,
   then plugin-ui and plugin-ui-http. Record the plugin page size.
4. Build and render W1 to W12. Each report must have zero faults. Inspect
   all batch 3 stills, videos and W2 smallPhone stills for layout faults.
5. Record the evidence and push the integration branch with its hook.

## Evidence

The worktree starts clean at 0d88005, the origin branch head. All four
lane exits are 0 and each final report has `ok: true`. Main has four new
doc commits; its merge has no conflict. The plugin page starts at
4,295,044 bytes. The sheets lane reverts its Workshop CSS, the related
browser assertion and its ticket claim before it merges. W12 has no lane
change. The Workshop stays parked.
