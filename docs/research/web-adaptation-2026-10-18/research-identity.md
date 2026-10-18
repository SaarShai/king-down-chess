# Research: Prove one account across the web and ChatGPT

Date: 2026-10-18. Source: `claude/release-candidate` at `442c5eb3` and main at `38a6bbff`. A reviewer checked the main claims against the code.

> Plan references marked `P:` or `web-adaptation/issues/NN` use the independent plan's ticket numbers. In the final plan: 06 → 10 (account entry), 08 → 13 (routes), 10 → 15 (public safety), 11 → 07 (engines), 12 → 08 (release evidence), 13 → 16 (test gate), 15 → 17 (release route).

## Question

does one person who signs in on kingdown.dev (the website sign-in in src/account, Supabase Auth with Google and GitHub) and who connects the ChatGPT app (the plugin sign-in and consent flow: src/plugin/consent.html, consent.ts, auth.ts, src/plugin/http.ts, the OAuth checks in tools/plugin-oauth-check.mjs, docs/HOSTING.md, the release packet in docs/specs/chatgpt-mvp/release/) get the same Supabase user ID, so that one account owns the games and results on both surfaces?
Also answer: (1) How does each surface's token reach the server and how is it verified (src/api/http.ts sessionVerifier and its audience rules; the MCP token verifier)? Can a website session call /mcp, or an MCP token call /api? (2) What does Supabase Auth do when the same email arrives through two providers (automatic identity linking, manual linking), per the official docs? Is there a case where one person gets two users? (3) How long can a token stay valid after sign-out, a ban or a deletion request, and which server checks read the account status on sensitive actions (src/online/accounts.ts, safety.ts, the deletion grace in migrations 0008 and later)? (4) What does the website sign-in keep across the provider redirect today (path, query, hash; src/account/account.ts, client.ts), and what does a return to /j/<token> or /g/<id> need? (5) Which facts only a test account can prove.

## Answer

The same user record in the same Supabase project gives both surfaces the same account ID. (`R:src/plugin/consent.ts:18–26,50–54`; `R:src/plugin/auth.ts:33–53`.)
The code supports this result, but the live project and account match remain **unverified**. (`W:src/account/client.ts:9–16`; `R:tools/plugin-server.mjs:34–52`.)
Supabase links new OAuth identities with the same email, subject to its email and identity checks. ([Identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking#automatic-linking).)
Different emails or separate existing identities can give one person two users. ([Link decision source](https://github.com/supabase/auth/blob/ce9a8eee0cc042be8c7a42981a7ddae631e41d91/internal/models/linking.go#L63-L117).)
One shared ID owns the server games and results; the root app keeps a separate cloud save. (`R:supabase/migrations/0006_games.sql:38–65`; `R:supabase/migrations/0012_results.sql:3–28`; `W:src/account/client.ts:40–51`.)
A website session cannot authorize MCP, and an MCP token cannot authorize the website API. (`R:src/api/http.ts:28–39`; `R:src/plugin/auth.ts:24–39`.)
The website verifier can accept an old signed token until its expiry, without a fresh account check. (`R:src/api/http.ts:28–39`.)
The MCP verifier also calls Supabase for the current user on each request. (`R:src/plugin/auth.ts:43–53`.)
A deletion request has seven days of grace, and a new sign-in cancels it. (`R:supabase/migrations/0008_accounts_safety.sql:40–67`.)
The current website return URL keeps the path but drops the original query and hash. (`W:src/account/client.ts:29–31`.)

## Findings

Source check date: 2026-10-18. `W` means commit `38a6bbffb3b85f10bb9e6d23e8e1f394b781b4f4`. `R` means commit `442c5eb3840164b05d579c03b9fce2a9136d31f9`. Code citations give the commit, path, and source lines. `P` means the supplied `web-adaptation/` plan folder. Plan citations refer to the files as read for this report. Public source citations use a fixed commit where available.

1. **The account key is the Supabase user ID.**

   The website gets `session.user.id` and uses it as `user_data.user_id`. The consent page signs in to the configured Supabase project. It checks that the authorization request names the same user as its browser session. The OAuth access token has the consenting user's ID in `sub`. The MCP verifier returns that ID as the actor. The audience hook changes `aud`; it preserves the other claims. It does not make another user. Sources: `W:src/account/account.ts:78–87`; `W:src/account/client.ts:40–51`; `R:src/plugin/consent.ts:18–26,50–54`; `R:src/plugin/auth.ts:33–53`; `R:plugin-deploy/oauth-audience-hook.sql:48–57`; [Supabase OAuth token structure](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows#access-token-structure).

   The website source fixes one Supabase project URL. The plugin gets its Auth URL and database connection from server settings. The source does not prove that those live settings select the website's project and database. Startup checks the schema and OAuth resource rows. It does not compare the configured Auth project with the website constant. Thus the same-account claim has two conditions: the same project and the same user record. Live compliance with both conditions is **unverified**. Sources: `W:src/account/client.ts:9–16`; `R:src/plugin/consent-config.ts:4–15`; `R:tools/plugin-server.mjs:21–52`; `R:tools/plugin-db-check.mjs:34–45`.

2. **One ID can own one server record across both surfaces. The root save is a different store.**

   The API gets the actor from its verifier. The MCP server gets the actor from the MCP verifier. Both use the game service. A seat names `auth.users.id`; the `surface` field records web or ChatGPT use. Ratings, rating history, and badges also use that user ID. The result and history queries select by user ID, not by provider or email. Sources: `R:src/api/http.ts:72–94,110–123`; `R:src/plugin/http.ts:94–115`; `R:src/plugin/service.ts:23,33–49`; `R:supabase/migrations/0006_games.sql:38–88`; `R:supabase/migrations/0012_results.sql:3–28`; `R:src/match/results.ts:22–45,50–70`.

   This does not put the current root game's save into the account game list. The root app syncs settings, lessons, and one saved game through `user_data`. The account game service uses `games` and `game_players`. Main loads the root account module after the local board starts. Sources: `W:src/account/client.ts:40–51`; `W:src/main.ts:193–197`; `R:supabase/migrations/0006_games.sql:10–69`.

3. **The two sign-ins keep separate browser sessions.**

   The website uses local storage key `kingdown.auth`. Consent uses `kingdown-plugin-consent`. Both use PKCE and persistent sessions. Consent shows the current account and offers an account change before it reads an existing authorization grant. A website sign-in therefore does not itself select the consent account, even when both pages use the same origin. A separate consent origin also has separate browser storage. The account shown on the consent page is the account that the person connects. Sources: `W:src/account/account.ts:10–11,78–80`; `W:src/account/client.ts:14–16`; `R:src/plugin/consent.ts:18–26,40–54`; `R:docs/plugin-preparation.md:82`.

   The ChatGPT login is not the King Down user key in this flow. The consent login selects that key. The profile tool returns the verified user's ID as its stable profile ID. Sources: `R:src/plugin/consent.ts:45–54`; `R:src/plugin/server.ts:221–225`; [ChatGPT OAuth flow](https://developers.openai.com/plugins/build/auth#oauth-flow).

4. **The website bearer path exists in source, but production does not mount it at this commit.**

   The current root account client sends cloud-save and deletion calls through the Supabase client. It does not expose a token getter for the new account-play page. The online client accepts a token callback and sends the access token in the HTTP `Authorization` bearer header. The API extracts that header and verifies it before it calls a service. Sources: `W:src/account/client.ts:23–55`; `R:src/online/client.ts:17–34`; `R:src/api/http.ts:110–123`.

   The production server mounts internal jobs and MCP. It does not construct `createApiHandler` or `sessionVerifier`. The build adds function paths for MCP, consent, discovery, and internal jobs, with no API mount. The hosting record states the same limit. Thus this report describes the API's source contract, not a live website API pass. Sources: `R:tools/plugin-server.mjs:17,52–61`; `R:tools/plugin-server-build.mjs:63–74`; `R:docs/HOSTING.md:15`.

5. **The website verifier accepts only website session claims.**

   It checks the signature with the configured project's JWKS. It requires that project's issuer, ES256 or RS256, a valid expiry, a UUID subject, role `authenticated`, and `is_anonymous: false`. It requires the exact string audience `authenticated`. It rejects every `client_id` claim and a mixed audience array. It returns the lower-case subject as the actor. It does not read the current user or session. The handler also requires its configured host and same-origin browser requests. Sources: `R:src/api/http.ts:28–39,48–50,99–116`.

6. **ChatGPT supplies the MCP bearer. The widget uses host tool calls.**

   The widget calls `app.callServerTool`. It does not send the website session to the API. ChatGPT completes the authorization-code flow with PKCE, gets the OAuth access token, and sends that token in subsequent MCP bearer headers. The MCP HTTP handler verifies it before it constructs the per-request server and actor. Sources: `R:src/plugin/client.ts:24–43`; `R:src/plugin/http.ts:94–115`; [ChatGPT token flow and verification](https://developers.openai.com/plugins/build/auth#oauth-flow).

   The MCP verifier requires the configured project issuer and exact audience `<configured public origin>/mcp`. It checks ES256 or RS256, expiry, UUID subject, role `authenticated`, and an allowed OAuth `client_id`. If `scope` exists, it must contain `openid`. The verifier permits an absent scope claim. It then calls the fixed Supabase `/auth/v1/user` endpoint with the same bearer and the public key. The returned user ID must equal the subject. A 401 or 403 rejects access. A network failure or other provider error gives a temporary failure. Sources: `R:src/plugin/auth.ts:20–53`; `R:tools/plugin-server.mjs:34–36`; `R:src/plugin/consent-config.ts:13–15`.

   **The token types do not substitute for each other.** A website token fails MCP's audience and client checks. An MCP token fails the API's audience and no-client rules. The audience hook preserves website claims and maps only listed OAuth clients to their exact resource. These are source facts. The test files also specify both refusals, but this research run executes no test. Sources: `R:src/plugin/auth.ts:33–39`; `R:src/api/http.ts:34–37`; `R:plugin-deploy/oauth-audience-hook.sql:48–57`; `R:tools/plugin-oauth-check.mjs:171–179`; `R:src/api/http.test.ts:38–59`; `R:src/plugin/auth.test.ts:44–69`.

7. **Supabase owns automatic identity linking. An email match alone is not application proof.**

   The official docs say that a new OAuth identity with the same email links to an existing user. They exclude SAML SSO users from linking. They also describe the removal of other unconfirmed identities to prevent account takeover. This does not mean that both provider identities must already exist and be confirmed. Sources: [Supabase automatic linking](https://supabase.com/docs/guides/auth/auth-identity-linking#automatic-linking).

   The public Auth source first looks for an existing provider identity. It returns that identity's existing user when it finds one. For a new identity, it uses provider-verified emails, or emails accepted under `Mailer.Autoconfirm`, for email matching. With no accepted email, it selects account creation instead of email linking. The live provider email and Auth setting remain **unverified**. Source: [Auth link decision, lines 63–117](https://github.com/supabase/auth/blob/ce9a8eee0cc042be8c7a42981a7ddae631e41d91/internal/models/linking.go#L63-L117).

   Therefore one person can have two users. Examples include different provider emails, two existing provider identities with separate users, or separate Supabase projects. The first two follow from the link decision; the project case follows from each client's configured project. Do not promise that a later matching email merges two existing users. Sources: the link decision above; `W:src/account/client.ts:9–16`; `R:src/plugin/consent-config.ts:4–15`.

8. **Manual linking needs a signed-in user and an explicit Auth setting.**

   Supabase supports `linkIdentity` for an additional OAuth identity, including one with a different email. Manual linking must be enabled. The identity must not already belong to another user. Inference: this is not an API to merge two existing users and their games. The website and consent sign-in paths call `signInWithOAuth`; they provide no manual linking flow. Sources: [Supabase manual linking](https://supabase.com/docs/guides/auth/auth-identity-linking#manual-linking-beta); [official link requirements](https://supabase.com/docs/reference/swift/auth-linkidentity); `W:src/account/client.ts:29–31`; `R:src/plugin/consent.ts:22–26`.

9. **Token expiry, session revocation, and account status are different checks.**

   Supabase documents a default access-token lifetime of 3,600 seconds. The expiry setting can change. Neither project verifier enforces a maximum token age or a one-hour lifetime. Both check the issued expiry. The API comment's “1 hour at most” is therefore not an enforced limit. The live lifetime is **unverified**. Sources: [OAuth token lifetime](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows#step-6-token-response); [configurable session expiry](https://supabase.com/docs/guides/auth/sessions#what-are-recommended-values-for-access-token-jwt-expiration); `R:src/api/http.ts:24–39`; `R:src/plugin/auth.ts:33–39`.

   Both browser sign-out paths use scope `local`. This ends the current session; it does not end another device's or the MCP connection's separate session. If website sign-out cannot reach Auth, its error path removes local stored state. That local removal alone cannot revoke a token at the server. A token from an ended session can still pass the API's JWT checks until `exp`. Sources: `W:src/account/client.ts:17–21`; `R:src/plugin/consent.ts:40–43`; [Supabase sign-out scopes and token limit](https://supabase.com/docs/guides/auth/signout#sign-out-and-scopes); `R:src/api/http.ts:28–39`.

   The MCP check can stop access sooner. The public Auth source loads the user and, for a nonempty nonzero `session_id`, its session row. It rejects a missing user or session and a current ban. Thus a revoked MCP session, a current ban, or a hard deletion fails the next MCP verification on this Auth version. A website local sign-out does not revoke that separate MCP session. The hosted Auth version and its actual responses remain **unverified**. Sources: `R:src/plugin/auth.ts:43–53`; [Auth user route, lines 281–283](https://github.com/supabase/auth/blob/ce9a8eee0cc042be8c7a42981a7ddae631e41d91/internal/api/api.go#L281-L283); [Auth checks, lines 19–41 and 118–159](https://github.com/supabase/auth/blob/ce9a8eee0cc042be8c7a42981a7ddae631e41d91/internal/api/auth.go#L19-L41); [session lookup](https://github.com/supabase/auth/blob/ce9a8eee0cc042be8c7a42981a7ddae631e41d91/internal/api/auth.go#L118-L159); [current ban check](https://github.com/supabase/auth/blob/ce9a8eee0cc042be8c7a42981a7ddae631e41d91/internal/models/user.go#L997-L1003).

10. **Sensitive services do not have a common account-status gate.**

    `AccountService.profile` reads a pending deletion to return its dates. The request and cancel methods change that request. Handle, settings, relations, and notification writes do not first reject a ban or pending deletion. `SafetyService.report` checks the target and report data; it has no such actor-status check. The moderation path writes `auth.users.banned_until`, but does not revoke sessions there. Sources: `R:src/online/accounts.ts:36–43,47–114`; `R:src/online/safety.ts:36–48,94–99`.

    Game reads and writes check the seat and game state. Human starts also require a handle. Join and matching check invitation and block rules. These are not ban or deletion checks. The runtime role has no direct read access to `auth.users` under its stated grant contract. The API therefore cannot rely on the MCP user lookup to protect its own calls. Sources: `R:src/match/service.ts:40,125–138,204–235,273–284,295–349,378–405`; `R:plugin-deploy/runtime-role.sql:67–79`; `R:src/api/http.ts:28–39,72–94`.

    A ban does not change an already issued JWT. The API can accept it until expiry, although a particular operation can still fail another check. Hard deletion also leaves JWT verification possible until expiry. After deletion, profile, seat, and foreign-key checks can reject operations. These failures do not replace a single, explicit account-status refusal. Sources: `R:src/api/http.ts:28–39`; `R:src/online/accounts.ts:38–40`; `R:src/match/service.ts:40`; `R:supabase/migrations/0006_games.sql:38–65`; [Supabase account removal and token window](https://supabase.com/docs/guides/auth/managing-user-data#removing-account-access).

11. **A deletion request does not itself end access on both surfaces.**

    Migration 0008 replaces immediate deletion with a request. The default due time is seven days. A repeated active request keeps its date. The root client then signs out only its current session. Other sessions remain separate. Neither verifier reads the deletion request, and the normal service methods do not block on it. Inference: another active session can continue to obtain and use tokens during the grace, subject to Auth settings and the other service checks. Sources: `R:supabase/migrations/0005_accounts_v2.sql:55–63`; `R:supabase/migrations/0008_accounts_safety.sql:40–55`; `R:src/account/client.ts:17–21,34–38`; findings 9 and 10.

    A new row in `auth.sessions` cancels a pending deletion. The trigger applies to either sign-in surface. A token refresh that keeps its session does not trigger this insert. Reconnecting the plugin can therefore cancel deletion if it creates a new session. The actual hosted flow needs a live check. Sources: `R:supabase/migrations/0008_accounts_safety.sql:57–67`; [Supabase sessions](https://supabase.com/docs/guides/auth/sessions#what-is-a-session).

    Deletion is due after seven days; completion is not guaranteed at that exact time. The daily job selects due requests, checks report holds, ends active games, and calls the deletion helper. The helper rechecks the request, holds, and active games under a lock, then deletes `auth.users`. A failed job or a hold can delay it. Sources: `R:src/api/http.ts:147–148`; `R:src/online/jobs.ts:115–139`; `R:supabase/migrations/0007_jobs.sql:16–36`.

    Main's current account message says the account is deleted at once. The candidate changes that message to explain the seven-day grace and cancellation. The live migration state is **unverified**; the source message alone cannot prove deletion behavior. Sources: `W:src/account/account.ts:128–136`; `R:src/account/account.ts:128–136`.

12. **The website preserves a path, not a complete return state.**

    Its `redirectTo` is `location.origin + location.pathname`. For example, a page at `/g/<id>?view=moves#board` requests a return to `/g/<id>`. The original query and hash are absent. A token in the path `/j/<token>` survives in the requested path. A code held only in a query, hash, or page memory has no return store in this account client. These examples follow directly from the URL expression. Source: `W:src/account/client.ts:29–31`.

    `startAccount` loads the client for a stored user or a callback `code`. It clears known error query fields and an error hash. That error cleanup does not save the original route. The consent page handles a different return: it explicitly retains `authorization_id` on `/authorize`. Its local OAuth check uses mocked provider responses to check that return and PKCE. It cannot prove a real Google or GitHub redirect. Sources: `W:src/account/account.ts:92–105`; `R:src/plugin/consent.ts:17–26`; `R:tools/plugin-oauth-check.mjs:24–44`.

    A complete game or invite return needs a served account route, a completed PKCE exchange, the selected account, and a fresh server read. It also needs an allowed Supabase redirect URL. A fixed callback can retain a validated same-origin return path in per-tab storage; a direct callback can retain the path itself. The plan must choose one route contract. Preserve any required query or hash separately. Do not accept an arbitrary external return URL. Sources: `P:issues/06-account-entry.md:15–31`; `P:issues/08-routes.md:15–35`; [Supabase redirect allowlist](https://supabase.com/docs/guides/auth/redirect-urls#overview); [PKCE browser and device limit](https://supabase.com/docs/guides/auth/sessions/pkce-flow#limitations).

    On `/j/<token>`, return to a fresh preview. Keep that intent through handle entry. Take the seat only after the Join action. On `/g/<id>`, verify the current account's seat and use the current server game state. Opening a link must not submit a turn. These are plan requirements, not existing route behavior. Sources: `P:issues/08-routes.md:15,27–35`; `P:spec.md:210–215`; `R:src/match/service.ts:204–209,378–405`.

13. **The release packet specifies live checks; it does not prove website account continuity.**

    The live table has empty result cells. Its web and iPhone account rows concern the ChatGPT connection. The owner steps require separate test accounts and an OAuth client for the exact MCP resource. They also require signing keys, the session trigger, redirects, and the audience hook. Existing local checks mock the provider and use a disposable database. They cannot prove the actual project settings or equal user IDs across the root website and consent. Sources: `R:docs/specs/chatgpt-mvp/release/LIVE-CHECKS.md:3–14`; `R:docs/specs/chatgpt-mvp/release/OWNER-STEPS.md:8–17,33–47,115–129`; `R:tools/plugin-oauth-check.mjs:24–44,158–183`; `R:docs/plugin-preparation.md:25–27`.

## Facts that need a live check

All facts below remain **unverified** in this report. The owner or an approved tester performs them only under a separate approval. An approved database reader supplies only the named account IDs, statuses, dates, and counts. Do not export sessions, token values, passwords, or full Auth rows.

| Fact | Who checks it and how | Evidence to keep |
|---|---|---|
| Both surfaces use the same project and database. | The owner compares the deployed website's public Auth project with the consent/server configuration and database project. An approved database reader checks the test users in that database. | Project-match result, source/deploy identity, and test user IDs. No connection value. |
| Same-provider sign-in gives one ID. | A tester uses Google on the website and on consent, then repeats with GitHub. Compare the website session user ID with the MCP profile tool's `structuredContent.id`. The owner can use an approved private inspection path for the website ID. | Equal IDs for each provider, with time and device. The comparison fields come from `W:src/account/account.ts:80–87` and `R:src/plugin/server.ts:221–225`. |
| Google and GitHub link for the test person. | A tester uses providers that return the same verified email, in both sign-up orders. An approved database reader checks that both provider identities name one user. Repeat with different provider emails to check the separate-user path. | User IDs, provider labels, and identity counts. An email match alone is insufficient. See findings 7 and 8. |
| Existing duplicate users and manual-link policy. | An approved reader reports whether the approved test identities already name separate users. The owner reads Manual Linking and email confirmation settings. Do not link, unlink, merge, or delete accounts as part of this report. | Current mapping and settings status. Any repair requires its own decision. |
| Correct token audiences and real provider acceptance. | The owner checks the active signing key, OAuth client, resource row, and enabled token hook. An approved tester completes real consent and refresh. After the API exists, check both token-type refusals through an approved private harness. | Claim-check results and HTTP outcomes only. No bearer or refresh token. See findings 5 and 6. |
| Effective token lifetime and session limits. | The owner reads the live JWT expiry and session settings. A tester measures issue and expiry times without publishing the token. | Lifetime in seconds, session policy, and elapsed time to refusal. One hour is not assumed. See finding 9. |
| Sign-out, connection revoke, and ban behavior. | A tester checks website local sign-out, consent local sign-out, and MCP connection revocation separately. With specific approval, the owner applies a temporary ban to a disposable test user. Compare both surfaces before and after expiry and refresh. | Refusal times, affected session labels, HTTP outcomes, and cleanup result. The ban case changes live state and needs its own approval. |
| Deletion grace, cancellation, and completion. | With specific approval, a tester requests deletion for a disposable account. An approved reader checks the due date and cancellation fields. Check refresh without a new session, then a fresh website sign-in and plugin reconnect. A completion check uses the real due date and job outcome. | Request/due/cancel/done times and session-count changes. Do not shorten a live deadline. See finding 11. |
| Return routes and account isolation on real devices. | After the routes exist, a tester opens `/j/<token>` and `/g/<id>` while signed out. Check success, denial, stale callback, handle entry, two tabs, and account change. Check the browser or device used by the actual provider flow. | The final route, preview or seat result, and absence of the prior account's private state. Hide active invite tokens. See finding 12. |
| One game and one result across surfaces. | After the API and account page exist, one test user resumes the same game on both surfaces. A second user checks the other seat. Finish one human game and inspect its result once. | One game ID, the expected seats, one result, and the expected rating/history rows. This extends the plan's cross-surface case. (`P:spec.md:259–267`.) |

A read-only settings report can prove configuration at its check time. A database report can prove the stored identity mapping. Only an actual approved account flow can prove provider return, consent, refresh, and device behavior for that flow. None proves every future sign-in.

## Effect on the plan

1. **Keep the existing account system. Qualify its one-account promise.** Retain the pick in ticket 06 and spec lines 173–179. State the condition as the same Supabase project and user ID. Add the same-provider and same-email two-provider evidence above. Do not add application email matching or assume that manual linking merges existing users. A duplicate-user case needs a separate account decision. This is required before phase 2 exposes account reads. Sources: `P:issues/06-account-entry.md:15–31`; `P:spec.md:171–179,298–299`; findings 1, 7, and 8.

2. **Complete the session interface and mount before use.** Ticket 06 needs a small session/token interface from the existing client. Tickets 03 and 15 must mount `createApiHandler` with `sessionVerifier` and add the API deploy route. Preserve the exact audience split. Do not route the web client through MCP or give it the MCP token. This belongs in phase 2 before the page makes API calls. Sources: `P:issues/06-account-entry.md:23`; `P:issues/15-release-route.md:23–25`; `P:spec.md:173–177,299`; findings 4–6.

3. **Make the sensitive-action policy explicit before public API exposure.** Ticket 10 already requires ban and deletion checks, but the current services do not supply them. Define which operations stop at once for a revoked session or ban. Define what a pending deletion permits, including its cancellation path. Put the accepted check at the API or shared service boundary, with the runtime permissions it needs. Do not claim that the current MCP lookup protects API calls. Replace the one-hour claim with the measured expiry or an enforced bound. Phase 2 needs its read/account policy; phase 3 needs the write policy; phase 6 keeps the public safety gate. Sources: `P:issues/10-public-safety.md:15–31`; `P:spec.md:178,259,299–303`; findings 9–11.

4. **Specify one return contract in tickets 06 and 08.** A path token survives the current redirect expression, but that fact does not supply route serving, PKCE completion, or a preview. Choose a direct return or a fixed callback with a validated per-tab return target. Keep Join explicit and retain its intent through handle entry. Add denial, stale callback, two-tab, query/hash, and wrong-account cases to phase 2; verify full Join in phase 5. Sources: `P:issues/06-account-entry.md:23–31`; `P:issues/08-routes.md:15–35`; `P:spec.md:299,302`; finding 12.

5. **Carry the deletion message and separate-store boundary into phase 1.** If migration 0008 applies, the page must explain the seven-day grace and cancellation. Keep local saves in their existing store. Do not present equal user IDs as a conversion of local saves or ratings. Sources: `P:spec.md:160,221,225,298,330`; findings 2 and 11.

6. **Extend tickets 13 and 15 with a separate live identity record.** Local source and mock checks cover claim rules and refusal cases. They do not close the live identity gate. Add the approved account, configuration, revocation, and cross-surface result checks above to the release packet. Record the exact source, deployment, schema, devices, and observed limits. Reuse the phase 5 cross-surface game case and phase 8 release check. Do not mark the present empty release rows as passes. Sources: `P:issues/13-test-gate.md:15–23,33–37`; `P:issues/15-release-route.md:15–35`; `P:spec.md:267,290,302,305`; finding 13.

This report changes no plan or product file. It records source findings and proposed plan effects only. It runs no test, project request, sign-in, or deployment.

## Review correction

Finding 8 says that the website and consent paths call `signInWithOAuth`. The consent page also has a password sign-in for the one review account (`src/plugin/consent.ts:30–37`); a before-user-created hook refuses all other password sign-ups. That path makes a separate email-and-password identity, so the live identity checks include it. The no-manual-linking result stays true.
