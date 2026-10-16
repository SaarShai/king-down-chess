# OpenAI submission checklist

Date: 2026-10-15. Base: `66738a7b`. Source: [research report 01](../research/plugin-submission-2026-10-15/01-openai-review.md) (on branch `claude/plugin-ui-iphone`), sections 3–9. The source keys ([O1] and others) are in its Sources table. The report's audit IDs (A4, B5, …) are in the "Ref" column.

Status values:

- **met**: true in the repo or on the live site today.
- **drafted**: a draft is in this folder; the owner reads it.
- **owner**: only the owner can do it. The exact step follows.
- **deploy**: needs a code change on the server or a deploy to `https://kingdown.dev`. Every deploy needs the owner's word (AGENTS.md).

Nothing here is submitted, deployed or signed in.

## Counts

| met | drafted | owner | deploy | total |
|---|---|---|---|---|
| 15 | 14 | 21 | 10 | 60 |

## 1. OpenAI account

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 1 | Submit as the organization owner, or as a member with Apps Management Write (`api.apps.write`) [O1][O2]. | E8 | owner | platform.openai.com → Settings → Organization → Members: check your role. |
| 2 | Verified identity; an unverified name means rejection [O2]. | E8, D9 | owner | Complete **individual** verification as "Saar Shai", the name on the privacy and terms pages. |
| 3 | A project with **global** data residency; EU residency cannot submit MCP plugins [O2]. | E8 | owner | Settings → Projects: use or create a project with global residency. |
| 4 | The developer identity on the upload is the verified one [O1]. | — | owner | On upload, choose the verified **Developer identity**. |

## 2. Package (ZIP)

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 5 | Root `plugin.json` in the Agent Plugins format, with `extensions.com.openai` [O1][O5]. | D1 | drafted | [package/plugin.json](package/plugin.json). |
| 6 | `name` (≤ 64, lowercase, hyphens) and semantic `version` [O1][O4]. | D1 | drafted | `king-down`, `1.0.0`. Increase `version` for each upload. |
| 7 | `displayName` ≤ 30, `shortDescription` ≤ 30 [O1][O4]. | D3 | drafted | "King Down" (9), "Chess with king powers" (22). [listing.md](listing.md). |
| 8 | `longDescription` ≤ 4,000: tasks, users, limits [O1][O5]. | D3 | drafted | 1,162 characters. [listing.md](listing.md). |
| 9 | `developerName` ≤ 80 [O1][O4]. | D3 | drafted | "Saar Shai". |
| 10 | `category` from the allowed list [O4]. | D3 | drafted | `Entertainment`. |
| 11 | Up to three starter prompts, ≤ 128, no `@` [O1][O4]. | D3 | drafted | Three prompts, 36 characters each. |
| 12 | Square logo, 48–4,096 px, ≤ 5 MiB [O1][O4][O5]. | D4 | drafted | `package/assets/logo.png`, 512 × 512, copy of `public/icons/icon-512.png`. Also used as `composerIcon`. |
| 13 | At least one valid skill in a public ZIP (`plugin_runtime_surface_missing`) [O4]. *Inference:* a remote-MCP package needs one. | D2 | drafted | [package/skills/play-king-down/SKILL.md](package/skills/play-king-down/SKILL.md). Open question 1. |
| 14 | Root `mcp.json` with one remote server and `auth.type: "oauth"`, `client.mode: "provided"`, `tokenEndpointAuthMethod: "none"`, no client secret [O1][O5]. | B3 | drafted | [package/mcp.json](package/mcp.json). Placeholders `<PRODUCTION_MCP_URL>` (planned `https://kingdown.dev/mcp`) and `<OAUTH_CLIENT_ID>`. |
| 15 | No `apps` / `.app.json`, no lifecycle hooks, no credentials, no `test_credentials` or `reviewer_instructions` in the ZIP [O1]. | — | met | The draft package has none. |
| 16 | Build the ZIP with every referenced file [O1]. | D1 | owner | Fill the three placeholders (`<PRODUCTION_MCP_URL>`, `<OAUTH_CLIENT_ID>`, `<DEMO_VIDEO_URL>`), then: `cd docs/submission/package && zip -r ../king-down-1.0.0.zip plugin.json mcp.json skills assets`. Do not commit the ZIP. |
| 17 | `brandColor`, `brandColorDark`, screenshots: optional [O3][O4]. | — | met | Not set. A brand colour is a taste choice; screenshots no longer show in the directory [O3]. |

## 3. Listing URLs and policies

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 18 | Website URL, HTTPS [O1][O4][O5]. | D5 | met | https://kingdown.dev |
| 19 | Terms of service URL [O1][O4][O5]. | D7 | met | https://kingdown.dev/terms.html (3 October 2026). |
| 20 | Privacy policy URL [O1][O4][O5]. | D6 | met | https://kingdown.dev/privacy.html. Content gaps: row 21. |
| 21 | Privacy policy names categories, purposes, recipients, retention times and controls [O3]; no undisclosed user data [O2]. | D6 | drafted | [privacy-additions.md](privacy-additions.md): activity times and play surface, logs with IP addresses, OpenAI as a recipient, retention times. The owner fills four values and approves; then an agent edits `public/privacy.html`. |
| 22 | Support page (HTTPS) with contact details [O3][O5]. | D8 | deploy | Drafted as `public/support.html`; contact route is hello@kingdown.dev, the address on the privacy page. Goes live with the next deploy at https://kingdown.dev/support.html. |
| 23 | The pages and the verified identity name the same publisher [O1]. | D9 | owner | Verify as an individual named "Saar Shai" (row 2). |
| 24 | Suitable for ages 13–17; no targeting of under-13s; no mature content [O3]. | D10 | met | `privacy.html` "Children"; preset messages only (`server.ts:150`). |
| 25 | No commerce except physical goods; no ads [O3]. `review.commerce` set. | D12 | met | Nothing is for sale; `commerce: false` in the draft. |
| 26 | Not a trial or demo; no lesser version than the website [O3]. | D13 | met | All items unlocked (spec Q17). |
| 27 | Name and text rules: no "Plugin"/"MCP", no comparisons, no pricing words [O3]. | — | drafted | Checked in [listing.md](listing.md). |

## 4. Tools

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 28 | Explicit `readOnlyHint`, `destructiveHint`, `openWorldHint` on every tool [O2][O4]. | A1 | met | `src/plugin/server.ts:55`. |
| 29 | `readOnlyHint: true` only when nothing changes [O2]. | A4 | deploy | `kingdown_get` writes `last_seen_at` (`src/match/store.ts:57`). Fault round 2 removes the write from the poll; then deploy. Official rejection reason 4. |
| 30 | `destructiveHint` for overwrite, revocation, irreversible sends [O2][O3]. | A5 | owner | Decide (open question 7): set `true` on `kingdown_invite`, `kingdown_say`, `kingdown_rematch`, `kingdown_handle`, `kingdown_settings`, or keep `false` with a one-line justification each in the portal. |
| 31 | Descriptions state purpose, use and side effects [O3]. | A3 | deploy | `kingdown_open` does not say that it makes a board record (`server.ts:95`). One sentence; goes with the next deploy. |
| 32 | Return only needed data; no internal IDs or timestamps [O3]. | A9, A10 | deploy | Move `board_id`, `revision`, report `id`/`created_at` to `_meta`; add the profile JSON as text (`server.ts:71, 126, 168, 182`). Low risk alone. |
| 33 | Clear error messages [O3]. | A11 | met | `server.ts:58`. |
| 34 | Inputs are minimal; no chat history [O3]. | A7 | met | Strict zod schemas (`server.ts:44–53`). |

## 5. UI and resources

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 35 | CSP lists the exact fetch domains; unique `_meta.ui.domain` [O2][O8]. | C1, C2 | met | `server.ts:39`. |
| 36 | No nested iframes without justification [O3][O7]. | C3 | met | No `frameDomains`. |
| 37 | Each published UI resource URI keeps working while an update is held [O2]. | C5 | deploy | The URI changes with each build (`server.ts:28–34`). Fault round 2: a stable URI or keep old hashes. Then freeze UI deploys from the scan to the review result (row 55). |
| 38 | Works on desktop and mobile, UI included [O3]. | C9 | owner | Run `docs/specs/chatgpt-mvp/release/LIVE-CHECKS.md` on the iPhone app, an Android phone, the ChatGPT website and the macOS app; record each result. |
| 39 | Useful without UI; reviewers test on supported ChatGPT and Codex surfaces [O2][O7]. | C10 | owner | Ask OpenAI support after the first upload (open question 2): can a UI plugin be limited to ChatGPT? The long description already states the board limit. |
| 40 | Report and block for play with strangers (no explicit rule; *inference:* risk with 13–17 users). | D11 | owner | Decide (open question 8): add Report and Block before the first submission, or later. |

## 6. Sign-in and the reviewer account

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 41 | OAuth 2.1 with PKCE `S256`; protected-resource metadata; 401 with `WWW-Authenticate` [O9]. | B1 | met | `src/plugin/http.ts:64–68, 84–93`. |
| 42 | Token audience equals the MCP URL [O9]. | B2 | met | `http.ts:41`; `plugin-deploy/oauth-audience-hook.sql`. |
| 43 | The portal's callback URL is registered with the OAuth server [O1][O16]. | B3 | owner | After the first upload, copy the callback the portal shows (`https://chatgpt.com/connector_platform_oauth_redirect` or `https://chatgpt.com/connector/oauth/{callback_id}`) into the Supabase OAuth client's redirect URLs. Open question 3. |
| 44 | Consent names all requested permissions [O3]. | B4 | owner | Approve new consent words that name ratings, badges, random play, reports and settings (`src/plugin/consent.html`); then deploy. |
| 45 | **Reviewer login (approval item D8):** login and password, sample data, no MFA, no email or SMS codes, no magic links [O1][O2][O3]. | B5 | owner | Decide D8: a password sign-in for one review account, or for all players. Then an agent builds it; you seed the account (one solo game on your turn, one finished game, a rating, one badge) and test it from an outside network in a new browser profile. |
| 46 | Reviewer credentials go in the portal's **Review details**, never in the ZIP [O1]. | — | owner | Metadata & Skills → Review information → Review details: enter the login URL, the email, the password and the sign-in steps. Save details. |

## 7. Review materials

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 47 | Exactly five positive and three negative test cases [O1]. | E1 | drafted | [test-cases.md](test-cases.md), same text in `plugin.json`. |
| 48 | Each test case passes with the reviewer account before submission [O1][O2]. | E1 | owner | Run P1–P5 and N1–N3 on the ChatGPT website and a phone with the D8 account; replace the example numbers with the real ones. |
| 49 | **Demo video** URL, reviewer-accessible [O1]. | E2 | owner | Record the eight test cases on the ChatGPT website and the iPhone app: sign-in, home, a computer game with one move, the games list, the profile, resign, the three refusals. Upload as unlisted; put the link in `<DEMO_VIDEO_URL>`. Keep other chats and the account email out of the frame. |
| 50 | Release notes [O1]. | E3 | drafted | [release-notes.md](release-notes.md), same text in `plugin.json`. |

## 8. Server, domain and scan

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 51 | Production HTTPS MCP endpoint [O4]. | E4 | deploy | Run the release steps in `docs/specs/chatgpt-mvp/release/OWNER-STEPS.md` (ticket 19); then `https://kingdown.dev/mcp` replaces `<PRODUCTION_MCP_URL>`. |
| 52 | **Domain verification**: the exact token as plain text at `https://kingdown.dev/.well-known/openai-apps-challenge` [O1]. | E5 | deploy | paste the token into public/.well-known/openai-apps-challenge, then deploy |
| 53 | **Production scan**: a successful, current tool scan [O1][O4]. | E4 | deploy | After rows 29, 37 and 51–52: MCPs → authorize the scan account → wait for the scan → fix findings → **Rescan**. |
| 54 | The request-origin rule lets the scanner and reviewer clients in. | E6 | deploy | `http.ts:42–48` refuses an unknown `Origin`. Watch the first scan; widen the list only on evidence, then deploy. |
| 55 | Keep live tool schemas and UI URIs working until held updates pass [O2]. | C5 | owner | No UI deploy from the scan to the review result, unless row 37 is fixed. |
| 56 | Live deploy check covers the support page. | — | deploy | *Inference:* add `support.html` to `legalPages` in `tools/deploy-live-check.mjs` so the deploy checks it like the privacy page. |

## 9. Submit and after

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 57 | Upload the ZIP and fix the automated findings [O1]. | — | owner | platform.openai.com/plugins → **Upload new or existing plugin** → identity → **Upload plugin** → Metadata & Skills. |
| 58 | Submit for review with the policy attestations; one active review per plugin [O1]. | — | owner | Select the draft → **Submit for review** → complete the attestations. Feedback comes by email; status also under **Review status** [C1]. |
| 59 | Publish the approved version [O1]. | — | owner | Open the approved version → **Publish plugin**. Users then find it by direct link or exact name [O2]. |
| 60 | Contact press@openai.com before any announcement [O2]. | — | owner | Only if you plan a public announcement. |

## Open questions

For OpenAI support (send with the plugin ID after the first upload):

1. Does a remote-MCP plugin ZIP need a skill? If not, remove `skills/` (row 13).
2. Can a plugin with a board UI be limited to ChatGPT, so that Codex reviewers do not test it (row 39)?
3. Which callback URL does the portal use for a `provided` public client when the OAuth server does not return `iss` (row 43)?

For the owner:

4. Online status: the ChatGPT app has no screen for the "who sees me online" setting. Add one, or state in the policy that the default applies?
5. Retention: how long do game records, report evidence and logs stay (privacy-additions section 4)?
6. D8: a password sign-in for one review account, or for all players (row 45)?
7. Destructive hints: accept possible approval prompts on invite, say, rematch decline, handle and settings, or keep `false` with justifications (row 30)?
8. Report and Block: before the first submission, or later (row 40)?
