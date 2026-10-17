# OpenAI submission checklist

Date: 2026-10-16. Base: `claude/r9-server` (ticket 11). The grades include the local rehearsal and this branch’s checks. “met” proves local code or files here, or an owner check with its date; it does not claim a live deploy. Approval item D10 is approved (b). Source: [research report 01](../research/plugin-submission-2026-10-15/01-openai-review.md) (on branch `claude/plugin-ui-iphone`), sections 3–9. The source keys ([O1] and others) are in its Sources table. The report's audit IDs (A4, B5, …) are in the "Ref" column.

Status values:

- **met**: true in the repo or on the live site today.
- **drafted**: a draft is in this folder; the owner reads it.
- **owner**: only the owner can do it. The exact step follows.
- **deploy**: needs a code change on the server or a deploy to `https://kingdown.dev`. Every deploy needs the owner's word (AGENTS.md).

Nothing here is submitted, deployed or signed in.

## Counts

| met | drafted | owner | deploy | total |
|---|---|---|---|---|
| 19 | 14 | 17 | 10 | 60 |

## Owner steps (approval item O1)

Do these in order. Each step names its rows below.

0. **Account (done, 2026-10-15).** The Personal organization has you as Owner. Its Default project has Global data residency. Your identity is approved. You selected **Start** to verify the organization. Use the Personal organization for every step below. If the portal opens another organization, switch with the organization menu; do not upload from it. Remaining: when OpenAI confirms the organization check, make sure that Settings → Organization shows it as verified. At upload, choose the verified **Developer identity** "Saar Shai" (rows 1–4, 23).
1. **MCP URL and client ID (rows 14, 16, 43, 51).** After the release, put the production MCP URL in `<PRODUCTION_MCP_URL>` and the Supabase OAuth client ID in `<OAUTH_CLIENT_ID>` (`package/mcp.json`). After the first upload, copy the callback URL that the portal shows into the redirect URLs of that Supabase OAuth client.
2. **Review account and test account (approval D8 a; rows 45, 46).** You make three accounts: the review account for OpenAI, its opponent, and a test account for your own runs in steps 3 and 5. Do not use the review account for a test case: each run changes its games and its record, and the seed refuses an account that has games.
   1. In the Supabase SQL Editor, as the admin role, paste and run `plugin-deploy/oauth-audience-hook.sql` again (it also checks password sign-ins), then `plugin-deploy/review-signup-hook.sql`.
   2. Authentication → Hooks → **Before User Created**: choose Postgres and `public.kingdown_before_user_created`. Make sure that **Custom Access Token** still uses `public.kingdown_access_token_hook`.
   3. In the SQL Editor, add the three new addresses in lower case: `insert into kingdown_auth.password_accounts(email) values ('<review address>'), ('<opponent address>'), ('<test address>');`
   4. Authentication → Sign In / Providers: turn **Email** on. The sign-up hook refuses every other email sign-up. The access token hook refuses a password sign-in for every address that is not in the list, also for a Google or GitHub account that adds a password.
   5. Authentication → Users → **Add user** → **Create new user**, three times, each with **Auto Confirm User**: the review account (a long new password that you keep in your password manager), the opponent account (a long random password that you do not keep), and the test account (a password that you keep).
   6. Run `PLUGIN_DATABASE_URL=… KINGDOWN_REVIEW_EMAIL=<review address> KINGDOWN_REVIEW_OPPONENT_EMAIL=<opponent address> npm run plugin:db:seed-review` with the admin connection. The seed makes one finished friend game, one active friend game with the opponent to move, and one computer game with your move. The active friend game keeps Block player available after step 8. It prints the record: "Rating 1662?; 1 played, 1 won, 0 drawn, 0 lost; 3 badges.", the P4 example in `test-cases.md` and `package/plugin.json`.
   7. Seed the test account against the same opponent, with its own handle: `PLUGIN_DATABASE_URL=… KINGDOWN_REVIEW_EMAIL=<test address> KINGDOWN_REVIEW_OPPONENT_EMAIL=<opponent address> KINGDOWN_REVIEW_HANDLE=test-player npm run plugin:db:seed-review`. The totals and the badges are the same as for the review account. The rating is not 1662, because the opponent lost a game before.
   8. Remove the opponent from the list, so that it cannot sign in: `delete from kingdown_auth.password_accounts where email = '<opponent address>';`. Then sign it out on every device: `delete from auth.sessions where user_id in (select id from auth.users where lower(email) = '<opponent address>');`. This removes each of its sessions and their refresh tokens, so its open sessions end now. The access token hook also refuses each new token for an account with no social sign-in whose address is not in the list, also for an app code exchange or refresh.
   9. In a new browser profile, on another network (for example, your phone's), connect King Down and sign in with the review account. Only sign in: do not run a test case. Then disconnect King Down, and connect it again with the test account for steps 3 and 5.
   10. Paste the text of [review-notes.md](review-notes.md) into Review details, with the email and the password of the review account.
3. **Demo video (row 49).** Record the eight test cases on the ChatGPT website and the iPhone app with the test account (step 2.7), not the review account. Upload it as unlisted and put the link in `<DEMO_VIDEO_URL>`.
4. **Portal proofs (rehearsal R4; rows 18–23, 43, 51–54).** Keep a dated screenshot of each: the identity, the callback, the domain challenge at `https://kingdown.dev/.well-known/openai-apps-challenge`, a successful scan, and each public page (website, privacy, terms, support) opened while signed out.
5. **Eight tests on four surfaces (approval D15 a; rows 38, 39, 48).** Run P1–P5 and N1–N3 with the test account on the ChatGPT website, the iPhone app, an Android phone and the desktop app. Record each result in row 48. The review account stays as the seed left it.
6. **Privacy and terms words (rehearsal R22; rows 20, 21).** Approve "a public app" in place of "the private ChatGPT app" in `public/privacy.html`, and terms that name the ChatGPT app. In the Supabase dashboard, read the log period of the plan, and switch off Authentication → Audit Logs → "Write audit logs to the database". The switch stops new rows only, so then run `delete from auth.audit_log_entries;` once in the SQL Editor as the admin role: the old rows keep each email address and IP address with no end, also after an account deletion ([privacy-additions.md](privacy-additions.md), section 2).
7. **Upload and submit (rows 57, 58).** First remove the test account from the list: `delete from kingdown_auth.password_accounts where email = '<test address>';`. Then sign it out on every device, as in step 2.8: `delete from auth.sessions where user_id in (select id from auth.users where lower(email) = '<test address>');`. Then only the review account can sign in with a password. Do not use the review account before the review.

## 1. OpenAI account

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 1 | Submit as the organization owner, or as a member with Apps Management Write (`api.apps.write`) [O1][O2]. | E8 | met | Owner check, 2026-10-15: the Personal organization has you as Owner. Upload from that organization (owner step 0). |
| 2 | Verified identity; an unverified name means rejection [O2]. | E8, D9 | met | Owner check, 2026-10-15: the identity is approved. The organization check started with **Start**; confirm its result (owner step 0). Files consistently name Saar Shai. |
| 3 | A project with **global** data residency; EU residency cannot submit MCP plugins [O2]. | E8 | met | Owner check, 2026-10-15: the Default project of the Personal organization has Global residency. |
| 4 | The developer identity on the upload is the verified one [O1]. | — | owner | On upload, choose the verified **Developer identity**. Rehearsal: The chosen upload identity is a portal action. |

## 2. Package (ZIP)

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 5 | Root `plugin.json` in the Agent Plugins format, with `extensions.com.openai` [O1][O5]. | D1 | drafted | Root Agent Plugins manifest exists and parses. No portal import is performed. |
| 6 | `name` (≤ 64, lowercase, hyphens) and semantic `version` [O1][O4]. | D1 | drafted | king-down and 1.0.0 have valid shape. Final upload/version remain. |
| 7 | `displayName` ≤ 30, `shortDescription` ≤ 30 [O1][O4]. | D3 | drafted | Lengths are 9 and 22. Both fit their limits. |
| 8 | `longDescription` ≤ 4,000: tasks, users, limits [O1][O5]. | D3 | drafted | Length is 1,162. Text matches listing.md. The random-game promise is true on `claude/r9-server` (approval D1 a): a random game keeps the five chosen switches or opens a new table; the piece and card pools can differ. |
| 9 | `developerName` ≤ 80 [O1][O4]. | D3 | drafted | Saar Shai has 9 characters. Verification still belongs to row 2. |
| 10 | `category` from the allowed list [O4]. | D3 | drafted | Entertainment is set. Final portal validation remains. |
| 11 | Up to three starter prompts, ≤ 128, no `@` [O1][O4]. | D3 | drafted | Three unique starter prompts have 36 characters each. |
| 12 | Square logo, 48–4,096 px, ≤ 5 MiB [O1][O4][O5]. | D4 | drafted | Both icon paths exist. The PNG is 512×512 and 419,180 bytes. |
| 13 | At least one valid skill in a public ZIP (`plugin_runtime_surface_missing`) [O4]. *Inference:* a remote-MCP package needs one. | D2 | drafted | One nonempty skill has name/description front matter. Keep it. The public error reference still calls for a skill unless an approved local MCP qualifies. |
| 14 | Root `mcp.json` with one remote server and `auth.type: "oauth"`, `client.mode: "provided"`, `tokenEndpointAuthMethod: "none"`, no client secret [O1][O5]. | B3 | drafted | OAuth/public-client fields exist. URL and client ID remain placeholders. |
| 15 | No `apps` / `.app.json`, no lifecycle hooks, no credentials, no `test_credentials` or `reviewer_instructions` in the ZIP [O1]. | — | met | The inspected package has no app bundle, lifecycle hook, credentials or reviewer secret field. |
| 16 | Build the ZIP with every referenced file [O1]. | D1 | owner | Fill the three placeholders (`<PRODUCTION_MCP_URL>`, `<OAUTH_CLIENT_ID>`, `<DEMO_VIDEO_URL>`), then: `cd docs/submission/package && zip -r ../king-down-1.0.0.zip plugin.json mcp.json skills assets`. Do not commit the ZIP. Rehearsal: No final ZIP is built. Fill values first. Include all four package components. |
| 17 | `brandColor`, `brandColorDark`, screenshots: optional [O3][O4]. | — | met | Optional brand colours and screenshots are absent. This is allowed. |

## 3. Listing URLs and policies

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 18 | Website URL, HTTPS [O1][O4][O5]. | D5 | owner | https://kingdown.dev Rehearsal: An HTTPS website URL is set. Public reachability is not checked in this local-only review. |
| 19 | Terms of service URL [O1][O4][O5]. | D7 | owner | https://kingdown.dev/terms.html (3 October 2026). Rehearsal: The terms URL is set and the local page loads. Public bytes/access remain unproved. |
| 20 | Privacy policy URL [O1][O4][O5]. | D6 | deploy | The URL exists in metadata. The policy source has the fixes for R10–R12 (16 October 2026, approval D9 a). The next release publishes it. |
| 21 | Privacy policy names categories, purposes, recipients, retention times and controls [O3]; no undisclosed user data [O2]. | D6 | deploy | `public/privacy.html` now names the R10 data, OpenAI as a recipient, the 7-day, 30-day and 12-month cleanups, and the 'Who sees when you are online' control (Everyone, Friends only by default, Nobody) (D9 a, D12 a, D14 a). `cleanup()` deletes reports after 12 months, so the period is true. `tools/privacy-policy.docs.test.ts` keeps the page and the code the same. Owner step 6 confirms the log periods. |
| 22 | Support page (HTTPS) with contact details [O3][O5]. | D8 | deploy | Support source exists and local GET passes. Release and public access remain. |
| 23 | The pages and the verified identity name the same publisher [O1]. | D9 | owner | Verify as an individual named "Saar Shai" (row 2). Rehearsal: File identity matches. Verified upload identity remains an owner fact. |
| 24 | Suitable for ages 13–17; no targeting of under-13s; no mature content [O3]. | D10 | met | No explicit under-13 targeting or mature feature is found. Presets and handle checks exist. Safety controls remain a separate gap. |
| 25 | No commerce except physical goods; no ads [O3]. `review.commerce` set. | D12 | met | commerce=false. No sales, payment, stake or advertising code is exposed. |
| 26 | Not a trial or demo; no lesser version than the website [O3]. | D13 | met | The local app is complete enough to play. No trial gate or locked collection is found. Host scope remains row 39. |
| 27 | Name and text rules: no "Plugin"/"MCP", no comparisons, no pricing words [O3]. | — | drafted | Name/text format is sound. R9: the `kingdown_create` text now gives the random-game limit (same five switches, or any open game with `any_rules`; the colour applies only to a new table). |

## 4. Tools

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 28 | Explicit `readOnlyHint`, `destructiveHint`, `openWorldHint` on every tool [O2][O4]. | A1, A6 | met | All 26 tool descriptors set all three required hints and idempotentHint. Each tool can set its own openWorldHint; accept, block, create, find, say, invite, join and handle set it true. The other 18 set it false. Create can join a random game, so its hint covers that action too. The tool test and protocol check cover every value. |
| 29 | `readOnlyHint: true` only when nothing changes [O2]. | A4 | met | FIXED LOCALLY. get/view no longer writes presence. seen is separate. The DB values do not change on reads. |
| 30 | `destructiveHint` for overwrite, revocation, irreversible sends [O2][O3]. | A5, A6 | met | Approval D10: approved, b (2026-10-15). `kingdown_invite`, `kingdown_say`, `kingdown_rematch`, `kingdown_handle`, `kingdown_settings`, `kingdown_report` and `kingdown_block` set destructiveHint true (`src/plugin/server.ts`; `src/plugin/server.test.ts` checks each). A6: the owner picks true for openWorldHint on find, say, invite, join and handle (2026-10-16). Those values are in place. The review fix also sets accept and create true: both can join another player's random game under the owner's rule. `kingdown_block` now sets both hints true (18-b). Its default idempotent hint is true: repeat block and unblock requests keep the same state. |
| 31 | Descriptions state purpose, use and side effects [O3]. | A3 | met | The descriptions name board storage, the short-code attempts (each preview or join, a retry included, counts toward the hourly limit of 10) and last-setup/default options. A wrong option set gets the rule it breaks, for example "Keep at least 7 pieces in the pool." See `src/plugin/server.ts`: `kingdown_open`, `kingdown_join`, `kingdown_create`. |
| 32 | Return only needed data; no internal IDs or timestamps [O3]. | A9, A10 | met | Board IDs and report receipts are in `_meta`; game revisions stay in the widget data. All widget and protocol readers use the private fields. Stable profile IDs, game IDs and useful deadlines stay visible. |
| 33 | Clear error messages [O3]. | A11 | met | Known failures have safe text/code. The shared input guard names a known field, or asks the player to check the tool fields. It does not echo input values. |
| 34 | Inputs are minimal; no chat history [O3]. | A7 | met | Strict minimal schemas reject unknown context and actor fields. No chat-history field exists. |

## 5. UI and resources

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 35 | CSP lists the exact fetch domains; unique `_meta.ui.domain` [O2][O8]. | C1, C2 | met | The local MCP resource has exact origin resource domains, empty connect domains and ui.domain. Production origin still needs release verification. |
| 36 | No nested iframes without justification [O3][O7]. | C3 | met | No nested iframe is in the widget. No frameDomains are requested. |
| 37 | Each published UI resource URI keeps working while an update is held [O2]. | C5 | met | FIXED LOCALLY. The template serves a prior hash with the current resource. Keep contracts compatible during held updates. |
| 38 | Works on desktop and mobile, UI included [O3]. | C9 | owner | Run `docs/specs/chatgpt-mvp/release/LIVE-CHECKS.md` on the iPhone app, an Android phone, the ChatGPT website and the macOS app; record each result. Rehearsal: Three local browser sizes pass. Actual supported ChatGPT apps and devices remain unproved. |
| 39 | Useful without UI; reviewers test on supported ChatGPT and Codex surfaces [O2][O7]. | C10 | drafted | Approval D15 a: the submission claims the board surfaces only: ChatGPT on the web, iOS, Android and desktop; no Codex. The claim is in [review-notes.md](review-notes.md) for Review details. Open question 2 asks OpenAI to limit the app to these surfaces. The long description states the board limit. You test each surface (owner step 5). |
| 40 | Report and block for play with strangers (no explicit rule; *inference:* risk with 13–17 users). | D11 | deploy | The owner's later pick is Block only (2026-10-16, 18-b). The game Menu has Block player with confirmation and Unblock player in the same place. Profile also lists blocked players, with Unblock for each, after the game ends. The tool uses the website's account relations. Find, open games and message privacy keep the existing block rules. Report has no UI caller and stays for later. |

## 6. Sign-in and the reviewer account

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 41 | OAuth 2.1 with PKCE `S256`; protected-resource metadata; 401 with `WWW-Authenticate` [O9]. | B1 | deploy | HTTP and verifier checks pass locally. Provider discovery, S256 and production code exchange are unproved. |
| 42 | Token audience equals the MCP URL [O9]. | B2 | deploy | Source enforces the exact resource audience. The hook exists. Its production install and token claim remain unproved. |
| 43 | The portal's callback URL is registered with the OAuth server [O1][O16]. | B3 | owner | After the first upload, copy the callback the portal shows (`https://chatgpt.com/connector_platform_oauth_redirect` or `https://chatgpt.com/connector/oauth/{callback_id}`) into the Supabase OAuth client's redirect URLs. Open question 3. Rehearsal: Register and test the exact portal callback for the chosen public client. |
| 44 | Consent names all requested permissions [O3]. | B4 | deploy | The source uses the owner's approved short list (2026-10-16): games, matching, messages, draws, resign, rematches, rating, badges, history, player settings and reports. The privacy link is restored. The review confirms that the exact closing sentence gives false chat and email limits; new words wait for the owner. The token text and raw scope row are removed. The account details, providers and D8 password form stay. Source and mock browser tests cover the page. Release remains. |
| 45 | **Reviewer login (approval item D8):** login and password, sample data, no MFA, no email or SMS codes, no magic links [O1][O2][O3]. | B5 | owner | Approval D8 a, built: the consent page has a closed "Sign in with email and password" form under Google and GitHub; `plugin-deploy/review-signup-hook.sql` refuses every other password sign-up; `plugin-deploy/oauth-audience-hook.sql` refuses a password sign-in for every address that is not in the list; `npm run plugin:db:seed-review` gives one won friend game (a rating and three badges) and one computer game on your move. You install the hooks, make the review account and a test account, and seed both (owner step 2). Your tests use the test account, so the review account stays as the seed left it. |
| 46 | Reviewer credentials go in the portal's **Review details**, never in the ZIP [O1]. | — | owner | Metadata & Skills → Review information → Review details: enter the login URL, the email, the password and the sign-in steps. Save details. Rehearsal: Enter private credentials only in Review details. This review does not open that form. |

## 7. Review materials

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 47 | Exactly five positive and three negative test cases [O1]. | E1 | drafted | Both copies have five positive and three negative cases. P1 uses “1 game”. P2 includes king/power, arrangement, Ready and then Your move. Final host tests remain. |
| 48 | Each test case passes with the reviewer account before submission [O1][O2]. | E1 | owner | Run P1–P5 and N1–N3 on the ChatGPT website and a phone with the test account (owner step 2.7), which the seed makes like the review account. Do not use the review account: its P4 record is the one that owner step 2.6 prints. Rehearsal: Local protocol evidence is supplied. Final host routing, confirmation and refusals remain. |
| 49 | **Demo video** URL, reviewer-accessible [O1]. | E2 | owner | Record the eight test cases on the ChatGPT website and the iPhone app with the test account (owner step 3): sign-in, home, a computer game with one move, the games list, the profile, resign, the three refusals. Upload as unlisted; put the link in `<DEMO_VIDEO_URL>`. Keep other chats and the account email out of the frame. Rehearsal: The video field is still a placeholder. |
| 50 | Release notes [O1]. | E3 | drafted | Release notes match the package string. Recheck claims after the final fixes. |

## 8. Server, domain and scan

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 51 | Production HTTPS MCP endpoint [O4]. | E4 | deploy | Final HTTPS URL and production release are absent from this rehearsal evidence. |
| 52 | **Domain verification**: the exact token as plain text at `https://kingdown.dev/.well-known/openai-apps-challenge` [O1]. | E5 | deploy | Paste the token (only the token, no final newline) into `public/.well-known/openai-apps-challenge` on a branch. Merge the pull request into main, then run `tools/deploy.sh --publish`. Its live-check pass line must name `.well-known/openai-apps-challenge`. |
| 53 | **Production scan**: a successful, current tool scan [O1][O4]. | E4 | deploy | No current successful production scan is supplied. Local tools/list is not a portal scan. |
| 54 | The request-origin rule lets the scanner and reviewer clients in. | E6 | owner | `http.ts:42–48` refuses an unknown `Origin`. Watch the first scan; widen the list only on evidence, then deploy. Rehearsal: Known ChatGPT Origin passes and an unknown Origin fails. Test the real scanner before any allowlist change. |
| 55 | Keep live tool schemas and UI URIs working until held updates pass [O2]. | C5 | owner | No UI deploy from the scan to the review result, unless row 37 is fixed. Rehearsal: Keep old tool contracts and UI entry URIs usable while review holds an update. The current URI alias reduces the old risk. |
| 56 | Live deploy check covers the support page. | — | met | `tools/deploy-live-check.mjs` includes support.html in legalPages. Local tests reject a missing or stale support page. No deploy occurs. |

## 9. Submit and after

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 57 | Upload the ZIP and fix the automated findings [O1]. | — | owner | platform.openai.com/plugins → **Upload new or existing plugin** → identity → **Upload plugin** → Metadata & Skills. Rehearsal: No upload occurs. Fix the identified local items first. |
| 58 | Submit for review with the policy attestations; one active review per plugin [O1]. | — | owner | Select the draft → **Submit for review** → complete the attestations. Feedback comes by email; status also under **Review status** [C1]. Rehearsal: No review submission or attestation occurs. |
| 59 | Publish the approved version [O1]. | — | owner | Open the approved version → **Publish plugin**. Users then find it by direct link or exact name [O2]. Rehearsal: Publishing follows approval. No publish occurs. |
| 60 | Contact press@openai.com before any announcement [O2]. | — | owner | Only if you plan a public announcement. Rehearsal: Only applies if the owner plans an announcement. It is not a present missing code item. |

## Open questions

For OpenAI support (send with the plugin ID after the first upload):

1. Does a remote-MCP plugin ZIP need a skill? If not, remove `skills/` (row 13).
2. Please limit King Down to the ChatGPT surfaces that show app screens (the website, iOS, Android and desktop), and not Codex, because a move needs the board (row 39). Can the portal set this, or does support set it?
3. Which callback URL does the portal use for a `provided` public client when the OAuth server does not return `iss` (row 43)?

For the owner (answered on 2026-10-15 and 2026-10-16):

4. Closed: D14 a and 18-a add 'Who sees when you are online' to Settings, and D12 a: the policy says that the default applies to the activity time.
5. Closed: D9 a. Games stay for the account life, reports 12 months, logs as the hosts keep them (owner step 6 confirms the log periods).
6. Closed: D8 a, one review account (row 45).
7. Closed: D10 approved, b (row 30).
8. Closed: D11 b, later (row 40).
9. Closed: keep the friends-only default (`mutual`). 'Who sees when you are online' has three choices: Everyone, Friends only (the default) and Nobody. It never shows off while friends can see the player. Part 18-a builds it and changes the policy words (owner, 2026-10-16, after the review; this replaces the first answer of that day: on is `everyone`, off is `nobody`).
