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

PR 15 adds the diagnostic and merges as `7c91f0f43578b28e33a50901b88a693f78f30ea9`. All checks pass and deployment `dpl_BkjdqtxZCvHKius7eCrnFnNhSS7L` is live. Old chat responses retain their board resource after Refresh tools; a fresh tool response loads the diagnostic.

The repeatable live check reports `Black, move 4` before reload and `White, move 1` after reload. The trace reports an available widget API and setter, then a state event with the saved match present, then a state event with it absent. On reopen the saved match is absent. The two writes in `show` conflict: `setWidgetState` saves the selected game, then the asynchronous `updateModelContext` replaces that snapshot. The host test must model that replacement. Use the widget-state writer when available and the standard model-context writer on hosts without it; do not send both.

The host test with that replacement fails before the repair: remount never reaches the saved move number. After the repair, both fixture and real HTTP/PostgreSQL browser checks pass. Saved widget state also carries the revision that the model context previously supplied. The temporary diagnostic code is removed. The browser check also exercises a host without the optional widget-state API and verifies its standard model context.

## Final repair release

PR 16 merges as `72163dd29d4c8698eaf3119041cf36d1a2a18b51`. The push gate passes all 1,391 tests and 42 artwork checks. Both hosted verification jobs and the hosted test job pass. The approved release script tests fresh main, including the compiled HTTP/PostgreSQL path, worker, protocol and all three browser checks. Deployment `dpl_6tkacvfzYGBNub6732YdfwsHt6bm` is live and passes the unsigned live checks. Log: `/tmp/kingdown-state-writer-release.log`.

The fresh live board has no diagnostic code. The immediate Join/reload loop still fails: Black at move 4 becomes White at move 1. One measured reload starts 72 ms after the new status appears. Waiting until Join is enabled also fails when reload follows immediately. After a fullscreen change and a separate read/reload of the first account, the second account does restore Black at move 4.

A second check keeps the board inline. Join completes, then a full chat reload starts 25,867 ms later. The same board restores Black at move 4. No fullscreen change occurs. This confirms normal inline reopening after the repair and rules out a required presentation-mode change. The first account also restores White at move 4, and its completed solo boards still show checkmate.

## Remaining timing boundary

Keep this ticket open for the immediate full-page reload case. The documented widget-state setter is synchronous and has no save acknowledgement. Its state is scoped to the rendered UI; [OpenAI's state guide](https://developers.openai.com/plugins/build/chatgpt-ui#manage-state) requires server storage for durable cross-session state. The measured tests show eventual selection persistence, not an immediate durability guarantee. Do not add an arbitrary delay or mark the instant-reload case passed. The server's game state remains saved, and reopening the match by ID restores the correct seat and position.

A strict guarantee for a selection made just before page exit needs either a supported host save acknowledgement or a server-owned board selection with a stable per-board identity. That is a distinct storage contract from the current widget-scoped selection. Review that contract before a further implementation; do not replace each board's choice with an account-wide latest-game pointer.

## Immediate-reload repair plan

The owner asks to finish both desktop items. Give each launched board a server-owned UUID in its original tool result. Save its selected match for that actor before returning a successful create, join or resume result. Reload resolves that board UUID on the server even if the host loses its most recent widget write. Keep selections independent across boards and users; every read still checks the match seat. Browser widget state retains pending commands but is not the selection authority. Add a restricted table with cascading account/match deletion and no browser-role grants. Test dropped widget writes, independent boards, other-account access and failed selection. Apply the reviewed additive migration through the signed-in SQL dashboard, then release and repeat the instant-reload loop.

The strengthened HTTP browser check fails before the repair while waiting for the joined Black seat after remount. The host drops widget writes before Join and the check waits for a new server read, so it cannot pass against the old iframe. The original check could inspect the old frame before remount completed. Log: `/tmp/kingdown-immediate-red.log`.

The repaired check passes against the fixture and real HTTP/PostgreSQL server with all widget writes dropped during Join. Each launched board now has an actor-owned server selection. Tests verify independent boards, cross-account rejection, seat checks, deletion cascades and restricted-role access. All 1,395 tests and 42 artwork checks pass; protocol, three browser checks and doc checks pass. Logs: `/tmp/kingdown-desktop-tests.log`, `/tmp/kingdown-immediate-green.log`, `/tmp/kingdown-desktop-protocol.log`, `/tmp/kingdown-desktop-oauth.log`. The OAuth check first stops without its required disposable database setting, then passes with that setting.

The additive production migration and restricted grants are applied through the signed-in SQL editor. A read-only connection with the existing runtime credential confirms RLS enabled, no anon/authenticated access, and the required runtime read/selection access. The review confirms that no browser-supplied actor is trusted and each selected match still requires a seat. Live verification follows release.
