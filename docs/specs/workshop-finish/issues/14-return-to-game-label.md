# F-101: name the Workshop return destination

Type: bug
Status: resolved
Severity: S3

## Owner request

“fix the confirmed Workshop ‘Menu’ button issue on staging and verify it. keep the playtest going, including the Beast wording and phone promotion checks. only ask me when absolutely necessary.”

## Cause and change

Workshop's upper-left control closes the Workshop and returns to the board. Its Menu label promises another destination. Desktop and phone reports agree; a different reader repeats the issue in WebKit.

Use Game as the visible label and Back to game as the accessible name. Keep the arrow, target size and close handler. The open library sheet still closes first. This change uses the shared Workshop control for all viewports. No game rule, account or saved record changes.

## Plan and verification

1. Check the shared control, callers and browser-check selectors. Change only its text and stale comment.
2. Run relevant existing Workshop source and browser checks. Check the rendered desktop and phone name, return destination and game-state preservation.
3. Commit the checked change on the staging branch. Use the existing guarded preview release, preserve server/engine hashes, and assign only the staging alias.
4. Ask active players through their local mailboxes to load the new build at a safe point and verify the button. Do not take over their browsers or disturb the Beast and phone promotion checks.

Acceptance: the label predicts the board destination on desktop and phone, the same game remains after return, and the ordinary game Menu still opens. Production stays unchanged. No further app repair is authorized.

## Source verification

The shared control has one caller in main.ts. Its click handler, CSS target and game state are unchanged. The existing browser check now selects Back to game by accessible name and checks the visible Game label; it still checks focus return and the open library sheet behavior. Current Workshop documentation uses the new label.

Type checks,18 selected Workshop UI/CSS tests and54 artwork tests pass. The full Workshop browser check passes in131.3 seconds. This is a focused test run, not the full source suite. The coordinator reviews the small diff; no independent code review is claimed. Staging verification by the active players is next.

## Staging verification

Source4e15ff1b is released as preview dpl_6mNnbGyQhNN7sJD3uuab7YZfXJSS and assigned only to kingdown-staging.vercel.app. Built page/service-worker hashes match the live alias. The server, consent, runtime and11 archived engines match the prior release. Artifact checks pass.

The active WebKit desktop tester verifies Game / Back to game at15:03 UTC, one-click return to the same board and normal Menu. The Chromium phone tester verifies the accessible name and same return at15:16 UTC. Its prepared h7-pawn/h8-empty promotion remains untouched. The coordinator reads both records and views before/Workshop/after screenshots. Parent-workspace evidence: playtest/reports/f101-fix/verification.md. No extra app change or deployment is needed. Production stays unchanged; the playtest continues.
