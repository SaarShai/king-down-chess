# F-101: name the Workshop return destination

Type: bug
Status: claimed
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
