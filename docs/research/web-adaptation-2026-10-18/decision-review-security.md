## Summary

Keep D09, D11, and D12. Change D10 and D15 before approval. The main gaps concern sign-in flow selection, account-bound retries, new-game status checks, and the support process. The cache plan also needs one failure case. This review uses source and official documents; live behavior remains unverified.

## Decisions

Source key: `M` means main at `38a6bbff`. `R` means `claude/release-candidate` at `442c5eb3`. Plan paths start at `docs/specs/web-adaptation/`. Draft references name the supplied `decisions-draft.md`.

### D09

Verdict: keep

The separate page is a sound controller boundary. The account board calls the shared `setRules` function during draft work. A full page change gives each controller its own lifetime. The local app also has its own save and Workshop entry. Evidence: `R:src/plugin/screens/board-model.ts:26–30,51–59`; `M:src/screen/save.ts:18–34`; `M:src/main.ts:96–105`.

The page split does not give account data a separate security origin. Browser storage has no path access boundary. The proposed common worker policy and account-scoped state remain necessary. The plan already requires both. Evidence: `spec.md:195–198,242–244`; [HTML storage security](https://html.spec.whatwg.org/multipage/webstorage.html#cross-directory-attacks).

**Exact change:** None. Keep both parts. Keep the worker and account-state gates when the separate page enters the build. I find no security reason to add a second local setup or card UI to this release.

### D10

Verdict: change

Keep the existing website session, the exact token audiences, and the rule against application email matching. The API rejects an OAuth client token; MCP requires its own resource audience. Consent has its own storage key and selects its own account. A website sign-in therefore does not prove which account connects to the plugin. Evidence: `R:src/api/http.ts:28–39`; `R:src/plugin/auth.ts:24–39`; `R:src/plugin/consent.ts:18–26,45–54`. Supabase supplies automatic identity linking; the application must not infer a user ID from an email. [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking).

1. **The return contract does not select a PKCE flow.**

   Two tabs can start sign-in with the shared Auth storage key. The current client supplies no flow ID. The SDK's default verifier entry names the latest flow, so the first callback can use the wrong verifier and fail. A separate return target in each tab does not solve that problem. Evidence: `M:src/account/account.ts:10–11,78–79`; `M:src/account/client.ts:14–16,29–31`. The pinned dependency supports explicit flow selection. Evidence: `R:package-lock.json:1557–1558,1625–1626`; [Supabase PKCE overlapping flows](https://supabase.com/docs/guides/auth/sessions/pkce-flow#overlapping-flows).

   **Exact change:** Keep the fixed `/play/` callback. Start OAuth with browser redirect disabled. Store the returned SDK `flowId`, return target, and creation time in this tab before navigation to the provider. On return, use that flow ID in one explicit code exchange. Disable automatic exchange in this callback path. Expire and consume the record; clear it on success, cancel, and failure. With no valid record, show Retry and take no game action. Keep the target on the same origin and within the named account routes. This uses the SDK's existing flow support and keeps invite tokens out of the provider return URL.

2. **A token-only getter does not bind a retry to its account.**

   The existing HTTP client gets a token on every attempt. Its command retry keeps the old input. If account A changes to B during the retry delay, the next attempt can send A's input with B's token. A Create or Find has a separate start ID for each actor, so a stable command ID alone does not prevent a new game for B. Evidence: `R:src/online/client.ts:30–34,46–49`; `R:src/match/service.ts:23–26`. The existing session callback also runs through a timer. Evidence: `M:src/account/client.ts:24–27`.

   **Exact change:** Return the user ID with the token. Bind each queued job, pending command, and retry to the user ID at its start. After each wait and token read, require the same user ID before send. Reject a different user; do not substitute that user's token. Account change closes the old queue, clears its private state, and prevents late replies from drawing. Retain the original ID and input only for recovery under the original account.

3. **The deletion rule omits rematches and the other seat.**

   A rematch creates a game inside the command path. It does not call public Create. The draft's list of Create, Find, Accept, and Join therefore misses a new-game path. Evidence: `R:src/match/service.ts:323–333`.

   The draft also leaves a waiting host case open. A normal player can accept or join a host's waiting game after the host requests deletion or receives a ban. The current seat checks inspect blocks and invitation rules, but no account status. Evidence: `R:src/match/service.ts:273–284,394–405`; `R:src/match/store.ts:113–140`.

   **Exact change:** Put the new-game deletion rule in the shared service for both clients. Include rematch offer and acceptance, and invite renewal. Define a waiting game as not yet admitted for this rule. Before admission or a rematch, check both human accounts. Exclude an ineligible host from the lobby and refuse the seat at commit. Keep cancel, deletion cancellation, and actions in an already admitted game available under the stated policy. A retry that only reads a completed start receipt must not create a new game. Keep the seven-day grace and cancellation on a new sign-in. Evidence for that existing contract: `R:supabase/migrations/0008_accounts_safety.sql:40–67`.

4. **The stated refusal cannot come from the current verifier unchanged.**

   The MCP verifier turns both Auth 401 and 403 into one authentication error. The API turns that error into “Sign in again.” Neither path returns a suspension date. The account profile has deletion dates but no ban field. Evidence: `R:src/plugin/auth.ts:43–52`; `R:src/api/http.ts:113–116`; `R:src/online/accounts.ts:36–43`. Auth distinguishes a banned user from a missing session, but its generic ban response supplies no end date. [Official Auth checks](https://github.com/supabase/auth/blob/ce9a8eee0cc042be8c7a42981a7ddae631e41d91/internal/api/auth.go#L19-L41).

   **Exact change:** Preserve a typed suspended, revoked, or unavailable result. Obtain the current suspension end through a narrow server status read. Do not grant the runtime general access to Auth user rows. On provider failure, refuse the write with a temporary error. State the guarantee as refusal at verification; do not promise to cancel a write that already passes verification. Keep the chosen read-until-expiry policy explicit. Supabase sign-out ends the selected session; a JWT alone remains valid until expiry. [Supabase sign-out](https://supabase.com/docs/guides/auth/signout#sign-out-and-scopes).

### D11

Verdict: keep

The ownership choice is sound. Local saves use `kingdown.save`; account settings use a separate server store. Server commands verify the seat, receipt, and revision before commit. Evidence: `M:src/screen/save.ts:18–34`; `R:src/plugin/settings.ts:18–23`; `R:src/match/service.ts:294–305`. The full account/game/base key and engine stamp improve on the plugin's short game tag. Evidence: `R:src/plugin/client.ts:8–12,27–35`.

Keep all the requirements in ticket 11, especially unchanged pending input, fresh account/game reads, shape validation, and private-state removal. They are part of the decision. The web store must preserve full pending input; the plugin serializer removes game IDs, codes, and handles for its host. Evidence: `issues/11-save-ownership.md:25,43–45`; `R:src/plugin/client.ts:31–35`.

**Exact change:** Keep the choice. Add one acceptance case for a copied tab. Browser session storage can start as a copy of another tab's store. Reconcile the saved pending command with the server under its original ID; do not make a new ID merely because the tab is new. Later storage changes in one tab do not clear another tab's session store, so each tab also handles the shared Auth account-change event. [Storage copy rules](https://storage.spec.whatwg.org/#legacy-clone-a-traversable-storage-shed); [HTML storage events](https://html.spec.whatwg.org/multipage/webstorage.html#the-storage-interface). No new tab-lock service is necessary.

### D12

Verdict: keep

The scope choice matches the later build record. Play now selects Beginner and disables Arrangement. The saved setup still supplies New game. Evidence: `R:src/plugin/screens/setup-model.ts:6–19,27–30`; `R:docs/specs/taste-recommended/issues/06-base-final-review.md:9–17,30–35`.

The rating rule also matches the code: a finished non-solo game with two human users changes both ratings. Local results do not enter that write path. Evidence: `R:src/match/results.ts:22–35`. The owner record places Report later and adds Block to the first release. It does not require a web-only copy of the deferred screens. Evidence: `memory/project-first-submission-scope.md:13–15`; `issues/12-scope-picks.md:25–34`.

**Exact change:** None. Keep the final accepted merge as the source baseline. Carry later screen changes through the shared UI. Do not treat this scope choice as evidence that a live release passes its security gates.

### D15

Verdict: change

Keep chat, push, and event email off. Keep Block, visibility, common account budgets, and the common admission gate. The owner record supports the decision to keep Report out of the first release. Evidence: `memory/project-first-submission-scope.md:14`.

1. **Admission must precede the new provider check.**

   The API currently awaits its verifier before it takes any slot. D10 adds a network user check to write verification. If that order stays, valid signed tokens can start unbounded provider waits outside the common gate. MCP already takes its slot after local claim checks and before the provider request. Evidence: `R:src/api/http.ts:110–120`; `R:src/plugin/auth.ts:40–48`; `R:src/plugin/http.ts:78–84,94–97`.

   **Exact change:** Use this order for API writes: local JWT checks, shared admission, current-user check, bounded input, operation budget, service work. Keep the slot until service work ends, also after disconnect. Share the existing database counter rows and values. State that the four-slot bound applies per server instance. It is not a bound across all deployed instances. The research already makes that distinction. Evidence: `docs/research/web-adaptation-2026-10-18/research-routes.md:79–100`.

2. **The support mailbox does not feed the moderation command.**

   The support page tells players to email a handle and game time. The command can list, inspect, act on, appeal, or hold a stored report. It has no report intake operation. Its action method requires an existing report row. Thus the proposed mailbox and command do not yet form a complete handling path. Evidence: `R:public/support.html:32–49`; `R:tools/mod.ts:23–28`; `R:src/online/safety.ts:71–78`.

   **Exact change:** Add one operator intake step to the existing command. It creates a normal report row from a support case, with the target account/game, reported handle, category, evidence reference, and note. Then use the existing action and appeal commands. Record the responsible person, response target, and notice procedure. Keep public random matching off until that full path passes its release check. A plugin public-release date does not prove that the path operates.

3. **Profile alone cannot deliver a suspension notice.**

   MCP checks the current user for every request. Auth rejects a banned user. The player therefore cannot read the new Profile notice list through MCP during suspension. The website's chosen JWT read window also ends at token expiry. Evidence: `R:src/plugin/auth.ts:43–53`; [Auth ban check](https://github.com/supabase/auth/blob/ce9a8eee0cc042be8c7a42981a7ddae631e41d91/internal/api/auth.go#L19-L41); [Supabase session revocation](https://supabase.com/docs/guides/auth/sessions#how-to-ensure-an-access-token-jwt-cannot-be-used-after-a-user-signs-out).

   The stored notice directs the player to a Safety and reporting page. That page exists as a draft with open appeal fields; the public support page has no appeal procedure. Evidence: `R:src/online/safety.ts:14–15,100–102`; `R:docs/safety/safety-and-reporting-draft.md:87–95,111–114`; `R:public/support.html:30–52`.

   **Exact change:** Keep the actor-scoped Profile list for users who can sign in. Add manual support delivery for each suspension and appeal outcome. Give the public support page the actual appeal address and steps. Do not weaken token checks to deliver notices. Make notice delivery and support intake explicit prerequisites of phase 6; do not leave them with the general Profile work in phase 7. Evidence for the current order: `spec.md:316–317`.

## Other faults in the plan

1. **A game GET writes presence under the read policy.**

   The plan permits reads with a valid JWT until expiry and requires current-user checks for writes. But the existing game GET calls `games.seen` after the view read. A revoked or banned token can therefore still write presence if the build classifies this route only by its GET method. Evidence: `R:src/api/http.ts:73–77`; `R:src/match/service.ts:201–202`.

   **Exact change:** Make the game GET read only. Expose the existing `seen` service as a separate protected write when presence enters the slice. Apply the status and admission rules to that write.

2. **The cache-policy reply needs an interrupted-cleanup case.**

   The plan requires a policy reply after activation and relies on activation to delete old caches. The worker specification permits activation to complete even when its handler does not finish. A worker restart also loses an in-memory cleanup result. A policy-version reply alone therefore does not prove that old private entries are gone. Evidence: `issues/06-hosting-routes.md:31–32`; `spec.md:242`; `R:public/sw.js:26–30`; [Service Worker activation](https://w3c.github.io/ServiceWorker/#activation-algorithm).

   **Exact change:** Make the policy reply await a successful, repeatable purge of old application caches. Run that purge on a policy request when the worker has no completed cleanup result, including after restart. On purge failure, keep private calls closed. Add interrupted activation and cache-deletion failure to the worker upgrade acceptance cases.

The remaining cache and invite rules are sound. Keep the public-file allowlist, the controller check, and account-route cache bypass. Cache Storage is separate from the HTTP cache, so request or response `no-store` alone is insufficient. [Cache lifetime rules](https://w3c.github.io/ServiceWorker/#cache-lifetimes). Invite tokens use 32 random bytes; the server stores hashes, limits short-code attempts, and checks expiry, use, blocks, and seat state at Join. Evidence: `R:src/match/service.ts:353–406`; `R:src/match/store.ts:105–118`. Keep the explicit Join action, token URL replacement, and no-referrer policy in `spec.md:219,244`.

No tests, browser checks, project-service calls, or sign-ins form part of this review. Live Auth settings, support staffing, and device behavior remain unverified.
