## Summary

Keep D09, D11 and D12. Change D10 to cover rematches and give a correct exit when account access stops. Change D15 to complete the support and notice paths for a suspended player. The records support the first-release cut, the shared game design and the separate local save. This review uses source and records only; live service behavior remains unverified.

## Decisions

Source key: `M` means main at `38a6bbff`. `R` means `claude/release-candidate` at `442c5eb3`. Repo paths start at `/Users/za/Documents/king down chess/`. Memory paths start at `/Users/za/.claude/projects/-Users-za-Documents-king-down-chess/memory/`.

### D09

Verdict: keep

No product fault has evidence. The separate page keeps the guest's current game, lessons and Workshop. The current entry connects the local game and its tools (`M:src/main.ts:80–106`). The current setup has no card field (`M:src/new-game.ts:26–41`). Thus, sign-in for cards and Classic limits new access; it does not remove current guest access.

The owner approves one account and one game pool, with website access later (`R:docs/specs/chatgpt-mvp/spec.md:32`). That record does not require the new features to work without sign-in. Sharing the account screens also fits the owner's one-product design rule (`memory/feedback-plugin-ui-uses-game-design.md:11–15`).

The guest cost is real: cards and Classic need an account in this release. The draft states that cost and requires a clear account entry. A local adapter remains later work. This is a smaller complete choice than a second setup and card flow.

Exact change: none. Keep the account-entry words in the browser sample, as the draft requires.

### D10

Verdict: change

The sign-in choice, fixed callback and account-ID rule are sound. The existing client supplies provider sign-in and session changes (`M:src/account/client.ts:14–31`). The research identifies the separate-user cases and the need for a live identity check (`docs/research/web-adaptation-2026-10-18/research-identity.md:65–75,122–131`). Do not add account merging to this work.

**Problem 1: the deletion limit omits rematches.** The draft names Create, Find, Accept and Join. A rematch creates a game inside a command. It does not call the public Create method (`R:src/match/service.ts:323–333`). It also copies both human seats. Thus, a check of only the named start operations leaves a new-game path open. An active player can also accept a rematch with a player whose deletion is pending. The plugin uses this same command service (`R:src/plugin/service.ts:43`).

Exact change: state, “While deletion is pending, the account cannot enter a new game through Create, Find, Accept, Join or Rematch. Apply this rule in the common game service on both surfaces. Check both human accounts before a rematch creates its seats. Keep current-game actions and deletion cancellation available. A retry of a completed command returns its recorded result.”

**Problem 2: the chosen verification call does not supply the promised suspension message.** The draft promises a suspension end date. The current MCP verifier turns a provider 401 or 403 into a general authentication error (`R:src/plugin/auth.ts:43–52`). The web handler then says “Sign in again” (`R:src/api/http.ts:113–116`). A suspended player can follow that instruction and still fail. The research confirms that a ban can stop sign-in and the current-user check (`docs/research/web-adaptation-2026-10-18/research-identity.md:79–83`).

Exact change: keep the live check for writes. Specify separate messages for a verified suspension, an expired or revoked session, and a temporary verification failure. Show a suspension date only from a trusted account-status result. Do not claim that the current-user call alone supplies that date. Put Support on each refusal screen. When the cause cannot be confirmed, give Retry and Support without a false instruction to sign in again.

### D11

Verdict: keep

No product fault has evidence. The local save holds a game and local settings (`M:src/screen/save.ts:11–19`). Account play has a separate settings service (`R:src/plugin/settings.ts:14–23`). Keeping these stores separate preserves the returning local player's game. It also lets the two account surfaces use one account-settings value.

Server-only totals and badges match the data that exists. Totals read finished server games, and badge awards use those games (`R:src/match/results.ts:37–58`). The owner asks for a registry and badges, but does not ask for a reconstruction of local wins (`R:docs/specs/chatgpt-mvp/spec.md:47–48`).

Per-tab drafts are acceptable with the stated limit. Ticket 11 says that closing a tab can discard an unsent draft, and requires the UI to state this limit (`docs/specs/web-adaptation/issues/11-save-ownership.md:23–25,43–45`). The engine stamp also follows the research's recovery rule (`docs/research/web-adaptation-2026-10-18/research-engines.md:58–60`).

Exact change: none. Keep the reload, storage-failure and account-change requirements from ticket 11 when the decision enters the spec.

### D12

Verdict: keep

No product fault has evidence. The owner separates the first submission from later updates. Direct card use, the later hall, the move chooser and the samples belong to that later list (`memory/project-first-submission-scope.md:11–20`). The draft keeps this work available through the shared UI without making a second web port. The plan permits those branches to land or be parked before extraction (`docs/specs/web-adaptation/spec.md:174`). It need not hold the web build for every sample.

Play now at Beginner follows the later build ticket and the current helper. New game retains the saved setup (`R:docs/specs/taste-recommended/issues/06-base-final-review.md:9–17,30–35`; `R:src/plugin/screens/setup-model.ts:27–30`). That is stronger evidence than the conflicting short summary of D2.

The rating choice also follows the owner: every eligible human game counts (`R:docs/specs/chatgpt-mvp/spec.md:46`; `R:src/match/results.ts:26–35`). Keeping No power in old local modes preserves their current rule (`M:src/new-game.ts:28,55–61`). Keeping D6 out avoids a new card-rule change. No new balance choice is needed here.

Exact change: none. Keep the later-work list and sample gates explicit. Do not reopen the first-submission cut.

### D15

Verdict: change

Keep Block, visibility, one shared budget, and no automated alerts or chat. Keep the choice to defer an in-app Report control. The later owner record expressly adds Block and leaves Report for later (`memory/project-first-submission-scope.md:14`). A complete support path can meet this release's need without another player form.

**Problem 1: a Profile notice does not reach every suspended player.** Suspension sets the Auth ban and stores a notice (`R:src/online/safety.ts:94–103`). The MCP verifier rejects a banned user's current-user check before a profile tool can run (`R:src/plugin/auth.ts:43–53`; `R:src/plugin/http.ts:94–115`). On the web, the proposed read window ends when the token expires. A player who returns after expiry cannot rely on Profile to read the reason or appeal instructions. Building the list once does not close this case.

Exact change: keep Profile notices for accounts that can open Profile. Add a documented manual support path for suspension and appeal notices when account access stops. Put its link on the signed-out and refusal screens. Keep public random matching closed until this path covers a suspended player with an expired token. This needs no automated mail job.

**Problem 2: the support address and moderation command do not form a complete report path.** The public page asks the player to send a handle and game time by email (`R:public/support.html:32–49`). The command lists, reads and acts on existing report rows; it has no support-report intake command (`R:tools/mod.ts:4–10,23–28`). Its action method requires an existing report ID (`R:src/online/safety.ts:71–79`). The draft does not say how an email becomes that report. A command that can act on a report is not proof that support can supply it.

The appeal text has a second gap. Stored notices direct players to a “Safety and reporting page” (`R:src/online/safety.ts:15,78`). That page remains a repo draft with open appeal details (`R:docs/safety/safety-and-reporting-draft.md:87–95,111–118`). The shipped Support page gives no appeal steps (`R:public/support.html:30–54`).

Exact change: before public random matching, record one support procedure from email receipt to report entry, owner action, notice and appeal reply. Name who handles it and the target response time. Provide the smallest operator intake step that the existing command needs; do not add a player Report screen for this purpose. Put real appeal steps on the public Support page and make stored notices point there. Require evidence for this complete path. The plugin's public release date alone does not satisfy this gate (`docs/specs/web-adaptation/issues/15-public-safety.md:31–37`).

## Other faults in the plan

none
