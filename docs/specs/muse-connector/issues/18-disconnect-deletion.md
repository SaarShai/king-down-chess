# Delete the Muse games on a disconnect

Type: task
Status: open
Parent: [Muse connector map](../map.md)
Labels: wayfinder:task

## Question

The owner decided on 2026-11-12: when a user disconnects Muse, King Down deletes the games played through Muse. How does King Down learn of a disconnect, and which games go?

## Answer

- Which games: the games against the computer whose start receipt has the surface `muse`. A game that started on the website stays, also when the user moved in it through Muse. Migration 0024 marks the older Muse start receipts by their start command ID `muse:<request_id>`.
- The signal: Muse names no revocation call, and Supabase has no token revocation endpoint (no `revocation_endpoint` in its metadata; no `/oauth/revoke` route). Supabase revokes a grant only by the user's own `DELETE /auth/v1/user/oauth/grants` (`revokeGrant`), which sets `auth.oauth_consents.revoked_at` and deletes the sessions of that client. Sources: the Supabase Auth repository, `internal/api/api.go`, `internal/api/jwks.go`, `internal/api/oauthserver/handlers.go` (`UserRevokeOAuthGrant`), `internal/models/sessions.go` (`RevokeOAuthSessions`); platform.muse.ai/docs, sections 4.2 and 4.4.
- Path 1: Settings → Account → Disconnect Muse (only with `MUSE_CONNECTOR` on) calls `revokeGrant` for each Muse client, then `public.delete_my_muse_games()`.
- Path 2: the daily sweep, the procedure `kingdown_jobs.sweep_muse_games()` (`plugin-deploy/muse-sweep-cron.sql`), deletes the Muse games of each user whose Muse link has no session, or no use in 30 days. This also deletes the Muse games of a user who is still connected but did not use Muse for 30 days: Muse does not tell King Down about a disconnect there. It also repairs a button run whose deletion failed after the revoke. One transaction for each user; a guard stops the sweep when recent Muse play has no Muse session (a broken session match).
- No trigger on the auth schema. The functions read `auth.sessions` and `kingdown_oauth.client_resources` as security definers.
- Details and owner steps: [data-processing.md](../data-processing.md), section 5; [docs/MUSE.md](../../../MUSE.md), "Disconnect and deletion".

## Progress

- 2026-11-12, branch `muse-revoke-delete`: migration `0024_muse_disconnect.sql`, the start receipt surface (`GameService.create`), the Settings button (`src/account/`), the sweep template, the docs.
- Tests: `src/muse/disconnect.db.test.ts` (11 cases: which games, a game against a person, the old start receipts, the button path, the button with no Muse client, the client IDs and no job function, the sweep at 29 and 31 days, no Muse client, the guard, one failed account, a reconnect) and `src/account/account.test.ts` (the button shows only signed in, in a Muse build).
- The privacy text of PR 342 must say the same. The new paragraph sentence is in the PR of this branch.
- Review of PR 355 (independent), fixed on the branch: the owner steps check a test account's recent Muse use before the sweep starts, and run 0024 again after the deploy; the sweep guard; one transaction for each user; the button deletes nothing with no Muse client; the old-start mark also needs a Muse move on the seat; each text says that 30 days without use also deletes the games of a connected user. New tests: a game against a person stays, the button with no Muse client, no job function for a signed-in user, the guard, one failed account.
- Open: the owner steps on staging (docs/MUSE.md), then a check with a test account.
