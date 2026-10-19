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

## Pre-merge run (2026-10-18; the ticket stays open)

A pre-merge run compared the live app source (`04b7af87`) with the release candidate (`52aca5fe`) at 390 × 844 and 1440 × 900. Report: `docs/research/web-adaptation-2026-10-18/baseline-pre-merge/report.md` on branch `prototype/web-account-sample` (the render pairs stayed in a temporary folder). The run after the merge still decides this ticket.

- Visible changes that reach the site on merge: "Tap" becomes "Select" in the turn lines, the armed-power hints, the Beast chain refusal and the Beast and Reaver guides (`src/turn.ts`, `src/context-line.ts`, `src/read.ts`); the board canvas stays hidden until the stone art decodes (first frame only); the Privacy, Support (a new Credits section) and Terms pages change their text.
- Already live, so not new: the coordinate limit below 8 CSS px, the 5-second idle stop and the growing context row.
- No visible change: normal coin faces match; the new disabled-coin style has no trigger in the local app.

## Merge record (2026-10-19)

- PR 61 merged at `cd8fa9f2` (2026-10-19 03:53 UTC). The first deploy stopped at the engines-in-use check: a source-stamp engine was missing ([ticket 07](07-engine-compatibility.md)). PR 62 archives it; the deploy runs again after PR 62 merges. The deploy publishes the combined tree, so kingdown.dev gets the visible changes of the pre-merge run above with it. Each is a recorded pick or fix: the Select words (owner pick B4), the first-frame board load (plugin fault F13), and the submission text of the legal and support pages.
- Steps 2 to 4 come from that deploy's record (its `npm test`, default browser checks, engines report, migrations and deploy ID), from the release owner. Steps 1, 5 and 6 run after the deploy, because the deploy's browser checks use this Mac.
