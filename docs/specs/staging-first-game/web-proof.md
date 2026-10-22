# Website and MCP browser proof

Status: complete.

## Plan and checks

1. Build the emitted website and combined server in a temporary folder. Serve the actual output routes on loopback. Use a fresh test database and local signed website tokens. Block all external requests.
2. Create a friend game with the website controls. Join with MCP. Check that each setup view hides the other choice until both seats are ready.
3. Select Flame and Haste. Send e2-e3!H and e3-e4 with the canvas and End turn control. Lose the server reply and reload. Check command identity and one revision change. Resume the full game URL and the same account through MCP.
4. End the game with MCP. Check the website result and save setup, board and result screenshots. Check browser errors and resource failures.

This check proves the local host harness. It does not prove a real ChatGPT host or a published staging deployment.

## Local entry into account play

`npm run check:browser account-discovery` uses the same compiled service harness for the first title, returning Home and Menu links. Navigation must not create a game, submit a command, import a local save or discard it on return. An offline click stays local; a committed local move must survive an offline reload. Check the actual link, Review, Moves and Today bounds in active and finished Home states: a zero-height grid wrapper can pass an overlap check while its children overlap. Keep short-screen controls reachable by scrolling. Provider login and actual identity switching require separate hosted evidence.

Provider choices come from public auth settings only when a signed-out player reaches sign-in. Reuse the same reader in account play, local Account and connection consent. Local startup and signed-in play must not request settings. Failed or empty settings offer retry, preserve the local-play escape and never guess that a provider is enabled. Keep the approved review password path. Synthetic settings cover failure/retry and disabled providers in `account-discovery` and `plugin-oauth`; their account and grant assertions stay intact. `KINGDOWN_HOSTED_SIGNIN_ORIGIN=https://kingdown-staging.vercel.app` adds a fresh anonymous hosted check to `account-discovery`. It allows only GET requests to that staging origin and its public provider settings. It never starts OAuth or sends a game command. This proves visible choices, not provider login or a second identity. See [ticket 46](issues/46-available-sign-in.md).

## Evidence

- `npm run check:browser web-game`: pass in 21.5 seconds on Chromium. The emitted `/play/` and `/g/<id>` routes use the combined website and real HTTP/MCP backend.
- The fresh `kingdown_web_proof_test` database has migrations 0001–0016. The website uses a locally signed ES256 session. The current-user hook requires loopback and test mode. The browser blocks every external request.
- The real website creates the friend game. MCP joins. Both views hide the other setup choice. The website selects Flame/Haste and sends `['e2-e3!H', 'e3-e4']` in one command.
- The server applies that command, then the browser loses the reply. Reload sends the same command ID and input again: two requests, one revision change. A direct `/g/<id>` load and the same account through MCP read the same board.
- MCP resignation and the website result agree: White wins by resignation. The final revision is 6. The browser has zero failed resources or external requests and zero unexpected console errors.
- Cleanup leaves zero games, outbox rows and test users in the private database.
- Screenshots and `proof.json`: `evidence/staging-local-browser/` in the independent project, outside the application repository. The runner log is in `web-proof-wXCveT` under the local temporary check output folder.
- `KINGDOWN_TEST_FILE=tools/check.test.ts npm test`: 5 tests, typecheck and 53 artwork checks pass, zero skips. The main task owns the complete suite.

The browser proof found two asset faults. Relative emitted entry assets returned HTML on `/play/`; authored public font and image paths returned 404 on direct game loads. The asset owner fixes both. This check retains the resource and script MIME gates. Screenshot review then finds that setup has no visible board. The shared runtime owner moves the CSS selector pass after import expansion. The final check requires a visible setup canvas, privacy veil coverage, table grid and styled player strips before capture. All three final screenshots pass visual review.

This is a local harness proof with fresh test identities. It does not validate a real ChatGPT host, provider login or a published staging deployment.
