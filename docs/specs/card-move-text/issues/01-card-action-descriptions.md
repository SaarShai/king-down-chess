# F-002: describe card actions correctly

Type: bug
Status: resolved
Severity: S3

## Owner request

“fix the confirmed card-move text issue on staging and verify it with the test accounts. keep the playtest going and only ask me when absolutely necessary.”

## Evidence and cause

Two test accounts repeat wrong text for Curse, Earth Quake and Salvation in game 18f13558-205c-8853-b400-2e7976e56e2a. The board effects are correct. See playtest/reports/tickets/F-002.md outside this repository. The shared formatter treats these effects as normal piece moves. It uses the card player's colour for an enemy piece, the Quake centre as a move, and an empty Salvation arrival square as a piece.

## Plan and checks

1. Add regression cases from legal engine moves. Check both colours, an empty and occupied Quake centre, returned pieces and copied cards. Confirm the old formatter fails.
2. Add only the required shared text branches. Check staged and replayed shared-board text. Run the focused tests and the relevant browser check.
3. Obtain an independent diff review. Commit the checked source and use the guarded staging release. Verify public artifacts and engine archives.
4. Ask active players through their mailboxes to refresh at a safe point after release. Verify the corrected saved history and new card actions with the saved accounts. Keep the playtest running.

Acceptance: the text names the actual actor, pieces and squares; no null move remains for these effects; existing rules and ordinary move text keep their behavior; staging saved-account checks pass. Production stays unchanged.

## Source verification

The original formatter fails 12 selected regression assertions. The final formatter passes 94 selected tests in move-text.test.ts and board-model.test.ts, including both colours, copied effects, the B card variant, owned names, staged text and saved history. Type checks and 54 artwork checks pass. The first extended run catches two wrong test expectations: the B card has a B label, and owned names omit an article. The tests now follow those existing names. The emitted web-game browser journey passes in 52.2 seconds. A separate reader finds no should-fix issue. The product change adds seven formatter lines; no rule or record changes.

Staging release and saved-account verification pass. Source ba42b41a is published as preview dpl_8Y8a6ZPRhtMQCirepCqfLKZU6ep3 and assigned only to kingdown-staging.vercel.app. Public page and service-worker hashes match. Server, consent, runtime and all 11 engine archives match the recorded prior release. Artifact checks pass.

The original P1/P3 game has all six corrected card rows in the fresh P1 session. Both Curse colours, both Quake push lists and both Salvation returns match the original board evidence. All 18 saved actions remain. The coordinator reads the full text and views the screenshot. P2 phone confirms the handle, correct games and one normal move plus a computer reply. No failed request or console error appears in the coordinator check. Evidence: parent workspace playtest/reports/f002-fix/verification.md and rounds/03/p1-f002-check.md / p2-f002-check.md.

The four-account playtest continues. Additional WebKit/Firefox checks and fresh card actions in an existing P2/P3 game remain playtest coverage; they are not claimed as passed here. Player agents keep browser ownership until they finish. Production stays unchanged.
