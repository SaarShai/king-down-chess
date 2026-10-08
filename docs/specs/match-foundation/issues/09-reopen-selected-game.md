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
