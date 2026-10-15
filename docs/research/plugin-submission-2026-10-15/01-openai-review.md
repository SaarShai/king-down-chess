# 01 · What OpenAI review needs, and where King Down stands

Ticket: [01 · What OpenAI review needs](../../specs/plugin-submission/issues/01-research-submission.md). Research date: 2026-10-15. Repo state: branch `claude/plugin-ui-iphone` at `a7edf54a`.

**How to read this report.**

- Each fact has a source key, for example [O2]. The [Sources](#sources) table gives the URL and the date read. I read all OpenAI developer pages on 2026-10-15, in full, through the single-file export [O18].
- **Docs** = a statement on an official page. **Repo** = a fact from this repository, with a file path. ***Inference*** = my conclusion; it is marked in italics.
- None of the OpenAI developer pages shows a publication date. Their screenshots carry `20260927` in the file names, and the changelog has 2026 entries. So I treat the pages as current. Anything older than 2026 is marked *(pre-2026)*.
- This report does not repeat the earlier research. It updates it. The earlier files are [chatgpt-plugin-environment.md](../chatgpt-plugin-environment.md), [chatgpt-plugin-feasibility-2026-10-07.md](../chatgpt-plugin-feasibility-2026-10-07.md), [multiplayer-2026-10-10/03-technical.md](../multiplayer-2026-10-10/03-technical.md) §4.5–4.7, §7, §8.7–8.9, and [notes/f-host.md](../../specs/chatgpt-mvp/notes/f-host.md).

---

## 1. Summary

1. OpenAI now takes a **plugin ZIP** (a `plugin.json` manifest, an `mcp.json`, assets) through the Plugins page of the Platform dashboard. You connect and scan the MCP server there, verify the domain, add reviewer credentials, and submit. After approval, **you** publish [O1].
2. The package and the listing need: a display name and a subtitle (30 characters each), a long description (4,000), a category, a square logo, and **four HTTPS URLs: website, support, privacy policy and terms** [O1][O4][O5].
3. Review needs **exactly five positive and three negative test cases**, a **video URL**, **release notes**, and a **reviewer login with a password and no MFA, no email or SMS codes, no magic links** [O1][O2][O3][O4].
4. OpenAI lists four common rejection reasons: no connection with the given URL or login; wrong test-case results or UI errors; user data that the privacy policy does not disclose; and **tool annotations that do not match tool behaviour** [O2].
5. The repo meets the deep technical rules well: explicit annotations on every tool, OAuth with PKCE and resource binding, a declared CSP and a unique UI domain, a model-safe split between `structuredContent` and `_meta`, privacy and terms pages.
6. The repo is **not ready to submit**. Four gaps can cause a rejection by themselves: (a) the reviewer cannot sign in without Google or GitHub, and GitHub sends an email code on a new device; (b) `kingdown_get` says `readOnlyHint: true` but writes `last_seen_at`; (c) the UI resource URI changes with each build, and the server does not serve old URIs, so a deploy after the scan can blank the reviewer's board; (d) no Android or desktop-app test is on record. Section 9 ranks all gaps.

---

## 2. What changes from the earlier research

| Earlier statement | Status on 2026-10-15 | Source |
|---|---|---|
| Submission needs 5 + 3 test cases, a demo video, privacy, terms and support URLs (f-host §11; 03 §8.9). | Still true. Also needed now: a **website URL**, **release notes**, a **ZIP package**, and **policy attestations**. A commerce declaration (`review.commerce`) is optional; the examples set it to `false` *(corrected in check: the field reference marks it optional)*. Test cases, video URL and release notes can live in `plugin.json` and import with the ZIP. | [O1][O4] |
| Annotations need a justification at submission (f-host §2.4). | **Docs disagree.** The guidelines say "Annotation justifications are no longer required." The errors page still lists `justification_required`. *Inference:* write a short justification for each value; it costs little. | [O3][O4] |
| Screenshots are part of the listing (implied in earlier release lists). | "Screenshots are no longer shown in the Directory." They are optional. If you add them: one PNG or JPEG for each starter prompt, "exactly 706 pixels wide and 400–860 pixels tall", and only when the scan finds a UI template. | [O3][O4] |
| `readOnlyHint: true` only if the tool changes nothing; a log write counts (03 §4.5, §8.7). | Still true, now word for word: set it to false if the tool can "write logs … or otherwise change state." **The code no longer follows this rule** (see §8, item A4). | [O2] |
| Fix the MCP origin before review; keep old resource URIs working (03 §4.5). | Still true, with more detail: OpenAI **scans the server daily** after publication. A changed tool definition (its `_meta`, resource reference and CSP included) is **held** until automated checks pass; the old definition stays live. An appeal pauses automatic updates. | [O1][O2] |
| Contact support to change an MCP URL vs. a path change through a new version (environment research, open question 3). | Still both on the pages. The submission page says "contact support" for a URL change. The review page says a path change uses the normal new-version flow and an origin change needs a new plugin. Still unresolved. | [O1][O2] |
| Review takes 1–4 months (community reports, 03 §4.7). | Docs give no estimate and say: do not ask support to expedite. A July 2026 forum thread reports a rejection after about one month, with no rejection email; staff ask for the **App ID**, not a Case ID. | [O2][C1] |
| Users find the plugin through the directory (implied). | After publication, users find it **only by a direct link or a search for its exact name**. Directory placement is "enhanced distribution"; OpenAI selects it; you cannot request it. | [O2] |
| Approval levels: Always ask, Allow read, Allow low-risk (default), Allow all (03 §4.5). | Confirmed through Help Center search snippets (the page returns 403). New detail: the standard account-wide and workspace-wide selectors do not offer "Allow all actions". | [O20][O16] |
| OAuth: CIMD preferred, DCR also (environment research). | Also new (changelog 2026-08-21): a **stable callback** `https://chatgpt.com/connector_platform_oauth_redirect` when the authorization server supports RFC 9207 issuer identification. Without it, the callback is `https://chatgpt.com/connector/oauth/{callback_id}`. The portal supports a **registered client (`provided`)** with `tokenEndpointAuthMethod: "none"`. | [O9][O16][O1] |
| (Not in earlier research.) | A public submission ZIP "must contain at least one valid skill (or an approved local MCP server)" (error `plugin_runtime_surface_missing`). *Inference:* a remote-MCP-only package probably needs one small skill. | [O4] |
| (Not in earlier research.) | ChatGPT can serve a cached UI resource "for up to one hour" for the same URI. A backward-compatible content change at the same URI needs no new scan. | [O2] |
| (Not in earlier research.) | Reviewers check that test cases "pass on the supported ChatGPT and Codex surfaces where the plugin will be available". The UI guide says: keep MCP tools useful without a component "so ChatGPT and Codex can complete the workflow without UI". | [O2][O7] |

No other earlier statement is wrong. The facts on display modes (no PiP in ChatGPT), the system-font rule, `_meta` visibility and the 13–17 audience are unchanged [O6][O8][X1][O3].

---

## 3. The submission steps

All steps are from [O1] unless marked.

1. **Prepare the OpenAI account.** An organization owner submits, or a member with **Apps Management Write** (`api.apps.write`; `api.apps.read` to view) [O1][O2]. Complete **individual** verification to publish under your own name, or **business** verification for a company name. "Publishing under an unverified individual or business name will result in rejection." [O2]. Use a project with **global** data residency; "projects with EU data residency cannot submit plugins with MCP servers" [O2].
2. **Build the ZIP.** Root `plugin.json` (Agent Plugins format) with listing fields under `extensions.com.openai.interface`, review fields under `extensions.com.openai.review`, a root `mcp.json` with one remote server (plugin-level `review.test_cases` need exactly one server; a plugin with more servers declares cases on each server *(corrected in check)*), assets under `./assets/`, and (*inference*) one skill under `skills/<name>/SKILL.md` [O1][O4][O5]. Do not put credentials, `test_credentials` or `reviewer_instructions` in the ZIP. ZIPs with `apps` / `.app.json` or lifecycle hooks "cannot currently be submitted" [O1] *(corrected in check: exact quote)*.
3. **Upload** on [Plugins](https://platform.openai.com/plugins): **Upload new or existing plugin** → choose the verified **Developer identity** → **Upload plugin** [O1].
4. **Fix the automated findings** under **Metadata & Skills**; upload a corrected ZIP when needed [O1].
5. **Connect the MCP server** under **MCPs**: check URL and authentication, pass **domain verification**, authorize the scan account, wait for the **tool scan**, fix findings, **Rescan** [O1].
   - Domain verification: serve the exact token as plain text at `https://<host>/.well-known/openai-apps-challenge`. Only the token; not JSON [O1].
6. **Complete review details**: enter reviewer credentials in **Review details**; check the imported test cases, video and release notes [O1].
7. **Submit for review** and complete the policy attestations. Feedback comes by email. "Only one review can be active per plugin." To appeal, reply to the rejection email [O1][O2].
8. **Publish** the approved version with **Publish plugin** [O1].
9. **After publication:** OpenAI scans the server daily. New tools wait for automated checks; changed tools keep the old definition until the new one passes; deleted tools go at once [O1][O2]. Metadata, assets and skill changes need a new ZIP and a new review [O1]. Contact press@openai.com before any announcement [O2].

---

## 4. Required metadata

| Field (`plugin.json`) | Rule | Source |
|---|---|---|
| `name` | Required. At most 64 characters; lowercase letters, numbers and single hyphens. Separate from the display name. | [O1][O4] |
| `version` | Semantic version; increment for each upload (`plugin_version_unchanged`). | [O1][O4] |
| `interface.displayName` | Required, at most 30 characters, one line. | [O1][O4] |
| `interface.shortDescription` (subtitle) | Required, at most 30 characters, one line. | [O1][O4] |
| `interface.longDescription` | Required, at most 4,000 characters: "tasks, intended users, and limitations". | [O1][O5] |
| `interface.developerName` | Required, at most 80 characters. The directory shows the verified identity name. | [O1][O4] |
| `interface.category` | Required. Allowed values include **Entertainment**, Education & Research, Other, and nine more. | [O4] |
| `interface.capabilities` | Optional for this format; at most 20 labels of 120 characters. | [O5] |
| `websiteURL`, `supportURL`, `privacyPolicyURL`, `termsOfServiceURL` | All four required for MCP review. HTTPS, at most 1,024 characters, no embedded credentials. "Public URLs must be accessible and identify the same publisher as the submission." | [O1][O4][O5] |
| `defaultPrompt` | Optional; up to three starter prompts, 128 characters each, unique, no `@` mentions. | [O1][O4] |
| `brandColor`, `brandColorDark` | Optional. `#RRGGBB`; light at least 2:1 contrast on white, dark at least 2:1 on `#212121`. | [O4][O5] |
| `logo` (primary icon) | Required for submission. Square, at least 48 × 48 px, at most 4,096 px; PNG, JPEG, WebP or SVG, at most 5 MiB. `composerIcon` is required only in the Codex format. Dark variants optional. | [O1][O4][O5] |
| `screenshots` | Optional; see §2. | [O3][O4] |
| `review.test_cases.positive` / `.negative` | Exactly 5 and 3 for the first MCP review. Each case: `description`, `prompt`; positive cases also `tools_triggered` and `expected_behavior`. | [O1] |
| `review.demo_recording_url`, `publication.release_notes`, `review.commerce` | Video URL required; release notes required at final submission (the ZIP field itself is optional, so you can also type them in the dashboard); commerce yes/no. The release-notes field is under `publication`, not `review`. *(corrected in check)* | [O1][O4] |
| `publication.countries` | Optional. Omit to keep current targeting; `[]` removes all limits. | [O1] |
| `mcp.json` → `extensions["com.openai"].auth` | `type: "oauth"`; for a registered public client: `client: { mode: "provided", clientId, tokenEndpointAuthMethod: "none" }`. No client secret in the package. | [O1][O5] |

**Names and text** [O3]: avoid generic one-word names; do not append "MCP", "MCP Server" or "Plugin"; do not compare with other products; do not advertise "pricing, subscriptions, free trials, discounts, or promotions". *Inference:* keep the word "free" out of the listing text.

---

## 5. Policies

### 5.1 Privacy policy, terms and support [O3]

- "Plugin submissions must include a clear, published privacy policy explaining, at minimum, the categories of personal data collected, the purposes of use, the categories of recipients, data retention timelines, and any controls offered to your users."
- "You must provide customer support contact details where end users can reach you for help." The package needs an HTTPS **support page** URL [O5].
- Collect the minimum. Do not collect payment card data, health data, government IDs or "access credentials and authentication secrets".
- No tracking or profiling, "including metadata collection such as timestamps, IP addresses, or query patterns", unless it is "explicitly disclosed, narrowly scoped, subject to meaningful user control".
- "Your MCP server must not pull, reconstruct, or infer the full chat log."

### 5.2 Age and content [O3]

- "Plugins must be suitable for general audiences, including users aged 13–17. Plugins may not explicitly target children under 13."
- No mature (18+) content yet. Follow the OpenAI usage policies.
- Use only intellectual property that you own or may use. No copycat design, no implied OpenAI endorsement.

### 5.3 Games

- **No page has a rule only for games.** I searched all plugin pages [O18]. The UI pages name a game only as an example of picture-in-picture use [O6][O7].
- The OpenAI blog names games as a valid "just for fun" use: an app adds value when it keeps state, enforces rules, tracks progress and renders the game [O19] *(undated)*.
- Rules that touch games: no real-money **gambling**; no ads; commerce **only for physical goods** (no digital items, credits, subscriptions or upsell); no worse version than on your own website; "Trial or demo plugins will not be accepted." [O3]

### 5.4 Commerce and ads [O3]

- "Currently, plugins may conduct commerce only for physical goods." No subscriptions, no digital content, no tokens or credits, no freemium upsell.
- "Plugins must not serve advertisements."

---

## 6. Tool design rules

### 6.1 Names and descriptions [O3][O12][O13]

- Unique, human-readable names, "ideally as a verb". No promotional words.
- "Each tool must have a nonempty description that explicitly and accurately explains its purpose and behavior, when to use it, and any relevant limitations or side effects." A tool with an unclear description "may be rejected."
- Start model-facing descriptions with "Use this when…" [O13].
- Each public tool works alone. Do not tell the model to call another plugin. Do not use a generic executor that hides operations from review.
- "Side effects should never be hidden or implicit." Tools should be safe to retry, or say when a retry repeats an effect.

### 6.2 Annotations [O2][O3][O4]

Every tool must set `readOnlyHint`, `destructiveHint` and `openWorldHint` to explicit booleans (`annotations_required`). The dashboard shows the server values; a justification "doesn't override the annotations" [O2].

| Hint | Set to `true` when… | Source |
|---|---|---|
| `readOnlyHint` | the tool "strictly fetches/looks up/lists/retrieves data and does not modify anything". Set false if it can "trigger actions (send emails/messages, run jobs, enqueue tasks, write logs, start workflows), or otherwise change state." | [O2] |
| `destructiveHint` | the tool "can cause irreversible outcomes (deleting, overwriting, sending messages or transactions you can't undo, revoking access…)", "even in only select modes". The guidelines add "cancellation, access revocation", and: "Use `false` only for additive writes without destructive or irreversible effects. Being able to undo an action does not, by itself, justify setting `destructiveHint` to `false`." | [O2][O3] |
| `openWorldHint` | the tool reaches "the public internet or open-ended external entities". "A tool confined to a bounded private account, workspace, or catalog may use `false`." | [O2][O3] |

`idempotentHint` has no OpenAI definition [O2]. Annotations "do not grant permission or replace authentication" [O3].

### 6.3 What the model sees [O8][O3][O2]

- `content` and `structuredContent` reach the model and the component, and enter the transcript. Result `_meta` reaches only the component [O8].
- Response minimization: return only data the request needs. Do not include "session IDs, trace IDs, request IDs, timestamps, or logging metadata — unless they are strictly required" [O3]. Review checks "nested fields and 'debug' payloads" [O2].
- "Return stable identifiers and enough structured information for follow-up calls" [O12]. *Inference:* a game ID that the model passes back to `kingdown_open` is "strictly required"; a board ID or a revision number is not.
- A **profile tool** (`_meta["openai/profile"]: true`) must be read-only, take an empty argument object, return `{ id, name?, email?, nickname? }` in `structuredContent` with a matching `outputSchema`, and "for compatibility, also include the same profile serialized as JSON in a text content item" [O9].

---

## 7. Auth, UI, performance

### 7.1 Auth [O9][O1][O3]

- OAuth 2.1 authorization code with PKCE `S256`. "MCP servers are unsupported when their authorization server metadata omits this field or does not advertise `S256`" [O9] *(corrected in check: exact quote)*.
- Protected resource metadata at `/.well-known/oauth-protected-resource`, or a `WWW-Authenticate` header on 401 [O9].
- ChatGPT sends `resource=<MCP URL>`; the server must check the token audience and reject wrong ones [O9].
- Client registration: CIMD (preferred), DCR, or a registered client. The portal reads the method from `mcp.json`. "Existing client registration can lock credential changes." [O1][O9]
- "Users must be informed of all requested permissions, and those requests must be limited to what is necessary." [O3]
- **Reviewer account:** "a login and password for a fully featured demo account that includes sample data. Plugins that require additional login steps, such as a new account sign-up or 2FA through an inaccessible account, will be rejected." [O3] It must work "without MFA approval, email or SMS codes, magic links, or private-network access", and stay available for later reviews [O1]. Review rejects logins "through systems that require SMS, email or other verification schemes" [O2].
- **GitHub fact:** GitHub can ask an account without 2FA for "device verification" on an unrecognized device (a new computer, browser or browser profile) and sends a code to the account's primary and backup email addresses [G1]. The only ways to skip it are 2FA or a passkey; "It is not possible to opt-out of device verification entirely without enabling 2FA." [G1] Both ways are blocked for a reviewer: 2FA is MFA, and a passkey stays on the owner's device. *(corrected in check: page read in full on 2026-10-15, not through a search summary; the page is current, © 2026.)* *Inference:* a GitHub or Google sign-in is not a safe reviewer path.

### 7.2 UI, CSP and domains [O2][O7][O8][O3]

- "If the server returns UI, you defined a content security policy (CSP) that allows the exact domains the component fetches from." The review "checks the declared policy against the UI behavior." [O2][O7]
- `_meta.ui.domain`: "required when submitting a plugin with UI; must be unique per plugin" [O8].
- Nested iframes are blocked by default. Each iframe origin needs `frameDomains` and a written justification at submission [O3][O7].
- `redirect_domains` (legacy `openai/widgetCSP`) is still needed for `window.openai.openExternal` targets [O8].
- Treat the resource URI as a cache key. Breaking change → new URI. Backward-compatible content at the **same** URI needs no new scan; ChatGPT can serve the cached copy for up to one hour [O7][O2].
- After publication, a change to a tool's `_meta`, resource reference or CSP is held until automated checks pass. "Keep existing input schemas and each published UI resource URI working during that gap." [O2]
- The UI guidelines (system fonts, no logo in the response, at most two inline actions, no nested scroll, WCAG AA contrast, alt text) are called "optional UI guidelines" by the plugin guidelines [O3][O6]. *Inference:* a deviation is a review risk, not an automatic rejection.

### 7.3 Performance and reliability [O3][O10][O15][O2]

- "Plugins must function reliably in ChatGPT on both desktop and mobile, including any UI components." [O3]
- "Errors, including unexpected ones, must be handled with clear messaging or fallback behaviors." "Plugins should be stable, responsive, and complete." [O3]
- "Apply timeouts and rate limits to expensive or externally visible tools." "Produce logs and metrics for failed initialization and tool calls." [O10]
- Components "feel sluggish" when "tool calls take longer than a few hundred milliseconds" [O15].
- No numeric limit for payload, latency or uptime is published [O8][O10]. "Plugins may be removed if they are inactive, unstable, or non-compliant." [O2]

### 7.4 Common rejection reasons

Official list [O2]:

1. "We're unable to connect to your MCP server using the MCP URL and/or test credentials." (MFA, SMS/email codes, expired login, internal network.)
2. "One or more of your test cases did not produce correct results." (UI errors when content or images load; extra or irrelevant output; failures on a supported ChatGPT or Codex surface.)
3. "Your plugin returns user-related data types that are not disclosed in your privacy policy."
4. "Tool hint annotations do not appear to match the tool's behavior."

Other rejection triggers in the guidelines [O3]: unverified publisher name; demo or trial plugin; generic name or "Plugin"/"MCP" in the name; pricing in the description; unclear tool descriptions; iframes without justification. Community reports add: no rejection email, status only in the dashboard; staff ask for the App ID [C1][C2].

---

## 8. Repo audit

Status: **met** / **partly** / **missing**. Evidence paths are relative to the repo root.

### A. Tools and annotations

| # | Requirement | Status | Evidence |
|---|---|---|---|
| A1 | Explicit `readOnlyHint`, `destructiveHint`, `openWorldHint` on every tool | **met** | `src/plugin/server.ts:55` sets all three (and `idempotentHint`) for each of the 23 tools. |
| A2 | Unique, plain, verb-like names | **partly** | All unique, `kingdown_` prefix. Some are nouns: `kingdown_games`, `kingdown_lobby`, `kingdown_profile`, `kingdown_settings`, `kingdown_handle` (`server.ts:123–179`). Low risk. |
| A3 | Descriptions state purpose, when to use, side effects | **partly** | Model-facing tools start with "Use this when…" (`server.ts:95, 123, 156, 179`). `kingdown_open` does not say that it creates a board record (`service.ts` `openBoard`). App-only tools are short but honest. |
| A4 | `readOnlyHint: true` only when nothing changes | **missing for one tool** | `kingdown_get` has `readOnly: true` (`server.ts:131`), but its description says "Records seat activity at most once each 30 seconds", and `GameService.view` calls `store.seen`, an `UPDATE … last_seen_at` (`src/match/service.ts:155–156`, `src/match/store.ts:56–57`). This matches official rejection reason 4. `kingdown_games`, `kingdown_lobby` and `kingdown_profile` are truly read-only (`src/online/accounts.ts:36–44`). |
| A5 | `destructiveHint: true` for overwrite, cancellation, access revocation, irreversible sends | **partly** | True on cancel, draw, claim, resign, abort (`server.ts:145, 151–155`). *Inference:* a strict reviewer can flag `kingdown_invite` ("a new invitation ends the old one" = access revocation, `server.ts:156`), `kingdown_say` (an irreversible message send, `server.ts:150`), `kingdown_rematch` with `decline` (`server.ts:147`), and `kingdown_handle` / `kingdown_settings` (overwrites, `server.ts:170–174`). A move is an additive write; false is defensible with a justification. |
| A6 | `openWorldHint` | **met** | False on all tools (`server.ts:55`). All actions stay inside King Down accounts. *Inference:* random matchmaking with other King Down players is still a "bounded" catalog; give a justification. |
| A7 | Minimal, purpose-bound inputs; no chat history | **met** | Strict zod schemas; no transcript fields; input validation before handlers (`server.ts:44–50`). |
| A8 | Model sees only what it needs; position and opponent stay in `_meta` | **met** | `reply()` puts the view and opponent in `_meta` and a short line in `content` (`server.ts:63–73`). Widget state uses `privateContent` only (`src/plugin/client.ts:17`). |
| A9 | No internal IDs or timestamps unless required | **partly** | `structuredContent` carries `board_id` (`server.ts:71`), `revision` and `deadline_at` (`kingdown_games`, `server.ts:123–129`), and report `id` / `created_at` (`server.ts:164–168`). `game_id` is needed for follow-up calls. *Inference:* move `board_id` and `revision` to `_meta`. |
| A10 | Profile tool shape | **partly** | `openai/profile: true`, read-only, `outputSchema {id, name?}`, `id` = account UUID (`server.ts:179–183`). The text content is a stats sentence, not the profile JSON that [O9] asks for "for compatibility". The input has an optional `before` field; an empty object works. |
| A11 | Clear error messages | **met** | Known errors return their message; unknown errors return "Could not update the game. Retry or reload." and log a request ID (`server.ts:56–58`). |
| A12 | Server `instructions`, tool titles, `outputSchema` on structured tools, status text | **missing (optional)** | `new McpServer({ name, version })` has no `instructions` (`server.ts:36`). Only the profile tool has an `outputSchema`. Not a stated rejection reason. |

### B. Auth and reviewer access

| # | Requirement | Status | Evidence |
|---|---|---|---|
| B1 | OAuth 2.1 + PKCE, protected-resource metadata, 401 with `WWW-Authenticate` | **met** | `src/plugin/http.ts:64–68, 84–93`; Supabase OAuth server; resource-bound config is required at start (`http.ts:41`). |
| B2 | Audience / resource check | **met** | `options.auth.resource` must equal `<origin>/mcp` (`http.ts:41`); audience hook `plugin-deploy/oauth-audience-hook.sql`. |
| B3 | Client registration the portal supports | **partly** | A registered public PKCE client, dynamic registration off (`docs/specs/chatgpt-mvp/release/OWNER-STEPS.md` step 4). This fits `client.mode: "provided"`, `tokenEndpointAuthMethod: "none"` [O1]. The **portal's** callback URL and the published plugin's callback are not yet registered; no `mcp.json` exists. |
| B4 | Transparent consent that names all permissions | **partly** | `src/plugin/consent.html` says the connection "can open and play your King Down matches and manage your friend invitations" and "cannot read the surrounding chat". It does not name ratings and badges, random matchmaking, reports or settings. It also says the token grants "your existing account's data permissions" (broader than the plugin needs). |
| B5 | Reviewer login + password, no MFA, no email codes, sample data | **missing** | The consent page offers only Google and GitHub (`src/plugin/consent.ts:22–26`, `consent.html`). GitHub can send an email code on a new device [G1]. No password path, no seeded review account. `docs/plugin-beta-support.md` "Data and release decisions" names the need; 03 §8.9 proposes one review-only password account. |
| B6 | Multi-account identity | **met** | Profile tool returns a stable UUID (`server.ts:179–183`). |

### C. UI, CSP and resources

| # | Requirement | Status | Evidence |
|---|---|---|---|
| C1 | CSP lists the exact fetch domains | **met** | `resourceDomains: [origin]`, `connectDomains: []`, mirrored in `openai/widgetCSP` (`server.ts:39`). Art loads from the app origin (`server.ts:18`, `tools/plugin-server-build.mjs`). No `fetch` or iframe in the widget. |
| C2 | Unique `_meta.ui.domain` | **met** | `domain: origin` = `https://kingdown.dev` (`server.ts:39`). |
| C3 | No iframes, or iframes with justification | **met** | No `frameDomains`. |
| C4 | Display modes | **met** | `availableDisplayModes: ['inline','fullscreen']`, no PiP (`server.ts:39`). |
| C5 | Published resource URI keeps working until a held update passes | **missing** | The URI is `ui://kingdown/board-<sha256 of HTML>.html` (`server.ts:28–34`), and the server registers only the current URI (`server.ts:39`). *Inference:* any UI deploy after the review scan, or after publication, changes `kingdown_open`'s `resourceUri`. That change is held for checks [O2], while the live definition still points to the old URI, which the server no longer serves. The board can fail to load for the reviewer or for all users. |
| C6 | Inline card: at most two actions | **met** | Home card has Play and Your games (`src/plugin/index.html`, `#home-card`). |
| C7 | System fonts, no own logo in the response | **partly** | The page imports `src/style.css` with Cinzel and Alegreya Sans `@font-face` (`src/plugin/app.css:1`, `src/style.css:5–19, 69–70`); the inline card shows a "King Down" wordmark (`index.html` `.wordmark`). This is the owner's decision Q18 (`docs/specs/chatgpt-mvp/spec.md`). The guidelines call these rules optional (§7.2). |
| C8 | Clipboard and privileged APIs | **met** | `copyText` falls back to selection when the Clipboard API is refused (`src/clipboard.ts`, `src/plugin/screens/friend.ts:55–56`); `permissions.clipboardWrite` declared (`server.ts:39`). |
| C9 | Works on desktop and mobile, UI included | **partly** | iPhone app and desktop web passed on 2026-10-08 on the old origin (f-host §1.2). For the new release, every cell in `docs/specs/chatgpt-mvp/release/LIVE-CHECKS.md` is empty. No Android, macOS-app or Windows-app test on record. |
| C10 | Useful without UI (ChatGPT and Codex) | **partly** | The model can create, list, open, resign, draw, invite and join, but moves are app-only (`server.ts:148–149`). *Inference:* a Codex reviewer without the board cannot play. Whether the listing can exclude Codex is not documented. |

### D. Listing, policies and package

| # | Requirement | Status | Evidence |
|---|---|---|---|
| D1 | `plugin.json` + `mcp.json` ZIP | **missing** | No `plugin.json` or `mcp.json` in the repo. |
| D2 | One skill in the ZIP (*inference*, [O4]) | **missing** | No `skills/` folder for the plugin. |
| D3 | Display name, subtitle, long description, category, starter prompts | **missing** | None written. "King Down" fits the name rules. Category: Entertainment. |
| D4 | Square logo ≥ 48 px | **partly** | `public/icons/icon-512.png` (512 × 512) exists; not packaged. |
| D5 | Website URL | **met** | `https://kingdown.dev`. |
| D6 | Privacy policy covers categories, purposes, recipients, retention, controls | **partly** | `public/privacy.html` (updated 2026-10-12) covers most items. Not covered: **activity times** (`last_seen_at`, shown to opponents as online status, `src/match/service.ts:387`) and the **surface** of each move (`last_surface`); server and sign-in **logs with IP addresses**; **retention times** for active accounts, game records and report evidence; **OpenAI** as a recipient of tool results. |
| D7 | Terms of service | **met** | `public/terms.html` (updated 2026-10-03). It does not name the ChatGPT app; low risk. |
| D8 | Support page (HTTPS) | **missing** | Only the address hello@kingdown.dev in `privacy.html` and `terms.html`. `supportURL` must be an HTTPS page [O5]. |
| D9 | Same publisher on the pages and the verified identity | **partly** | Pages name Saar Shai (`privacy.html:32`, `terms.html`). Match only if the owner verifies as an individual. |
| D10 | Ages 13–17 suitable, no under-13 targeting | **met** | `privacy.html` "Children"; preset messages only, no free chat (`server.ts:150`); handle checks (`src/account/profile.ts:63` `handleProblem`). |
| D11 | Report and block for user-to-user play | **partly** | `kingdown_report` exists but is app-only, with no button; no block. The spec says "both come before a public release" (`spec.md` Q13). No OpenAI page requires them; *inference:* random matchmaking with strangers for 13–17 users makes this a review risk. |
| D12 | No commerce, no ads, not a demo | **met** | All items unlocked (`spec.md` Q17); no shop or ads. |
| D13 | Feature parity with the website | **met** | The plugin is not a lesser version; online play is plugin-first (`privacy.html`). |

### E. Review materials and operations

| # | Requirement | Status | Evidence |
|---|---|---|---|
| E1 | 5 positive + 3 negative test cases in OpenAI's shape | **missing** | `docs/plugin-beta-support.md` has 5 + 3 **engineering** scenarios, not prompt-based cases with `tools_triggered` and `expected_behavior`. Ticket 09 writes them. |
| E2 | Demo video URL | **missing** | — |
| E3 | Release notes | **missing** | — |
| E4 | Production HTTPS endpoint, current scan | **missing** | `https://kingdown.dev/mcp` is planned; live steps wait for the owner (`OWNER-STEPS.md`; ticket 19 `needs-info`). |
| E5 | Domain verification file | **missing** | No `/.well-known/openai-apps-challenge`. The token comes from the portal. *Inference:* a static file in `public/.well-known/` can serve it; check that the Vercel build copies dot-folders and that `tools/vercel-check.mjs` allows the new path. |
| E6 | Request origin rules allow the scanner | **partly** | `http.ts:42–48` returns 403 for an `Origin` header other than kingdown.dev, chatgpt.com or chat.openai.com. *Inference:* server-to-server scans send no `Origin`; a portal or Codex client that sends `https://platform.openai.com` would fail. Test during the first scan. |
| E7 | Timeouts, rate limits, logs | **partly** | 30 s function limit and 2.5 s search budget (`tools/plugin-server-build.mjs`, `src/match/service.ts:82`); 4 requests per instance (`http.ts:8`); tool-failure logs with a request ID (`server.ts:57`). Rate limit only on invite-code tries (`src/match/store.ts:100–106`); no metrics. |
| E8 | OpenAI account: verification, role, global-residency project | **missing (owner)** | Not recorded in the repo. |

---

## 9. Gaps ranked by risk of rejection

Risk = how likely the gap alone causes a rejection, or blocks submission. "Blocker" = the portal refuses to submit.

| Rank | Gap | Why it matters | Fix (smallest) | Who |
|---|---|---|---|---|
| 1 | **Reviewer cannot sign in with a password** (B5) | Official rejection reason 1. GitHub sends email codes on a new device [G1]; Google can also challenge. | Add an email + password sign-in path for one review-only account (or all players), seed it with games, a rating and badges, and test it from an outside network. Update the privacy policy. | Owner decides; agent builds. |
| 2 | **`kingdown_get` read-only hint does not match** (A4) | Official rejection reason 4; the description itself states the write. | Remove the `seen` write from the poll and record activity on commands or a separate write tool (the plan in 03 §4.5). Setting `readOnlyHint: false` instead may add approval prompts to each poll. | Agent (one right fix). |
| 3 | **Resource URI changes per build; old URIs not served** (C5) | A deploy after the scan, or any later UI deploy, can blank the board while the new definition is held [O2]. Rejection reason 2 (UI errors). | Serve every URI that a live definition can name: keep a stable versioned URI (`board-v1`) for compatible changes, and keep serving older hashes. Freeze UI deploys between the scan and the review result. | Agent; owner approves the deploy rule. |
| 4 | **No production endpoint, scan or domain verification** (E4, E5) | Blocker: "A production HTTPS MCP server URL, a completed domain-verification challenge, and a successful, current tool scan" are required [O4] *(corrected in check: exact quote)*. | Run the release steps in `OWNER-STEPS.md`, then place the challenge token. | Owner (live steps). |
| 5 | **Android and desktop apps untested; LIVE-CHECKS empty** (C9) | "Must function reliably … on both desktop and mobile"; rejection reason 2 includes surface failures. Android has open blank-board reports (03 §7). | Run LIVE-CHECKS on iPhone, Android, web, macOS app; record results. | Owner (devices); agents (desktop). |
| 6 | **No ZIP package** (D1–D4) | Blocker. | Write `plugin.json` (Agent Plugins format), `mcp.json` with `auth.type: "oauth"`, `client.mode: "provided"`, `tokenEndpointAuthMethod: "none"`, the 512 px logo, one small skill, listing text, three starter prompts. | Agent (ticket 09). |
| 7 | **No test cases, video or release notes in OpenAI's shape** (E1–E3) | Blocker; wrong expected results cause rejection reason 2. | Single-account cases (computer game, games list, profile, join preview, resign with confirm); negatives (real-money stake, play a different chess site, act in a game the user is not in). Video on web and iPhone. | Agent drafts; owner records the video. |
| 8 | **No support page** (D8) | Blocker: `supportURL` must be an HTTPS page. | Add `kingdown.dev/support` with the contact address and the issue template. | Agent. |
| 9 | **Privacy policy gaps** (D6) | Official rejection reason 3 ("user-related data types that are not disclosed"). | Add activity times and online status, play surface, server logs and IP, retention periods, OpenAI as a recipient, and the password if B5 adds one. | Agent drafts; owner approves. |
| 10 | **Destructive hints a reviewer may dispute** (A5) | Rejection reason 4 for invite, say, rematch decline, handle, settings. | Either set `destructiveHint: true` where the strict wording applies (test the prompt effect on app calls first), or write a one-line justification for each. | Owner decides (prompt UX trade-off). |
| 11 | **Moves need the board; Codex has no board** (C10) | Rejection reason 2 if reviewers test in Codex. Docs ask for tools that work without UI [O7]. | Ask OpenAI support whether a UI plugin can be limited to ChatGPT; state the limit in the long description. | Owner asks; agent drafts. |
| 12 | **Report and block not in the UI** (D11) | No explicit rule; risk from public matchmaking with 13–17 users. The owner already plans both before public release. | Add the Report and Block controls planned in Q13. | Owner (taste: placement). |
| 13 | **Internal IDs and timestamps in model output** (A9, A10) | Response-minimization rule; low alone. | Move `board_id`, `revision`, report `id`/`created_at` to `_meta`; add the profile JSON as text. | Agent. |
| 14 | **Consent text incomplete** (B4) | "Users must be informed of all requested permissions." | Name ratings, badges, random play, reports and settings; drop the token jargon. | Agent drafts; owner approves words. |
| 15 | **Custom fonts and wordmark** (C7) | "Optional" UI guidelines; reviewer taste. | Keep the owner's Q18 decision; note the risk. Optional option for the owner: system font for body text only. | Owner (taste). |
| 16 | **Origin allowlist may refuse a reviewer client** (E6) | Rejection reason 1 if it happens. | Watch the first portal scan and Codex test; widen the list only on evidence. | Agent. |
| 17 | **OpenAI account set-up** (E8) | Blocker until done; unverified name = rejection. | Individual verification as Saar Shai, owner role, global-residency project. | Owner. |
| 18 | **Optional quality items** (A2, A3, A12, E7) | Not stated rejection reasons. | Server `instructions`, tool titles, `outputSchema`, status text, a rate limit on `kingdown_computer`. | Agent, later. |

---

## 10. Open questions

For OpenAI support (send with the plugin ID, after the first upload):

1. Does a remote-MCP plugin ZIP need a skill, or does the `plugin_runtime_surface_missing` rule apply only to package-only plugins?
2. Can a plugin with UI be limited to ChatGPT, so that Codex reviewers do not test it?
3. Which callback URL does the portal use for a `provided` public client when the authorization server does not return `iss` (Supabase does not document RFC 9207 support [S1])?
4. Are annotation justifications still required (the errors page and the guidelines disagree)?

For the owner:

5. Reviewer access: a password sign-in for one review account only, or for all players?
6. Destructive hints: accept possible approval prompts on invite, say, rematch decline and settings, or keep `false` with justifications?
7. Report and Block before the first submission, or later?

---

## Sources

All read on **2026-10-15**. OpenAI developer pages show no date; I read them in full through [O18] and spot-checked each page URL.

| Key | Source | URL | Note |
|---|---|---|---|
| O1 | Upload and submit your plugin | https://developers.openai.com/plugins/deploy/submission | Undated; screenshots named `…20260927` |
| O2 | Remote MCP server review requirements | https://developers.openai.com/plugins/deploy/app-review | Undated |
| O3 | Plugin guidelines | https://developers.openai.com/plugins/plugin-guidelines | Undated |
| O4 | Plugin submission errors | https://developers.openai.com/plugins/deploy/submission-errors | Undated |
| O5 | Package your plugin | https://developers.openai.com/plugins/build/plugins | Undated |
| O6 | UI guidelines | https://developers.openai.com/plugins/concepts/ui-guidelines | Undated |
| O7 | Add UI to your MCP server | https://developers.openai.com/plugins/build/chatgpt-ui | Undated |
| O8 | Reference | https://developers.openai.com/plugins/reference | Undated |
| O9 | Authentication | https://developers.openai.com/plugins/build/auth | Undated; cites MCP spec 2026-07-28 |
| O10 | Build an MCP server | https://developers.openai.com/plugins/build/mcp-server | Undated |
| O11 | Security & Privacy | https://developers.openai.com/plugins/guides/security-privacy | Undated |
| O12 | Define tools | https://developers.openai.com/plugins/plan/tools | Undated; read in O18 |
| O13 | Optimize metadata | https://developers.openai.com/plugins/guides/optimize-metadata | Undated; read in O18 |
| O14 | Connect and test your plugin | https://developers.openai.com/plugins/deploy/connect-chatgpt | Undated; read in O18 |
| O15 | Troubleshooting | https://developers.openai.com/plugins/deploy/troubleshooting | Undated |
| O16 | Plugins changelog | https://developers.openai.com/plugins/changelog | Entries 2026-01-15 to 2026-08-21 |
| O17 | Plugin Extensions | https://developers.openai.com/plugins/build/extensions | Undated |
| O18 | Plugins docs, single-file export | https://developers.openai.com/plugins/llms-full.txt | 8,836 lines |
| O19 | What makes a great ChatGPT app (blog) | https://developers.openai.com/blog/what-makes-a-great-chatgpt-app | Undated; refers to the 2025 launch, may be pre-2026 |
| O20 | Managing app permissions in ChatGPT (Help Center) | https://help.openai.com/en/articles/20001495-managing-app-permissions-in-chatgpt | HTTP 403; search snippets only |
| O21 | Plugins (ChatGPT user docs) | https://learn.chatgpt.com/docs/plugins | Undated; no region or age facts |
| X1 | OpenAI MCP extensions spec | https://raw.githubusercontent.com/openai/mcp-extensions/main/docs/spec.md | Undated; cites MCP 2026-07-28 |
| X2 | MCP Apps (ext-apps) releases | https://github.com/modelcontextprotocol/ext-apps/releases | v2.0.3 latest (25 Sep); repo uses 2.0.3 |
| S1 | Supabase: MCP authentication | https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication | Undated; no CIMD or RFC 9207 statement |
| G1 | GitHub: Verifying new devices when signing in | https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/verifying-new-devices-when-signing-in | Read in full on 2026-10-15; page current (© 2026); feature from 2019 *(corrected in check)* |
| C1 | Forum: "App rejected after a month with no explanation" | https://community.openai.com/t/app-rejected-after-a-month-with-no-explanation-where-can-i-find-the-reason/1386788 | Community, 2026-07-14 to 2026-08-25 |
| C2 | Forum: "App rejected with no reason shown" | https://community.openai.com/t/app-rejected-with-no-reason-shown-status-reverted-to-review/1387930 | Community; search summary only |

Repo files read: `src/plugin/server.ts`, `src/plugin/http.ts`, `src/plugin/service.ts`, `src/plugin/client.ts`, `src/plugin/consent.ts`, `src/plugin/consent.html`, `src/plugin/index.html`, `src/plugin/app.css`, `src/plugin/screens/friend.ts`, `src/clipboard.ts`, `src/style.css`, `src/match/service.ts`, `src/match/store.ts`, `src/online/accounts.ts`, `src/plugin/settings.ts`, `tools/plugin-server-build.mjs`, `public/privacy.html`, `public/terms.html`, `public/delete-data.html`, `public/icons/`, `docs/plugin-beta-support.md`, `docs/specs/chatgpt-mvp/spec.md`, `docs/specs/chatgpt-mvp/release/*.md`, and the earlier research named at the top.
