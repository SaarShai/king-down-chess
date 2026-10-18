# Draft decisions for the web adaptation plan (for review)

Authority: the owner delegated these decisions on 2026-10-18 ("regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."). Deploys, runs, rule changes and spending still need his word.

Plan folder: /Users/za/Documents/king down chess/docs/specs/web-adaptation/ (map.md, spec.md, inventory.md, comparison.md, issues/). Research: /Users/za/Documents/king down chess/docs/research/web-adaptation-2026-10-18/ (research-identity.md, research-routes.md, research-engines.md, lane reports, critic.md).

## D09 — Choose the web play boundary (issues/09-web-play.md)

- Part 1: option 1. A separate account-play page (`/play/`, `/g/<id>`, `/j/<token>`) with the plugin's account screens; the root stays local play; each links to the other. Reason: one copy of the account UI; one controller per page isolates the engine's global rule state; the local product does not change.
- Part 2: option 1. Signed-out play stays as it is for the first release; the five-switch setup, cards, Classic, the hidden arrangement and server computer games need sign-in. The local home gets a clear entry to account play that names what an account adds (exact words in the browser sample). Revisit a local game-client adapter for the shared UI after phase 3 (map fog). Reason: option 2 makes a second setup UI and a second card board, and needs a new local link contract; the trade-off is that guests do not get cards or Classic in the first release.

## D10 — Choose sign-in and account continuity (issues/10-account-entry.md)

- Option 1: the existing website sign-in (Google, GitHub) and its session. The root and the account page share the same auth storage key, so one sign-in covers both pages.
- Session interface: a small getter in the existing account client for the current access token, plus a change event for sign-out and account switch. The browser API client takes the token from that getter.
- Return contract: a fixed callback. The account page calls sign-in with one redirect URL (`<origin>/play/`). Before it leaves, it saves the return target (a same-origin path in the account route family, with its query and hash) in session storage. After the PKCE exchange it reads the target, accepts it only if it matches the route patterns, and replaces the URL. Reason: one allowlisted redirect URL; the invite token never goes to the auth provider inside a redirect URL; the query and hash survive. A sign-in that ends in another browser gets a clear retry.
- Status policy: API writes check the current user the same way the MCP verifier does (the Supabase current-user call), so a ban or a revoked session stops writes at once. Reads accept a valid token until it expires; seat and visibility checks still apply. A pending deletion refuses new games (create, find, accept, join) with a message that names the grace and how to cancel it; current games can still be played, resigned or aborted. Refusals name the state (suspended until a date; deletion pending). Measure the provider call's rate limit in phase 3.
- Identity: never link or merge accounts by email. If the live check finds two users for one test person, record a separate account-link decision. The review account's password sign-in stays plugin-only. Opponents see only the handle and the preset picture.

## D11 — Choose save and settings ownership (issues/11-save-ownership.md)

- Option 1: the local save and its sync stay as they are; the server owns account games and account settings; per-tab drafts and pending commands go into session storage.
- The draft key holds the user ID, the full game ID, the turn base (position and rules) and the View's engine stamp (from ticket 07). An unsupported engine stamp keeps no local draft.
- Local and account settings with the same meaning (symbols only, threats) stay separate at first. A later shared value gets its own ownership decision.
- Profile totals and badges count server games only. Local wins are not counted backwards.

## D12 — Choose the shipped picks and later work (issues/12-scope-picks.md)

- Part 1: option 1, all built in-scope work at the accepted PR 61 merge.
- Part 2: the approved code outside PR 61 (od-board direct card use and Collection costs; od-home presets and chips; od-look L2 move chooser; the b2 and c5 taste branches after their samples) reaches the web only through the shared UI after it lands in the plugin. No web-only port.
- Part 3: Play now always uses Beginner and New game keeps the saved level (the selected D2 option, the later build ticket and the current code). The rating rule stays as built (all eligible human games count). Local modes keep No power (they do not change under D09). The open plugin samples follow the plugin's answers and appear at browser sizes in the browser sample. D6 card costs stay out of scope (a rule change).

## D15 — Choose the public play and alert scope (issues/15-public-safety.md)

- Option 1: email, push and chat stay off; Block, Unblock, visibility, limits and support carry to the web.
- One per-player budget across both surfaces: the shared counter rows and one admission gate per server instance, from the first served write route.
- Report: the web uses the same public safety scope as the plugin: Block, Unblock, visibility, the support page contact and the owner's moderation command. No in-app Report control in the first web release. Random web matching opens to the public no earlier than the plugin's public release, on the same scope. Add an in-app Report (the existing schema and service) before any free-text or chat feature, or when support reports show a need. Reason: one pool needs one safety scope; with chat off and preset pictures, the abuse surface is handles and play.
- Account notices: refusals name the account state (D10). A short notice list on Profile (an actor-scoped read of the stored notices) is built once in the shared UI, so both surfaces get it, and it is a gate for public random matching on the web.
