# F-002: describe card actions correctly

Type: bug
Status: in progress
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

Staging release and saved-account verification remain pending.
