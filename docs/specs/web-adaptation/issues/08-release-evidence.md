# Collect the final plugin release evidence and the web baseline

Type: task
Status: open
Blocked by: none
Starts: when PR 61 merges (an outside event, not a ticket)
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:task

## Question

Which exact merged source, schema and checked build may the web work use, and what does the merge alone change on the live web app?

## Rule

A moving release branch and an old pass log do not define a build base.

## Steps (after the PR 61 merge; the plugin session owns the merge)

1. Record the merge commit and the source tree identity. List the path delta against this plan's base (`442c5eb3`) and the rows of [the inventory](../inventory.md) that it changes.
2. Record the full test and named browser results at that commit, with skips and known limits. Record real-device evidence where it exists; a desktop WebKit pass is not an iOS swipe result.
3. Record the applied migration numbers and runtime grants from an approved release record (no credential file is opened), and the engine versions that active games use, from an approved read-only report.
4. Record the deploy ID, its source commit and the recovery procedure from the release owner.
5. **Web baseline.** Record the commit that kingdown.dev serves now. Run the full web suite and a render compare of the merged main against pre-merge `origin/main` (two stable captures of pre-merge main first). Split the visible changes into those already live and those that arrive with the merge. List each visible change that reaches the live web app with no web work: coordinate labels hidden below 8 CSS px, passive board effects that stop after 5 seconds, the Select words in shared text, the growing context row, disabled coins that keep their face, the hidden-until-first-frame board load. Each item is a recorded owner pick (carry it) or a new web trade-off (show it to the owner before a deploy).
6. List the approved later-update branches (`claude/od-home`, `claude/od-board`, `claude/od-look`, `taste/b2-row-preview`, `taste/c5-seat-reveal`) and their state: merged, in work or parked.

## Pass criterion

Every record names the checked source and its result. Missing operational facts stay explicit gates. This task does not authorize a deploy, a database write or a visual change.
