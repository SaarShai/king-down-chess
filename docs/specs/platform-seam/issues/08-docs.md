# The docs say what the code does

Status: ready-for-agent. The owner approved [the spec](../spec.md) on 2026-11-25. Decision 1 is yes: the off build ends with ticket 07, and the rollback text says so.

Class: B (a doc of a rollback path gets an independent read). Size: S.

## Problem

- [HOSTING.md](../../../HOSTING.md) says that `/j` keeps the old page; on the site it goes through `join.html` to the new page. For the cutover and the rollback it points to a runbook at a path where no file is (line 172). It does not say that every release builds with the switch on.
- The comment in `next.html:37` ("no manifest and no service worker until cutover") is stale.
- [IOS.md](../../../IOS.md) calls `src/platform.ts` "the one seam" and gives its rules as text only.
- [FORMS.md](../../../FORMS.md) says that the web game screen and the plugin board screen are separate code. That is true for the new game screen. The account pages of the website (`/play`, `/g/<id>`) run the plugin screens through `src/online/runtime.ts`.
- The retro still lists item 9 as open.

## Change

- HOSTING.md: the true `/j` route; the runbook pointer goes or points at the file; the rollback that decision 1 leaves.
- `next.html`: the comment, if ticket 07 has not replaced the file.
- IOS.md: beside each rule, the test that holds it (tickets 01 to 03).
- FORMS.md: one line on the account pages.
- The retro: item 9 is "decided, not built", with a link to this spec.

## Checks

`npm run test:docs`.
