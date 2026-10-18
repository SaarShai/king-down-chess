## Summary

Keep D09, D11, and D12. Change D10 to cover rematches and to remove a refusal message that the current status check cannot supply. Change D15 to complete the support and notice paths, including access after a suspension. The plan also needs a clear rule for activity writes and an update to its approval text. This review uses source and records only; it makes no claim about live service behavior.

## Decisions

Source key: `M` means main at `38a6bbff`; `R` means the release candidate at `442c5eb3`. Plan paths start at `docs/specs/web-adaptation/`. The draft is the supplied `decisions-draft.md`.

### D09

Verdict: keep

The separate page is the smallest complete option in this plan. Local play has its own setup, save, and local game links. Its setup includes device play and Workshop designs. The engine has one global rules object. A second controller on the same page needs more coordination. Evidence: `M:src/new-game.ts:26–61`, `M:src/screen/save.ts:11–34`, `M:src/screen/links.ts:9–23`, and `M:src/rules/rules.ts:768–839`.

Keeping new setup and cards in account play also avoids a second local implementation. The local link format carries the army, moves, kings, and design; it has no card-hand field. Evidence: `M:src/screen/links.ts:13–23`. The choice matches `spec.md:164–168` and `comparison.md:24,52–53`. I find no contrary owner record in the supplied scope.

Exact change: none. Keep the later local adapter outside this build. Show the account entry and its added features in the browser sample.

### D10

Verdict: change

The session boundary is sound. The existing client owns the session and exposes session-change callbacks. The HTTP client already accepts an asynchronous token getter. A small getter and a redirect argument are sufficient; a second sign-in client is unnecessary. Evidence: `M:src/account/client.ts:14–31` and `R:src/online/client.ts:17–34`. The fixed callback and checked return path fit ticket 10 and the route plan.

Two parts need repair:

1. **The deletion rule misses rematches.** The draft lists Create, Find, Accept, and Join (`decisions-draft.md:17`). A rematch also creates and inserts a new game through the command route. Neither the current service nor its wrapper checks pending deletion there. Evidence: `R:src/match/service.ts:295–306,323–333`. The server role can read deletion state: `R:plugin-deploy/runtime-role.sql:101` grants SELECT on `account_deletions`, and `R:src/online/accounts.ts:36–43` already reads it. No new account table or access to `auth.users` is necessary.
2. **The provider check cannot supply “suspended until a date.”** The current-user check maps both 401 and 403 to the same authentication error. It reads only the user ID from a successful reply. The server role has no direct access to `auth.users`. Evidence: `R:src/plugin/auth.ts:43–52` and `R:plugin-deploy/runtime-role.sql:67–79`. Thus the proposed check can refuse a write, but it cannot by itself name the cause and end date.

Exact change: keep the existing website token checks, then add the current-user call for writes. Keep provider failures separate from invalid sessions. Put the pending-deletion rule in the common game service so both clients use it. Cover Create, Find, Accept, Join, and rematch offers and acceptance. A human rematch must check both users before it creates their next game. Keep decline, cancel, current-game play, and account-deletion cancellation available. Preserve receipt recovery: a retry that returns an existing effect does not create a new game. The existing receipt checks provide the place for this distinction (`R:src/match/service.ts:129–137,239–240,305`).

Replace the unconditional suspension-date promise with: “An authentication refusal asks the player to sign in again or contact support. Show a suspension end date only from a verified account notice.” Keep the seven-day deletion message, which the account service can supply. Do not widen access to `auth.users` for a message.

### D11

Verdict: keep

The stores already have different duties. Local save and sync use `user_data`; account settings use `player_settings`; totals and badges use server game records. Evidence: `M:src/account/client.ts:40–51`, `R:src/plugin/settings.ts:14–23`, and `R:src/match/results.ts:22–45,50–59`. Moving all of these into one store adds work and risks the current local game.

The decision also carries ticket 07's engine stamp into the draft key. This fits `spec.md:191–198,214`. Ticket 11 already requires unchanged command IDs, a fresh read before recovery, and private-state removal on account change (`issues/11-save-ownership.md:25,43–45`). The draft does not remove those requirements.

Exact change: none. Keep command receipts separate from unsent turn drafts. An unsupported engine must not erase the record of a command whose result is still unknown.

### D12

Verdict: keep

The accepted merge gives a finite base. The named later branches contain the stated work. For example, direct coin use exists at `b3b52a47:src/plugin/screens/board.ts:239–247`; Collection cost text exists at `b3b52a47:src/plugin/screens/collection.ts:39–41`; hall presets exist at `06c746b0:src/plugin/screens/setup.ts:55–62`. A selective move through the common UI is smaller than a web-only copy.

The quick-start choice agrees with the explicit build record and current code: `R:docs/specs/taste-recommended/issues/06-base-final-review.md:30–35` and `R:src/plugin/screens/setup-model.ts:27–30`. The rating choice agrees with owner decision Q10 and the result code: `R:docs/specs/chatgpt-mvp/spec.md:46` and `R:src/match/results.ts:26–35`. Local No power remains valid in `M:src/new-game.ts:58–61,140–150`.

Exact change: none. Apply the existing “land or park” rule before extraction (`map.md:17`; `issues/02-shared-client.md:33`). Record a parked item as later work, as ticket 12 requires. Keep the current cost display distinct from D6's proposed rule change.

### D15

Verdict: change

Keep Block, visibility, and shared limits. Keep automated alerts off. Support by email is a valid scope choice: the public support page already takes reports about offensive handles (`R:public/support.html:32,49`). The later owner record also keeps Report for a later update (`memory/project-first-submission-scope.md:13–15`). The following gaps prevent a complete support-only release:

1. **An email does not enter the moderation queue.** The support page gives an address. The moderation command only lists, reads, and acts on existing report rows. Its action method requires a report ID. Evidence: `R:tools/mod.ts:23–28` and `R:src/online/safety.ts:71–78`. The draft names both ends but gives no intake step between them.
2. **A shared Profile view cannot deliver every suspension notice.** The service stores the notice after a suspension, but the plugin verifier rejects the banned user's next request before a Profile call. Browser reads in D10 remain possible only until the token expires. Evidence: `R:src/online/safety.ts:94–102` and `R:src/plugin/auth.ts:43–53`. A player who cannot sign in still needs the reasons and appeal path. Also, the stored statement points to a “Safety and reporting” page, while the source holds that page as a draft (`R:src/online/safety.ts:15`; `R:docs/safety/safety-and-reporting-draft.md:1–15`).
3. **The notice read needs an explicit access contract.** The server role can read only `user_id`, `kind`, and `payload`. It cannot read notice IDs or dates. Browser roles have no direct table access. Evidence: `R:plugin-deploy/runtime-role.sql:72` and `R:supabase/migrations/0006_games.sql:158–167,197–206`. A normal dated, paged list therefore needs a small grant change as well as a view.
4. **The proposed budget mapping misses new games from rematches.** The research maps Create and Find to the shared create counter, but omits rematches. The current tool mapping also omits them. Evidence: `docs/research/web-adaptation-2026-10-18/research-routes.md:98–100`, `R:src/plugin/server.ts:71–74,176`, and `R:src/match/service.ts:323–333`.

Exact change: keep Report out of the first visible UI. Make public matching depend on one complete support path. Specify a bounded admin intake step that records a support report in the existing report table and returns its ID. Keep the existing moderation command. Record who reads reports and how the owner sends reasons and appeal replies to a player who cannot sign in. Link those steps from Support; remove the stored statement's link to an unpublished page. Automated mail jobs remain off.

For signed-in players, add one common notice service and view. Read only the verified actor's moderation and appeal rows. Return a bounded page with ID, kind, payload, and creation date. Add only the required server-role column grants and startup probe. Add the HTTP read and the plugin read; a shared screen alone does not supply both transports. Do not add read receipts or general alert delivery.

Charge rematch offers and acceptance to the existing create budget on both surfaces, once per attempt. Keep decline outside that budget. Take a shared request slot after local token checks and before the provider call, as the current plugin path does (`R:src/plugin/http.ts:78–98`). This bounds verification work too.

Remove the requirement to wait for the plugin's public release date. Use shared service readiness, the tested support path, notices, limits, and the owner's web publish go as the gates. The inventory explicitly keeps plugin submission work outside the website release (`inventory.md:134`). A host release date does not prove that these service paths work.

## Other faults in the plan

1. **A game GET also writes activity.** D10 permits reads with an unexpired token, but the current game GET calls `games.seen`. A revoked session can therefore still write activity through this read path. Evidence: `R:src/api/http.ts:73–77`; `R:src/match/service.ts:201–202`. Exact change: remove the implicit activity write from GET. Add a small protected activity route that calls the existing `seen` method. Put it behind the write-status check and shared admission gate. The plugin already separates these operations (`R:src/plugin/server.ts:166–167`). Add this operation to ticket 03.
2. **The approval text does not reflect the delegated authority.** `map.md:19`, `spec.md:7`, and `issues/18-approve-spec.md:15,23–25` still require the owner's direct answer. The current owner record expressly delegates the web plan's decisions, samples, and spec approval, with independent review (`memory/feedback-ux-choices-delegated.md:11`). Exact change: record “decided by delegation (owner, 2026-10-18)” where that authority applies. Keep the evidence, sample, and review gates. Preserve the separate owner gates for deploys, runs, rule changes, spending, and feature merges.
