# Prototype browser routes and invite return

Type: prototype
Status: resolved
Blocked by: 06, 09, 10, 11
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:prototype

## Question

Can a player enter, leave, reload and resume every account flow with ordinary browser controls?

## Rule

A URL selects a screen or a game. It never takes a seat or submits a turn by itself.

## Options

1. Use the account hall, game and invite routes with browser history.
2. Keep every screen at the root URL and hold navigation only in memory.
3. Put the plugin in an iframe with a simulated host.

Recommended: 1. Direct links and the sign-in return become ordinary browser behavior, and a separate account page keeps the local engine state apart.

On yes: make a throwaway route prototype with fixtures and the game renderer. Show the route trace and the rendered screens to the owner. Keep it out of the product build until the flow is accepted.

## Prototype cases

- `/play/` opens the hall. `/play/profile` and `/play/settings` reload correctly.
- `/g/<id>` checks the account and the seat, then routes by server status.
- `/j/<token>` shows a preview. Sign-in returns to that preview. Join takes the seat only on its button.
- A code typed in the hall uses the same preview flow.
- Back from a board returns to the earlier page and does not abort the match.
- Back during a failed send keeps the receipt on its game. A late success does not move the player off Profile.
- An expired code, a taken seat, a deleted game and a wrong account each have a complete exit.
- After a join, the game URL replaces the token URL. Tokens never go to analytics or error logs.
- The old local game-link format still opens the local app.

## Pass evidence

A route table, a keyboard trace, a phone render, a desktop render and the owner's choice. A bare route stub or a screenshot with no Back and reload behavior does not resolve this ticket.

## Answer

Decided by delegation (owner, 2026-10-18: "regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."). One independent review checked the draft: accept with changes; its five required changes are in.

Prototype and evidence: branch `prototype/web-account-routes` (from `claude/release-candidate` `6dee1e8f`, last commit `1e079275`; a reference, never merged), folder `docs/research/web-adaptation-2026-10-18/routes-prototype/` on that branch:

- `README.md`: the route table, the rules and the findings.
- `trace.md`: the keyboard trace (22 steps, keys only) and 78 case rows, all pass (headless Chromium; Back, Forward and Reload are the browser's own).
- `renders/`: phone 390x844 and desktop 1440x900 (invite signed out, invite preview, hall, board with the real renderer, wrong account).
- `review.md`: the independent review.
- Read a file with `git show prototype/web-account-routes:docs/research/web-adaptation-2026-10-18/routes-prototype/README.md`. Run the prototype on that branch with `npx tsx tools/play-route-prototype.ts 5180` and open `http://127.0.0.1:5180/play/`; rerun the evidence with `npx tsx tools/play-route-trace.ts`.

Decisions:

- **Option 1.** Account routes with browser history: `/play/`, `/play/profile`, `/play/settings`, `/g/<id>` and the invite route `/j`. The root stays local play. Old local links (`?army=…&moves=…`, `?fen=…`, `?design=…`) open the local app unchanged. Paths outside the rules give 404 (no HTML catch-all).
- **Amendment to [ticket 06](06-hosting-routes.md): the invite token goes in the URL fragment.** A path token (`/j/<token>`) reaches the host's request logs before page code runs, even on a 404. The shared link becomes `<origin>/j#<token>`; a typed code opens `/j#<CODE>`. The route rule `^/j/?$` replaces `^/j/[^/]+/?$`, and the path form is not served (no released link uses it). `src/api/http.ts:69` still builds the path form; the build changes that one string. The spec line on `/j/<token>` and ticket 06's rule change at spec approval ([ticket 18](18-approve-spec.md)).
- **Known limits of the fragment.** A previewed invite stays in browser history as `/j#<token>` (Join replaces it, a preview does not); the token is single-use and ends after 7 days. A mail scanner that drops the fragment opens bare `/j`, whose exit gives the code field. Chat unfurl bots see only `/j`, so a link preview shows no game details; this is intended.
- **A URL only reads.** Opening, reloading, Back and Forward select a screen or a game; only a button takes a seat (Join) or sends a turn. `/g/<id>` routes by the server status (board, waiting, seat, end).
- **History.** In-page links push. Three moves replace: a canonical fix (`/play`, an unknown `/play/…`, an upper-case game ID), the sign-in callback (to its target) and a successful Join (to `/g/<id>`). Back from a game skips the used invite and does not abort the game.
- **Sign-in return.** Sign-in leaves with the SDK's own redirect, so Back at the provider returns to the page that asked. The callback is always `/play/`; the provider sees only that callback and a challenge, never the target. The tab's flow record (`flow`, `target`, `created`) stays in the tab, is read once and is removed in every case; the code leaves the address bar first; the target is rebuilt from the parsed route and must be an account route; a record older than 10 minutes or a bad target gives no game action. A return with no record (Back to the provider, a copied or crossed callback) shows "did not finish" or "old" with Retry and no game action. The website client keeps one PKCE verifier for all tabs (`localStorage`, `src/account/client.ts`), so two tabs that sign in at the same time cross: the later one gets Retry and no game action.
- **Receipts.** A turn's receipt goes into session storage before the send, keyed by user and game ([ticket 11](11-save-ownership.md)). It stays on its game after Back and reload, and the hall row shows it. Send again reuses the command ID and plays no second turn. A late reply repaints only its own game or hall row and never moves the page. An account change in another tab removes the old account's receipts.
- **Exits.** Signed out: Sign in (returns to the same route) or Play without an account. Wrong account: Switch account (returns to the game) or Your games. Deleted game: Your games. Expired invite or taken seat: a code field and Your games. Unknown code, malformed link, bare `/j`: a code field and Your games. A seat you already hold: Your games.
- **Logs.** Analytics and error logs get only the path and query: no fragment, `/j/<x>` as `/j/[invite]`, no sign-in code. The trace found no token or code in 105 analytics and error log lines, in Referer headers or in provider requests. The one server request path with a token is the path-form probe, which is the reason for the fragment form.

Follow-ups (no new ticket now):

- Contract note for [ticket 03](03-http-contract.md): a preview of an invite whose seat the actor already holds returns the game ID, so the page can replace `/j` with `/g/<id>`.
- The creator's wait screen has no invite after a reload (the server keeps only hashes). It offers "Make a new invite", which ends the old code and link; a URL never makes one.
- The prototype screens are stand-ins. Phase 2 puts the plugin's screens behind the page-host boundary; the route module (`src/play-prototype/routes.ts` on the branch) is the part to lift.
