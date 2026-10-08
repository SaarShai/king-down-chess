# Keep the selected game when a chat reopens

Status: claimed

## Reproduction

In the live ChatGPT host, the second test account opens a solo game, then joins the first account's friend game through Games. Both players complete two turns. Reload the second chat. Its board returns to the original solo game at move 1, rather than the joined game at move 3. The friend game remains saved.

## Plan and verification

Keep the saved widget's selected match when the host first replays its original tool result. A later host tool result may still select a different match. Always read the selected match from the server; do not restore a saved board snapshot as authority.

Make the local host preserve widget state and replay the original result even after in-board game creation. Check remount after creation and joining, saved command retry, failed reads and a later host game switch. Run the plugin browser checks and required tests. Release through the approved plugin path and repeat the joined-game reopen in ChatGPT.

## Evidence

The corrected host test fails against the old board: after a failed initial read, Reload selects the original game and never reaches the saved move number. The first host result now keeps the saved widget match ID. Later host results still select their given match. No saved board snapshot is trusted.

The fixture browser check passes, including a joined Black seat after remount, a lost reply with the same retry ID after remount, read failure and recovery, and a later host game switch. The local host now models the documented [ChatGPT widget-state extension](https://developers.openai.com/plugins/reference) and retains the original tool result after in-board game creation.

`npm test` passes 1,379 unit tests and 42 artwork checks; 12 database cases skip without the database setting. The same browser checks also pass against compiled HTTP MCP with real PostgreSQL (`npm run check:browser plugin-ui-http`). The push and release checks use the disposable database setting to include the 12 database cases.

## Release

All 1,391 tests and 42 artwork checks pass in the push gate. Both hosted verification jobs and the hosted test job pass. PR 14 merges as `e6825528594f7f60bf8e3d3971df0bb6af320e9f` under the existing fix-release approval. The release script tests fresh main and publishes deployment `dpl_LRrSo8nwYHYMo6X3c2c7FkBUVhpz`. All release tests, compiled HTTP and worker checks, protocol check, three browser checks and unsigned live checks pass. Log: `/tmp/kingdown-recovery-release.log`.

The live check still fails after this release. Create a solo board with the second account, join the existing friend match through Games, confirm Black at move 4, then reload the chat. The board returns to White at move 1 in the original solo game. The loaded script contains the new first-result selection code, which rules out an old cached resource.

## Focused diagnosis

Use that three-step live loop as the pass/fail signal. Next distinguish an absent or late widget-state API from a later state overwrite. Temporary `[DEBUG-selected-game]` console records contain only booleans and a method type: API availability, saved-match presence, first-result status and whether a result matches the saved ID. They contain no identifiers, credentials or game data. Remove them after the live cause is known.
