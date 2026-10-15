# OpenAI submission checklist

Date: 2026-10-15. Base: `4bc171ec` on `claude/submission-fixes`. The grades include the local rehearsal and this branch’s checks. “met” proves local code or files here; it does not claim a live deploy. D10 still gates merge. Source: [research report 01](../research/plugin-submission-2026-10-15/01-openai-review.md) (on branch `claude/plugin-ui-iphone`), sections 3–9. The source keys ([O1] and others) are in its Sources table. The report's audit IDs (A4, B5, …) are in the "Ref" column.

Status values:

- **met**: true in the repo or on the live site today.
- **drafted**: a draft is in this folder; the owner reads it.
- **owner**: only the owner can do it. The exact step follows.
- **deploy**: needs a code change on the server or a deploy to `https://kingdown.dev`. Every deploy needs the owner's word (AGENTS.md).

Nothing here is submitted, deployed or signed in.

## Counts

| met | drafted | owner | deploy | total |
|---|---|---|---|---|
| 15 | 13 | 22 | 10 | 60 |

## 1. OpenAI account

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 1 | Submit as the organization owner, or as a member with Apps Management Write (`api.apps.write`) [O1][O2]. | E8 | owner | Role and Apps Management permission are not checked. The owner supplies portal evidence. |
| 2 | Verified identity; an unverified name means rejection [O2]. | E8, D9 | owner | Verified publisher identity is not checked. Files consistently name Saar Shai. |
| 3 | A project with **global** data residency; EU residency cannot submit MCP plugins [O2]. | E8 | owner | Global project residency is not checked. |
| 4 | The developer identity on the upload is the verified one [O1]. | — | owner | The chosen upload identity is a portal action. |

## 2. Package (ZIP)

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 5 | Root `plugin.json` in the Agent Plugins format, with `extensions.com.openai` [O1][O5]. | D1 | drafted | Root Agent Plugins manifest exists and parses. No portal import is performed. |
| 6 | `name` (≤ 64, lowercase, hyphens) and semantic `version` [O1][O4]. | D1 | drafted | king-down and 1.0.0 have valid shape. Final upload/version remain. |
| 7 | `displayName` ≤ 30, `shortDescription` ≤ 30 [O1][O4]. | D3 | drafted | Lengths are 9 and 22. Both fit their limits. |
| 8 | `longDescription` ≤ 4,000: tasks, users, limits [O1][O5]. | D3 | drafted | Length is 1,162. Text matches listing.md. Correct the random-game promise. |
| 9 | `developerName` ≤ 80 [O1][O4]. | D3 | drafted | Saar Shai has 9 characters. Verification still belongs to row 2. |
| 10 | `category` from the allowed list [O4]. | D3 | drafted | Entertainment is set. Final portal validation remains. |
| 11 | Up to three starter prompts, ≤ 128, no `@` [O1][O4]. | D3 | drafted | Three unique starter prompts have 36 characters each. |
| 12 | Square logo, 48–4,096 px, ≤ 5 MiB [O1][O4][O5]. | D4 | drafted | Both icon paths exist. The PNG is 512×512 and 419,180 bytes. |
| 13 | At least one valid skill in a public ZIP (`plugin_runtime_surface_missing`) [O4]. *Inference:* a remote-MCP package needs one. | D2 | drafted | One nonempty skill has name/description front matter. Keep it. The public error reference still calls for a skill unless an approved local MCP qualifies. |
| 14 | Root `mcp.json` with one remote server and `auth.type: "oauth"`, `client.mode: "provided"`, `tokenEndpointAuthMethod: "none"`, no client secret [O1][O5]. | B3 | drafted | OAuth/public-client fields exist. URL and client ID remain placeholders. |
| 15 | No `apps` / `.app.json`, no lifecycle hooks, no credentials, no `test_credentials` or `reviewer_instructions` in the ZIP [O1]. | — | met | The inspected package has no app bundle, lifecycle hook, credentials or reviewer secret field. |
| 16 | Build the ZIP with every referenced file [O1]. | D1 | owner | No final ZIP is built. Fill values first. Include all four package components. |
| 17 | `brandColor`, `brandColorDark`, screenshots: optional [O3][O4]. | — | met | Optional brand colours and screenshots are absent. This is allowed. |

## 3. Listing URLs and policies

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 18 | Website URL, HTTPS [O1][O4][O5]. | D5 | owner | An HTTPS website URL is set. Public reachability is not checked in this local-only review. |
| 19 | Terms of service URL [O1][O4][O5]. | D7 | owner | The terms URL is set and the local page loads. Public bytes/access remain unproved. |
| 20 | Privacy policy URL [O1][O4][O5]. | D6 | deploy | The URL exists in metadata. The policy source still needs the fixes in R10–R12. |
| 21 | Privacy policy names categories, purposes, recipients, retention times and controls [O3]; no undisclosed user data [O2]. | D6 | deploy | A draft is insufficient. Categories and periods still have gaps beyond the draft. |
| 22 | Support page (HTTPS) with contact details [O3][O5]. | D8 | deploy | Support source exists and local GET passes. Release and public access remain. |
| 23 | The pages and the verified identity name the same publisher [O1]. | D9 | owner | File identity matches. Verified upload identity remains an owner fact. |
| 24 | Suitable for ages 13–17; no targeting of under-13s; no mature content [O3]. | D10 | met | No explicit under-13 targeting or mature feature is found. Presets and handle checks exist. Safety controls remain a separate gap. |
| 25 | No commerce except physical goods; no ads [O3]. `review.commerce` set. | D12 | met | commerce=false. No sales, payment, stake or advertising code is exposed. |
| 26 | Not a trial or demo; no lesser version than the website [O3]. | D13 | met | The local app is complete enough to play. No trial gate or locked collection is found. Host scope remains row 39. |
| 27 | Name and text rules: no "Plugin"/"MCP", no comparisons, no pricing words [O3]. | — | drafted | Name/text format is sound. R9 still needs an accurate random-game limit. |

## 4. Tools

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 28 | Explicit `readOnlyHint`, `destructiveHint`, `openWorldHint` on every tool [O2][O4]. | A1 | met | All 25 tool descriptors explicitly set the required three hints and optional idempotentHint. |
| 29 | `readOnlyHint: true` only when nothing changes [O2]. | A4 | met | FIXED LOCALLY. get/view no longer writes presence. seen is separate. The DB values do not change on reads. |
| 30 | `destructiveHint` for overwrite, revocation, irreversible sends [O2][O3]. | A5 | owner | The six tools now set destructiveHint true. D10 still needs the owner’s word before merge. The branch does not approve or deploy this choice. |
| 31 | Descriptions state purpose, use and side effects [O3]. | A3 | met | The descriptions name board storage, short-code preview attempts and last-setup/default options. See `src/plugin/server.ts`: `kingdown_open`, `kingdown_join`, `kingdown_create`. |
| 32 | Return only needed data; no internal IDs or timestamps [O3]. | A9, A10 | met | Board IDs and report receipts are in `_meta`; game revisions stay in the widget data. All widget and protocol readers use the private fields. Stable profile IDs, game IDs and useful deadlines stay visible. |
| 33 | Clear error messages [O3]. | A11 | met | Known failures have safe text/code. The shared input guard names a known field, or asks the player to check the tool fields. It does not echo input values. |
| 34 | Inputs are minimal; no chat history [O3]. | A7 | met | Strict minimal schemas reject unknown context and actor fields. No chat-history field exists. |

## 5. UI and resources

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 35 | CSP lists the exact fetch domains; unique `_meta.ui.domain` [O2][O8]. | C1, C2 | met | The local MCP resource has exact origin resource domains, empty connect domains and ui.domain. Production origin still needs release verification. |
| 36 | No nested iframes without justification [O3][O7]. | C3 | met | No nested iframe is in the widget. No frameDomains are requested. |
| 37 | Each published UI resource URI keeps working while an update is held [O2]. | C5 | met | FIXED LOCALLY. The template serves a prior hash with the current resource. Keep contracts compatible during held updates. |
| 38 | Works on desktop and mobile, UI included [O3]. | C9 | owner | Three local browser sizes pass. Actual supported ChatGPT apps and devices remain unproved. |
| 39 | Useful without UI; reviewers test on supported ChatGPT and Codex surfaces [O2][O7]. | C10 | owner | Core moves need UI. Resolve surface scope and verify the allowed surfaces. |
| 40 | Report and block for play with strangers (no explicit rule; *inference:* risk with 13–17 users). | D11 | deploy | Report has no UI caller; block has no widget path. The project already requires both before public release. |

## 6. Sign-in and the reviewer account

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 41 | OAuth 2.1 with PKCE `S256`; protected-resource metadata; 401 with `WWW-Authenticate` [O9]. | B1 | deploy | HTTP and verifier checks pass locally. Provider discovery, S256 and production code exchange are unproved. |
| 42 | Token audience equals the MCP URL [O9]. | B2 | deploy | Source enforces the exact resource audience. The hook exists. Its production install and token claim remain unproved. |
| 43 | The portal's callback URL is registered with the OAuth server [O1][O16]. | B3 | owner | Register and test the exact portal callback for the chosen public client. |
| 44 | Consent names all requested permissions [O3]. | B4 | deploy | Consent source is unchanged and incomplete. Approve and release the corrected words. |
| 45 | **Reviewer login (approval item D8):** login and password, sample data, no MFA, no email or SMS codes, no magic links [O1][O2][O3]. | B5 | owner | No password path or final demo account is supplied. Owner decides the path; code and seeding then follow. |
| 46 | Reviewer credentials go in the portal's **Review details**, never in the ZIP [O1]. | — | owner | Enter private credentials only in Review details. This review does not open that form. |

## 7. Review materials

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 47 | Exactly five positive and three negative test cases [O1]. | E1 | drafted | Both copies have five positive and three negative cases. P1 uses “1 game”. P2 includes king/power, arrangement, Ready and then Your move. Final host tests remain. |
| 48 | Each test case passes with the reviewer account before submission [O1][O2]. | E1 | owner | Local protocol evidence is supplied. Final host routing, confirmation and refusals remain. |
| 49 | **Demo video** URL, reviewer-accessible [O1]. | E2 | owner | The video field is still a placeholder. |
| 50 | Release notes [O1]. | E3 | drafted | Release notes match the package string. Recheck claims after the final fixes. |

## 8. Server, domain and scan

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 51 | Production HTTPS MCP endpoint [O4]. | E4 | deploy | Final HTTPS URL and production release are absent from this rehearsal evidence. |
| 52 | **Domain verification**: the exact token as plain text at `https://kingdown.dev/.well-known/openai-apps-challenge` [O1]. | E5 | deploy | The portal domain-challenge token and its public route are unproved. No token is read here. |
| 53 | **Production scan**: a successful, current tool scan [O1][O4]. | E4 | deploy | No current successful production scan is supplied. Local tools/list is not a portal scan. |
| 54 | The request-origin rule lets the scanner and reviewer clients in. | E6 | owner | Known ChatGPT Origin passes and an unknown Origin fails. Test the real scanner before any allowlist change. |
| 55 | Keep live tool schemas and UI URIs working until held updates pass [O2]. | C5 | owner | Keep old tool contracts and UI entry URIs usable while review holds an update. The current URI alias reduces the old risk. |
| 56 | Live deploy check covers the support page. | — | met | `tools/deploy-live-check.mjs` includes support.html in legalPages. Local tests reject a missing or stale support page. No deploy occurs. |

## 9. Submit and after

| # | Requirement | Ref | Status | Step or evidence |
|---|---|---|---|---|
| 57 | Upload the ZIP and fix the automated findings [O1]. | — | owner | No upload occurs. Fix the identified local items first. |
| 58 | Submit for review with the policy attestations; one active review per plugin [O1]. | — | owner | No review submission or attestation occurs. |
| 59 | Publish the approved version [O1]. | — | owner | Publishing follows approval. No publish occurs. |
| 60 | Contact press@openai.com before any announcement [O2]. | — | owner | Only applies if the owner plans an announcement. It is not a present missing code item. |

## Open questions

For OpenAI support (send with the plugin ID after the first upload):

1. Does a remote-MCP plugin ZIP need a skill? If not, remove `skills/` (row 13).
2. Can a plugin with a board UI be limited to ChatGPT, so that Codex reviewers do not test it (row 39)?
3. Which callback URL does the portal use for a `provided` public client when the OAuth server does not return `iss` (row 43)?

For the owner:

4. Online status: the ChatGPT app has no screen for the "who sees me online" setting. Add one, or state in the policy that the default applies?
5. Retention: how long do game records, report evidence and logs stay (privacy-additions section 4)?
6. D8: a password sign-in for one review account, or for all players (row 45)?
7. D10: approve the six destructive-hint changes on this branch, including report? They are true in this branch; merge waits for the owner’s word (row 30).
8. Report and Block: before the first submission, or later (row 40)?
