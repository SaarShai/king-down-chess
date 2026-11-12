# Muse data-processing answers

Status: draft for the owner. Ticket: [16](issues/16-submission-packet.md), step 3.

These are the answers for the data-processing questionnaire of the Muse portal: organization type, sensitive data, deletion with logs and backups, TLS, encryption, access control, MFA, incident response, and an optional trust center or SOC 2 report ([platform contract](../../research/muse-connector-2026-11-08/muse-platform-contract.md), section 5).

Each fact names the file that proves it. The mark **[owner fact: ...]** shows a fact that the repository cannot prove. The owner fills in each mark before the submission. The facts are true for main on 2026-11-08. The connector is off on that date: `MUSE_CONNECTOR` is `false` in `tools/muse-connector.mjs`.

## 1. Organization type

- The privacy policy names the maker of King Down: Saar Shai (`public/privacy.html`, first paragraph).
- [owner fact: the organization type to choose (individual developer, sole trader or company), and the legal name and country for the business verification.]
- No public source says whether an individual passes the business verification (research report, section 5).

## 2. Data that the connector uses

| Data | Use | Does it go to Muse? | Proof |
|---|---|---|---|
| Account ID (the `sub` UUID of the access token) | The actor of each tool call. It is never a tool field. | It is not in a tool result. It is a claim of the access token, and Muse keeps that token. | `src/plugin/auth.ts`, `src/muse/http.ts` |
| Handle | Not used. | No. The tools give no handle: not the handle of the user, not the handle of an opponent. | `kingdown_games` description in `src/muse/tools.ts`; the person-game test in `src/muse/tools.test.ts` checks each field of the result |
| Games against the computer | List, show, play and end the games that the user asks for. | Yes: game ID, colour, status, turn, move number, level, revision, position (FEN), legal-move count, the last moves as words, the board as text, the ending and a link. | Output schemas in [tool-docs.md](tool-docs.md) |
| Games against a person | Show the turn status. | Only the game ID, colour, status, turn, move number and link. No position and no moves. | `kingdown_view` in `src/muse/tools.ts`; the person-game test in `src/muse/tools.test.ts` |
| New games and moves | The server writes them to the game tables, as the website does. Each command has the surface `muse`, the start receipt of a new game too. A new game keeps `muse:<request_id>` as its start command ID. | The result of each move goes to Muse (row above). | `supabase/migrations/0023_muse_surface.sql`, `src/match/service.ts` (`create`, `command`), `tools/plugin-server.mjs` (the Muse adapter), `src/muse/tools.ts` (`kingdown_new_game`) |
| The words of a move (`said`) | The server matches them against the legal moves. It does not store them; only the move that plays goes to the game. | They come from Muse. | `src/muse/tools.ts` (`kingdown_move`), `src/muse/match-words.ts` |
| Tool counters | One row for each account and counter: the start of the window and the count. | No. | `supabase/migrations/0014_plugin_tool_tries.sql`, `src/match/store.ts` (`toolTry`) |
| Email address | The server does not read or store it. Each request asks Supabase `/auth/v1/user`, and the server reads only the `id` of the answer. | The access-token hook keeps every claim of the Supabase token. A staging token of the Muse client (2026-11-08, [ticket 11](issues/11-staging-oauth.md)) has the `email` claim, so Muse keeps the email address inside the token. | `src/plugin/auth.ts`, `plugin-deploy/oauth-audience-hook.sql` |
| Logs | Vercel records each request (time, URL, result, IP address). Supabase records each sign-in. A failed tool writes the tool name and a fixed error category, with no input and no moves. | No. | `public/privacy.html` ("Where it is kept"), `src/muse/tools.ts`, `src/plugin/diagnostics.ts` |

Sensitive data: none. The connector uses no payment data, health data, location, contacts, messages, photos or government IDs. It has no chat tool and no tool for another person.

Where the data is kept: Supabase stores the accounts and the games, on servers in the United States. Vercel serves the site and the server (`public/privacy.html`). [owner fact: the Vercel function region of the server.]

## 3. Why the connector uses the data

Only to run the games that the user asks for in Muse: start a game, show it, play the moves and the replies of the computer, explain the rules, and end it. King Down shows no ads, does not sell or rent data, and uses no third-party tracking (`public/privacy.html`, "Why we use it"). The Connector Terms allow the processing of user data only to provide, secure, support and improve the connector (research report, section 5).

## 4. Retention

| Data | Period | Proof |
|---|---|---|
| Account, profile and settings | While the account is open. | `public/privacy.html`, "How long we keep it" |
| Games against the computer, with their commands | While the account is open. The deletion job deletes them after the seven-day grace. | `kingdown_jobs.delete_account` in `supabase/migrations/0022_friend_invites.sql`; `game_commands` has `on delete cascade` (`supabase/migrations/0006_games.sql`) |
| Games played through Muse (started in Muse), with their commands | Until the user disconnects Muse on kingdown.dev (deleted at once), or until Muse has not used the link for 30 days (the daily sweep; also when the user is still connected), or until the account deletion, whichever comes first. | `supabase/migrations/0024_muse_disconnect.sql`; section 5 |
| Games against a person | After a deletion, they stay in the history of the other player, without the account ID or email address. Muse makes no game against a person. | `public/privacy.html`; [spec.md](spec.md), "Limits of version 1" |
| Tool counters | One row for each account and counter, used again in each window. It goes with the account (`on delete cascade`). | `supabase/migrations/0014_plugin_tool_tries.sql` |
| Deletion record | The account ID and the dates stay, to show the deletion. | `public/privacy.html` |
| Vercel request logs | 1 day. | `public/privacy.html`. [owner fact: confirm the period in the Vercel plan.] |
| Supabase logs | At most 90 days. | `public/privacy.html`. [owner fact: confirm the period in the Supabase plan.] |
| Release backups | `plugin-deploy/release-backup.sql` copies every public table into a schema `release_backup_<date>` before a release, by the word of the owner. The repository has no step that drops this schema, and `delete_account` does not change it. A restore leaves out the games against the computer of accounts that were deleted after the backup (`docs/HOSTING.md`). | [owner fact: when the owner drops each release backup schema, and whether `release_backup_20261022` still exists.] |
| Supabase platform backups | Not set in the repository. | [owner fact: the backup period of the Supabase plan (daily backups or point-in-time recovery).] |

The other cleanup periods do not touch Muse data: boards after 7 days, outbox rows after 30 days, fault reports after 30 days, and reports after 12 months (`src/online/jobs.ts`, `cleanup`; `supabase/README.md`).

## 5. Deletion

### On revocation

Decision of the owner, 2026-11-12: a disconnect deletes the games played through Muse. The Connector Terms ask for the deletion of user data at revocation (research report, section 5).

- Which games: the games against the computer that started in Muse. Their start receipt has the surface `muse` (`src/match/service.ts`, `create`; the Muse adapter in `tools/plugin-server.mjs`). A game that started on the website stays, also when the user moved in it through Muse: the user made it outside Muse.
- The signal: Muse names no revocation call (research report, section 2), and Supabase has no token revocation endpoint (RFC 7009): its OAuth server metadata names none, and its router has none (Supabase Auth source, `internal/api/api.go`, `internal/api/jwks.go`). Supabase revokes a grant only by the user's own call `DELETE /auth/v1/user/oauth/grants` (`revokeGrant`). That call sets `auth.oauth_consents.revoked_at` and deletes the sessions of that client (`UserRevokeOAuthGrant`, `internal/api/oauthserver/handlers.go`). Thus a disconnect inside Muse reaches King Down only as a link that is no longer used.
- Path 1, at once: **Settings → Account → Disconnect Muse** on kingdown.dev. The browser calls `revokeGrant` for each Muse client, then `public.delete_my_muse_games()` (`src/account/client.ts`, `disconnectMuse`). The function deletes the Muse games of the caller when no Muse session exists; a Muse session that still exists keeps them, and so does a database with no Muse client row (the button then shows an error). The button shows only in a build with `MUSE_CONNECTOR` on (`src/account/account.ts`).
- Path 2, the backstop: a daily pg_cron job (`plugin-deploy/muse-sweep-cron.sql`) calls the procedure `kingdown_jobs.sweep_muse_games()`. It deletes the Muse games of each user whose Muse link has no session, or whose newest Muse session refresh (or start) is older than 30 days. This covers a disconnect inside Muse, and a button run whose revoke worked but whose deletion failed. It also deletes the Muse games of a user who is still connected but did not use Muse for 30 days: Muse does not tell King Down about a disconnect there, so 30 days without use counts as one. Each user has a transaction of its own; one failure does not stop the others.
- The guard: when a Muse game had a Muse move in the last 24 hours but its player has no Muse session, the session match is broken, and the sweep deletes nothing and writes a warning (`kingdown_jobs.muse_sweep_unsafe`). The owner starts the sweep only after a test account shows a recent Muse use ([docs/MUSE.md](../../MUSE.md), "Disconnect and deletion").
- Both paths call `kingdown_jobs.delete_muse_games` (`supabase/migrations/0024_muse_disconnect.sql`): the account lock, then the games locked in ID order, then one delete, as `kingdown_jobs.delete_account` does. The commands and seats go with each game (`on delete cascade`). A second call deletes nothing. No trigger on the auth schema: the functions only read `auth.sessions` and `kingdown_oauth.client_resources`.
- Access: each request checks the access token at Supabase (`/auth/v1/user`), so access stops at the next call after the revoke (`src/plugin/auth.ts`; the test "rejects an unexpired signed token after its provider session is revoked" in `src/plugin/auth.test.ts`). The connector keeps no token and no session of its own (`src/muse/http.ts`).
- What stays: games that started on the website, the account, and the Supabase consent row (revoked, or unused after a disconnect inside Muse). Muse keeps what it already received under its own terms.
- Tests: `src/muse/disconnect.db.test.ts` (which games, the button path, the sweep at 29 and 31 days, a reconnect).
- Answer for the questionnaire: "When the user disconnects King Down on kingdown.dev (Settings → Account → Disconnect Muse), King Down revokes the link and deletes the games that the user started in Muse at once. Muse does not tell King Down when the user disconnects in Muse. So King Down also deletes those games when Muse has not used the link for 30 days, also when the user is still connected. Each later call with an old token is refused."

### On request

- In the game: Settings → Account → Delete my account. By email: hello@kingdown.dev (`public/delete-data.html`).
- A request starts a seven-day grace (168 hours, in UTC). A new sign-in cancels it (`supabase/migrations/0008_accounts_safety.sql`, `supabase/migrations/0020_deletion_utc.sql`). A report hold can delay it (`src/online/jobs.ts`, `runDeletions`).
- After the grace, the daily job ends the open games (`runDeletions`, `src/online/jobs.ts`). Then `kingdown_jobs.delete_account` deletes the games against the computer and their commands, and deletes the Supabase user (`supabase/migrations/0022_friend_invites.sql`). The tool counters go with the user (`on delete cascade`). The token check then refuses each later call (`src/plugin/auth.ts`).
- Records that stay: the deletion record, the reserved handle, games against people with the handle of that game, and report evidence for at most 12 months (`public/privacy.html`).
- Logs and backups: logs end after their periods (section 4). Release and platform backups: see the owner facts in section 4.

## 6. Encryption in transit (TLS)

- The server accepts only an HTTPS public origin. HTTP is possible only on loopback, for local tests (`pluginOrigin`, `src/plugin/auth.ts`). The Supabase URL must be HTTPS (`createTokenVerifier`, `src/plugin/auth.ts`).
- The database connection uses TLS with the Supabase CA certificate and a certificate check (`rejectUnauthorized: true`). The database URL must have `sslmode=require` (`tools/plugin-db-config.mjs`).
- [owner fact: the TLS versions that Vercel accepts for kingdown.dev (the questionnaire asks for TLS 1.2 or later), and HSTS. The repository sets no TLS version and no HSTS header.]

## 7. Encryption at rest

- [owner fact: Supabase encrypts the database and its backups at rest, and Vercel encrypts its logs. Confirm from the security pages or plans of the two services.]
- The repository holds no secret. Keys stay in private env files (`AGENTS.md`, "Secrets"; `docs/HOSTING.md`). The server stores no access token. The command IDs of Muse moves are SHA-256 digests (`commandId`, `src/muse/tools.ts`).

## 8. Access control

- Callers: each call needs a bearer token that Supabase signed, with the exact audience `https://kingdown.dev/muse/mcp`, a client ID on the allow list (`KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS`), the role `authenticated`, and a live session (`src/plugin/auth.ts`). The actor is the `sub` of the token, never a tool field (`src/muse/http.ts`).
- Games: each tool acts only on the games of the actor. A game without a seat of the actor gives `FORBIDDEN` (`seatOf`, `src/match/service.ts`). No position of a game against a person goes to Muse (`src/muse/tools.test.ts`).
- Database: row-level security is on for each game table, and the browser roles get nothing (`supabase/README.md`; `supabase/migrations/0006_games.sql`, `supabase/migrations/0014_plugin_tool_tries.sql`).
- The server connects as `kingdown_plugin_runtime` (`plugin-deploy/runtime-role.sql`). It is a login role with no superuser, no database or role creation, no replication and no RLS bypass. Its policies let it see all rows of each table that it can use, so the server code, not RLS, keeps each caller to the games of that caller. Its rights on the Muse data:
  - `games`, `game_players`, `game_commands`: select and insert on the full table; update on named columns of `games` and `game_players` only; no delete (block 3).
  - `plugin_tool_tries`: select; insert of `user_id` and `tool`; update of `window_start` and `tries` (block 11).
  - `profiles`: select of named columns only, for example `id` and `handle` (blocks 3 and 5).
  - `auth.users`: no access. The role deletes an account only through `kingdown_jobs.delete_account` (block 4).
- The role also has table-wide rights on other tables, for example select and delete on `plugin_matches` and `plugin_match_invites` (block 1), select, insert and delete on `game_invites` (block 3), insert and delete on `relations` (block 5), and delete on `plugin_boards` and on reports older than 12 months (blocks 9 and 10). The blocks are the transactions of the file, in order.
- Changes: code reaches main only by a reviewed pull request; deploys and DNS changes need the word of the owner (`AGENTS.md`).
- [owner fact: who has admin access to Supabase, Vercel, GitHub and the DNS host, and how the owner reviews that access.]

## 9. MFA

- [owner fact: MFA on each account that controls King Down (Supabase, Vercel, GitHub, the DNS host, and the Google account of the owner), and the method (an authenticator app or a security key).]
- Players sign in with Google, GitHub or an email code (`public/privacy.html`). King Down has no MFA setting of its own. Password sign-in is possible only for the listed review accounts (`plugin-deploy/oauth-audience-hook.sql`).

## 10. Incident response

- The Connector Terms ask for a notice to Meta within 48 hours of a security incident with user data, at vendor-incident@meta.com (research report, section 5; [ticket 10](issues/10-portal-access.md)).
- Controls that the repository has:
  - Turn the connector off: set `MUSE_CONNECTOR` to `false` (`tools/muse-connector.mjs`) and deploy. Each Muse path then answers 404 (`docs/MUSE.md`).
  - Stop new Muse tokens, with no deploy: delete the row of the Muse client in `kingdown_oauth.client_resources`. A new token then has no `/muse/mcp` audience, and the server refuses it (`plugin-deploy/oauth-audience-hook.sql`, `src/plugin/auth.ts`). A token from before stays valid until it expires. Without the row, the Muse sweep deletes nothing and the Disconnect Muse button revokes nothing: add the row again after the incident.
  - Rotate a secret that was shown: the rule in `AGENTS.md`, "Secrets".
  - Find the scope: the Vercel request logs, the Supabase logs and the fault reports (`public/privacy.html`).
- Draft plan for the owner:
  1. Stop the harm: stop new Muse tokens, then turn the connector off.
  2. Find the scope in the logs.
  3. Tell Meta within 48 hours at vendor-incident@meta.com. Tell the users and the data protection authority when the law requires it.
  4. Repair the cause, rotate the keys, and record the incident and each step. The Terms ask for records that show compliance.
- [owner fact: the incident contact (name and email), who decides, and whether the owner adopts this plan; and whether the deletion of the Muse OAuth client in Supabase ends its sessions at once.]

## 11. Trust center and SOC 2

- The repository has no trust-center page and no SOC 2 report. [owner fact: confirm "none".]

## 12. Privacy notice

- The Connector Terms ask for a public privacy notice. `public/privacy.html` is the notice. It names Meta only for the hidden Facebook sign-in, under Meta's privacy policy. It does not yet name Meta as a recipient of Muse data: step 4 of ticket 16 adds that, and `tools/privacy-policy.docs.test.ts` checks it.

## Owner facts

- [ ] The organization type, the legal name and the country (section 1).
- [ ] The Vercel function region (section 2).
- [x] Whether a Muse access token has the `email` claim (section 2): yes, on staging (ticket 11).
- [ ] The log periods in the Vercel and Supabase plans (section 4).
- [ ] When each release backup schema is dropped, and whether `release_backup_20261022` still exists (section 4).
- [ ] The Supabase platform backup period (section 4).
- [x] What Muse does on disconnect, and whether Supabase then ends the grant (section 5): Muse names no call, and Supabase has no revocation endpoint; the daily sweep covers it.
- [x] The revocation answer (section 5): delete the Muse games (owner, 2026-11-12).
- [ ] The TLS versions and HSTS of kingdown.dev on Vercel (section 6).
- [ ] Encryption at rest at Supabase and Vercel (section 7).
- [ ] Who has admin access, and how it is reviewed (section 8).
- [ ] MFA on each controlling account (section 9).
- [ ] The incident contact, who decides, the plan, and whether the deletion of the Muse OAuth client ends its sessions (section 10).
- [ ] No trust center and no SOC 2 report (section 11).
