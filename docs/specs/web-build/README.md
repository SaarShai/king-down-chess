# Web build

This folder holds the build tickets for [the adaptation spec](../web-adaptation/spec.md). [The release route](../web-adaptation/release-route.md) fixes public exposure, stops, recovery and packet requirements. [The test gate](../web-adaptation/test-gate.md) fixes the checks. The tickets split those slices into work for one fresh agent session each; preparation steps have an observable check before their consumer opens.

## Current gate

[Adaptation ticket 18](../web-adaptation/issues/18-approve-spec.md) approved the spec on 2026-10-19, at `2837bcc6`, before the plugin deploy record (owner, 2026-10-19). Each build branch starts from the current main and rebases onto main after that deploy. A publish also needs the deploy record in [ticket 08](../web-adaptation/issues/08-release-evidence.md) (step 4). Use no old release candidate or parked branch as a build base.

## Owner and branch gates

- The owner delegates plan choices, sample acceptance and spec approval after independent review. That delegation gives no merge, run, deploy, spending, rule-change or database-write authority.
- Use one codex/web-* branch per ticket, with the project worktree procedure. Each branch starts from the current main. Each non-trivial diff needs a reader who does not write it, confirmed fixes and the owner's merge word.
- Before each publish, bring its branch up to date with main (the last live source and every earlier slice it needs). Repeat the source checks and the independent review before the owner's merge word.
- Each publish needs a separate owner go for its exact source and public scope, a reviewed release packet, a compatible recovery build and the one deploy path. A preparation-only ticket has no publish of its own; it joins a later approved carrier scope.
- The plugin session keeps src/plugin/ until its handover. Ticket 05 records that outside event and the sole writer before a shared move. Parking closes only the land-or-park condition. The 27 features of the five parked branches stay in [shared screens later](../shared-screens-later/README.md).
- Required database, engine, device, cache, authorization, support or recovery gaps stop the applicable publish. Real Android has no named tester/device yet. The final speed numbers follow accepted baselines. Do not put code checks or live work on this Mac while the plugin release uses it.

## Order

Prepare the driver, then publish the safe worker. Add the closed API dispatch with no publish of its own. Prepare read safety and the account-off control. After the shared-file handover, share the account boundary and prove stored-engine support. Then publish account identity/reads; later slices open their own complete operations on the server.

Phase 4 has three option tickets. Phase 6 prepares support and notices before public matching, then adds the temporary-computer handoff. Phase 7 has record, Collection and settings tickets; it can start after the friend slice and before phase 6. All paths meet at the full release gate. Input and recovery checks belong to each feature as it arrives.

Blocked by uses only ticket numbers in this folder. Starts records outside events. Every ticket also needs reviewed ticket 18 approval and its own Starts conditions; a cleared numeric edge alone does not start it. Change a ticket to ready-for-agent only when its inputs and outside events exist. Keep the ticket open until its checks, review and required owner words have evidence.

| Ticket | Phase | Blocked by | Starts | Publish |
|---|---|---|---|---|
| [01 · Add the web journey driver and push gate](issues/01-web-test-driver.md) | 1 | none | Approval | No own publish |
| [02 · Publish the safe public worker](issues/02-safe-worker.md) | 1 | 01 | Approval | Separate go and packet |
| [03 · Add the closed API dispatch](issues/03-closed-api-dispatch.md) | 2 | 02 | Approval | No own publish |
| [04 · Make game reads safe and add account-off control](issues/04-account-read-safety.md) | 2 | 03 | Approval | No own publish |
| [05 · Share the account client and page host](issues/05-shared-account-boundary.md) | 2 | 03 | Approval; src/plugin/ handover | No own publish |
| [06 · Prove stored-engine continuation on both surfaces](issues/06-stored-engine-support.md) | 2 | 05 | Approval; recorded src/plugin/ handover and sole shared-file ownership | No own publish |
| [07 · Open the safe account page and reads](issues/07-account-entry.md) | 2 | 04, 06 | Approval; src/plugin/ handover | Separate go and packet |
| [08 · Finish one protected account computer game](issues/08-computer-game.md) | 3 | 07 | Approval | Separate go and packet |
| [09 · Play Classic and a chosen piece pool](issues/09-classic-piece-pool.md) | 4 | 08 | Approval | Separate go and packet |
| [10 · Play the four-card deal and legal powers](issues/10-cards-powers.md) | 4 | 09 | Approval | Separate go and packet |
| [11 · Complete hidden arrangement and Ready](issues/11-seat-ready.md) | 4 | 10 | Approval | Separate go and packet |
| [12 · Finish a friend game across the two surfaces](issues/12-friend-game.md) | 5 | 11 | Approval | Separate go and packet |
| [13 · Complete support intake and the appeal path](issues/13-support-appeal.md) | 6 | 12 | Approval | No own publish |
| [14 · Read account notices through one shared view](issues/14-account-notices.md) | 6 | 13 | Approval; recorded src/plugin/ handover and sole shared-file ownership | No own publish |
| [15 · Find and finish an open human game](issues/15-open-matching.md) | 6 | 12, 13, 14 | Approval; support handling and shared-service readiness | Separate go and packet |
| [16 · Play the computer while a human game waits](issues/16-waiting-computer.md) | 6 | 15 | Approval | Separate go and packet |
| [17 · Read the game record, history and badges](issues/17-profile-record.md) | 7 | 12 | Approval | Separate go and packet |
| [18 · Read every Collection tab](issues/18-collection.md) | 7 | 17 | Approval | Separate go and packet |
| [19 · Finish identity, settings and paged blocks](issues/19-account-settings.md) | 7 | 17 | Approval | Separate go and packet |
| [20 · Check and publish the complete web adaptation](issues/20-complete-release.md) | 8 | 16, 18, 19 | Approval; all required device, speed and recovery records before publish | Separate go and packet |

## Scope coverage

| Spec work | Build tickets |
|---|---|
| Phase 1; common base, worker and test prefactor | 01–02 |
| Phase 2; closed dispatch, safe reads, shared seam, engine support and account entry | 03–07 |
| Phase 3; protected computer game, queue, draft and poll | 08 |
| Phase 4; full setup | 09–11 |
| Phase 5; friend path and Block | 12 |
| Phase 6; public safety, matching and waiting | 13–16 |
| Phase 7; record, badges, Collection and settings | 17–19 |
| Phase 8; integrated evidence and complete publish | 20 |

The [inventory](../web-adaptation/inventory.md) keeps the detailed work-unit mapping. Host-only work stays on the plugin path with regression checks. Nothing from the map's Out of scope or the parked-feature tickets enters this folder.
