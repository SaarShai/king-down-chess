# Muse connector: technical contract

Date: 2026-11-08. Scope: what a Meta Muse connector must do on the wire, for auth, for tools, for display, and for access. This note records facts. It does not choose a design.

Tags: **[verified: source]** = a primary source states it. **[verified-2: source]** = a developer who used the login-only portal states it (second-hand, not Meta). **[inferred]** = my conclusion from verified facts. **[unknown]** = no public source; the data is behind a login or not published.

"Portal JS" = public client code that the Muse Connector Platform sends to every browser, for example `https://platform.muse.ai/_next/static/immutable/chunks/2960wu9of8_1v.js` (submission credential logic) and `.../17bb29lazh5s9.js` (event names). Client code is not documentation. It can change without notice. It shows what the portal checks today.

## 0. Corrections to the brief

1. Muse and "Meta AI" are two different assistants with two different connector programs. **Muse Connector Platform** (platform.muse.ai) is for Muse. **Meta AI Connectors** (dev.meta.ai/products/connectors) is a developer preview for the Meta AI assistant on glasses, app and web. [verified: https://dev.meta.ai/products/connectors — the page links "Muse Connectors ↗" to https://muse.ai/platform as a separate product]
2. Muse is not on AI glasses today. Meta says Muse comes to AI glasses "in the coming months". [verified: https://about.fb.com/news/2026/09/the-biggest-news-from-connect-2026/, 2026-09-24] The glasses surface today is Meta AI, not Muse. [inferred]
3. `https://platform.muse.ai/docs` and `/terms` now send HTTP 307 to `https://muse.ai/platform/docs` and `https://muse.ai/platform/terms`. The content is the same. [verified: curl, 2026-11-08]
4. The other facts in the brief are correct. [verified: https://platform.muse.ai/docs, https://dev.meta.ai/products/connectors]

## 1. Transport

| Question | Answer | Tag |
|---|---|---|
| Does Muse call a remote MCP server? | Yes. The submission form has a "Connection type" switch: **Raw API** (API URL, optional OpenAPI spec URL, docs) or **Existing MCP** (hosted MCP endpoint, docs). Raw API is the default. | [verified-2: https://stacktr.ee/blog/muse-connector-platform; https://manufact.com/blog/submit-mcp-server-to-muse] |
| Does the portal read the MCP server? | Yes. The credentials step takes an "MCP snapshot" of the server. It has "edit URL", "refresh" and "MCP schema" controls. The credential test report carries `mcpSnapshotAttemptTime`. | [verified: Portal JS, events `developer_credentials_mcp_snapshot_refresh_click`, `developer_credentials_mcp_schema_click`; field `mcpSnapshotAttemptTime`] |
| What does the snapshot use? | The portal uses the token from the latest credential check to build the tool listing. Reviewers see the same listing. | [verified-2: manufact.com] |
| Terms scope | The Connector Terms name "MCP interfaces or servers", "APIs", "SDKs", "protocols", "schemas", "endpoints" as Connector Interfaces. | [verified: https://platform.muse.ai/terms] |
| MCP version | Not published. | [unknown] |
| Streamable HTTP or SSE | Not published. All community Muse MCP connectors found use Streamable HTTP. One lists protocol `2025-06-18`, stateless, JSON responses, GET returns 405. No approval of these is shown. | [unknown] for Meta; [verified-2: https://github.com/barbarkaragul-oss/barbaros-mcp/blob/HEAD/connectors/muse/PORTAL.md; https://github.com/Adspirer/adspirer-muse-connector/blob/HEAD/submission/connector.json] |
| Current MCP spec | The current MCP revision is `2026-07-28`. It has no handshake. The version goes in each request (`_meta` key `io.modelcontextprotocol/protocolVersion` and the `MCP-Protocol-Version` header), and `server/discover` is a mandatory RPC. `2025-11-25` and earlier use the handshake. | [verified: https://modelcontextprotocol.io/specification/versioning] |
| Stateless OK? | Not stated by Meta. | [unknown] |
| Required endpoints or headers | Not published, apart from OAuth discovery (section 2). | [unknown] |
| IP allow list | Not published. Muse runs in "Muse Secure VM", and "Nothing Muse does reaches the internet unless the Sentinel approves it." | [unknown] for IPs; [verified: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/] |
| Timeouts, response size, rate limits | Meta publishes no limits. The guidelines tell **you** to document your own rate limits and errors. The portal JS has a `token_endpoint_timeout` failure code only for the OAuth test. | [unknown]; [verified: https://platform.muse.ai/docs §5.4; Portal JS] |

**Consequence [inferred]:** Build one Streamable HTTP endpoint (POST, JSON responses, no server session). Accept both the `2025-11-25` handshake and the `2026-07-28` per-request version. Our SDK pin (`@modelcontextprotocol/sdk` 1.32.1 in `package.json`) needs a check for `2026-07-28` support. Keep each tool response small and fast. Treat limits as unknown until the portal shows them.

## 2. Auth

Source for every row in this table, unless the row names another source: Portal JS `https://platform.muse.ai/_next/static/immutable/chunks/2960wu9of8_1v.js` [verified]. These are the checks the portal's credential test runs.

| Item | What the portal accepts |
|---|---|
| Credential types | `CLIENT_ID`, `CLIENT_SECRET`, `API_KEY` |
| Grant types (static client) | "Authorization code" or "Client credentials" |
| Client types | "Public client" or "Confidential client". A public client **must** use authorization code **with PKCE** and `token_endpoint_auth_method` `none`. A confidential client uses `client_secret_basic` or `client_secret_post`. Client credentials grant must not use PKCE. |
| URLs | Authorization URL and token URL must be `https`, with no user or password in the URL, ≤ 2048 chars. |
| Client registration | `OAUTH_REGISTRATION_METHODS = ["dcr","cimd"]`: Dynamic Client Registration or a Client ID Metadata Document. Static client ID (and secret) is the third route. |
| Muse CIMD (test) | `https://platform.muse.ai/oauth/client-metadata.json` is public. It holds `client_id` = that URL, `client_name` "Muse", `redirect_uris` = `https://platform.muse.ai/oauth/credential-test/callback`, `grant_types` = `authorization_code`, `refresh_token`, `response_types` = `code`, `token_endpoint_auth_method` = `none`. [verified: fetch, 2026-11-08] |
| Production CIMD | Not public. `https://muse.ai/oauth/client-metadata.json` returns 401 "Authentication required". [verified: curl] Its content is [unknown]. |
| Callback URLs | `MUSE_CONNECTOR_OAUTH_CALLBACK_URL = "https://muse.ai/api/hatch/oauth/callback"`. The portal test callback is `<origin>/oauth/credential-test/callback`, origin `https://platform.muse.ai` or `https://platform.museai.com`. `oauthAllowedCallbackURLs` returns the production URL plus the test URL, so the provider must allow both. |
| State format | `^oct1\.[A-Za-z0-9_-]{16,256}$` |
| Scopes | Up to 100 scopes, each ≤ 255 chars, total ≤ 8192 chars, no duplicates, RFC 6749 scope characters. |
| Test accounts | `REQUIRED_TEST_USERS = 2` (slots 1–10). Each OAuth test account must pass a sign-in test with a stored token. Fields: label, username, password, notes. |
| Credential test steps | `discovery`, `token_endpoint`, `client_authentication`, `scopes`, `sign_in`, `code_exchange`, `registration`, `client_metadata`, `token_storage`. |
| Failure codes that matter | `discovery_failed`, `pkce_unsupported`, `registration_endpoint_missing`, `registration_requires_authorization`, `registration_requires_client_secret`, `redirect_uri_rejected`, `client_metadata_rejected`, `nonstandard_token_error`, `invalid_scope`, **`token_lifetime_too_short`** (the minimum lifetime is [unknown]). |
| Discovery | The `discovery` step and `discovery_failed` code show that Muse reads OAuth metadata from the server [inferred]. A community guide says: when you serve no OAuth metadata, `/.well-known/oauth-authorization-server` must return a real 404, not an HTML page. [verified-2: https://allcleardigital.com/blog/meta-muse-connector-submission-guide via search summary, not opened] |
| CIMD side effect | DCR during the test leaves a client registered at your provider. CIMD registers nothing. A 2026-11-04 test passed with CIMD. [verified-2: manufact.com] |
| Form auth choices | "API keys", "OAuth with PKCE", "Other" checkboxes. Authentication is optional on the form. [verified-2: stacktr.ee; manufact.com] |
| No-auth tools | A connector with no auth was submitted (public read-only tools). Its approval is [unknown]. [verified-2: barbaros-mcp PORTAL.md] The guidelines do not forbid tools without an account. [verified: https://platform.muse.ai/docs] |
| Read-only option | "offer users the option to limit Muse's permissions to Read Only, where possible." No scope name is set by Meta. [verified: https://platform.muse.ai/docs §3.1] The Help Center says many connectors can be limited to data retrieval. [verified: https://www.meta.com/help/artificial-intelligence/1687253048996149/] |
| Token audience (RFC 8707) | Not published. | [unknown] |
| Refresh | The test CIMD asks for `refresh_token` grant. [verified: client-metadata.json] A single unverified user report says custom OAuth connectors lose access after about one hour with no refresh. [verified-2: https://postfa.st/blog/meta-muse-connectors-list, citing r/MuseAgent 2026-10-11] |
| Revocation | You must stop access when the user revokes authorization, and delete data. [verified: https://platform.muse.ai/docs §4.4; https://platform.muse.ai/terms "Privacy and Data Handling" (f)] Users disconnect in Settings. [verified: Help Center 1687253048996149] A revocation endpoint is not named. [unknown] |
| Ownership proof | The credentials step has an "ownership challenge" with copy, download, reload and verify actions. [verified: Portal JS event names] What it proves (domain or endpoint) is [unknown]; a file or token you serve is likely [inferred]. |

**Consequence [inferred]:** Our Supabase accounts need an OAuth 2.1 authorization server in front of them (or Supabase's own OAuth server, if it supports these items): authorization code + PKCE S256, public client, CIMD support (fetch the `client_id` URL), DCR as a fallback, refresh tokens, RFC 9728 protected-resource metadata, both redirect URIs allowed, two test accounts. Offer a read scope and a play scope.

## 3. Tool semantics

| Question | Answer | Tag |
|---|---|---|
| Classes | Read, Write, Sensitive write. Meta classifies each tool in review. A tool that reads and writes is a Write. | [verified: https://platform.muse.ai/docs §3.2] |
| Defaults | Read and Write: "Ask on first use", then Allow once / Always allow / Deny. Sensitive write: every use, Allow once / Deny. | [verified: §3.3] |
| How to mark today | Put Read/Write/Sensitive in your tool documentation. Portal tool annotation is "coming soon". | [verified: §5.6] |
| Are MCP annotations read? | The portal tool listing shows badges for **destructive**, **idempotent** and **open-world** hints. Reviewers expand each tool to see parameters, input and output schemas, and badges. | [verified-2: manufact.com, screenshot 2026-11-04] |
| Do annotations set the class? | Not stated. Meta reviewers set the class. | [unknown] |
| outputSchema / structuredContent | The listing shows "input and output schemas". How Muse uses `structuredContent` at run time is not published. | [verified-2: manufact.com]; [unknown] for runtime |
| Descriptions | Must be factual. No steering, no hidden send/share/publish/payment in a read. | [verified: §3.2] |
| Approval scope | Allow once covers the exact details shown. A change in details needs a new approval. | [verified: §3.4] |
| Status handling | Distinguish quoted, pending, confirmed, failed, cancelled. Check status before a retry. Prevent duplicates. | [verified: §4.7, §2] |
| Bounded actions | "Non-deterministic skill(s) must define a bounded action range." | [verified: https://platform.muse.ai/terms, Prohibited Practices] |

**Consequence [inferred]:** A move tool changes game state, so it is a Write. Moves are not sensitive (no money, no message, reversible by the game rules or not consequential). Resign or abandon a ranked game can be argued as consequential; document it as a Write and let review decide. Give every tool `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`, an `outputSchema`, and an idempotency key for moves.

## 4. Rendering

| Question | Answer | Tag |
|---|---|---|
| MCP Apps / `ui://` widgets | No public source says Muse renders them. No source says it does not. | [unknown] |
| Images, markdown, links, buttons | Not published. One community connector returns a page image from a tool; no proof that Muse shows it. | [unknown] |
| Muse client hints | Muse's web client has events for "chat widget", inline approval cards, "artifacts" and artifact sharing. These are Muse's own UI, not proof of third-party UI. | [verified: Portal JS event names]; meaning [inferred] |
| Glasses | Muse: not on glasses yet. Meta AI (separate) answers "through the glasses". Meta Ray-Ban Display runs **Web Apps** (HTML/CSS/JS by URL) and **WebMCP** (page-defined tools Meta AI calls), both developer preview. | [verified: about.fb.com Connect post; https://developers.meta.com/blog/meta-connect-recap-ai-glasses/ (2026-09-24, read via fetch tool)] |
| Streaming / progress | Not published. | [unknown] |

**Consequence [inferred]:** Design every tool so its text result is complete for voice and chat: a short spoken summary plus a compact board (for example FEN plus a text diagram) in `structuredContent`. Treat any picture or widget as a later add-on. Our parked ChatGPT `ui://` widget (`src/plugin/server.ts`) can stay, but Muse must not depend on it. A glasses board view belongs to the Ray-Ban Display Web App path, which is a separate product and a separate decision.

## 5. Access and lifecycle

| Item | Answer | Tag |
|---|---|---|
| Muse portal access | Open sign-in with a work email (six-digit code). New accounts give a date of birth. | [verified-2: stacktr.ee] [verified: login page text "Sign in or create an account with your work email"] |
| Portal flow | Form: Overview → Technical specs → Review. Then portal: Business verification, Data processing questionnaire, Integration credentials (Technical specs → Settings → Test → MCP listing). Statuses: Submitted, Under review, Testing, Approved. | [verified-2: manufact.com; postfa.st]; portal page names [verified: Portal JS] |
| Business verification | Persona checks the company. A personal (KYC-like) route was offered. Whether an individual qualifies is not stated in the docs. | [verified-2: manufact.com]; [unknown] for rules |
| Questionnaire | Organization type, sensitive data, deletion incl. logs and backups, TLS 1.2+, encryption, access control, MFA, incident response; optional trust-center URL and SOC 2 PDF (≤ 4 MB). | [verified-2: manufact.com] |
| Backlog | More than 4,500 submissions and an onboarding backlog (Meta email, 2026-10-23). | [verified-2: manufact.com] |
| Status contact | Portal only. No replies to status emails. | [verified: §5.7] |
| Test mode / private connector | Not published for platform connectors. A user can ask Muse to build a **custom connector**; Meta does not review it, and Muse keeps its credentials. This lets us test with our own Muse account. Whether a custom connector takes an MCP URL is disputed; one adapter project gives Muse an API description (OpenAPI) with bearer or OAuth. | [verified: https://www.meta.com/help/artificial-intelligence/1687253048996149/]; [verified-2: https://github.com/sept-usc/muse-mcp-adapter docs/authentication.md] |
| Invite testers | Meta AI Connectors preview: yes ("invite your own testers"). Muse: not published. | [verified: dev.meta.ai/products/connectors]; [unknown] for Muse |
| Meta AI Connectors preview | By application, in waves. Needs a live REST API (form asks REST/OpenAPI, GraphQL or Other). Gives MCP and "AI Developer Center UI". Preview connectors are not public. Publishing comes later. | [verified: https://dev.meta.ai/products/connectors] |
| Regions | Muse launched in the US (2026-09-08); later Singapore (2026-10-27) and Japan. Portal JS has a "{productName} isn't available to new users in your region" message. | [verified: about.fb.com launch post; Portal JS]; full list [unknown] |
| Age | Muse users must be 18+ (or higher local age). | [verified: https://muse.ai/terms §1] |
| Games allowed? | No category list. Meta AI Connectors FAQ names "entertainment" as a good fit and its form lists "Gaming & Entertainment". Terms ban real-money gambling and cash-out of virtual goods. | [verified: dev.meta.ai/products/connectors; platform.muse.ai/terms] |
| Value test | Must add value beyond the browser; a wrapper of public pages or links is not enough; must finish the tasks it starts. | [verified: §1.1–1.2] |
| Discovery | Approved connectors appear to the Muse agent and in Settings > Connectors. Featuring is separate. | [verified: §7] |

### Connector Terms points for a free game [verified: https://platform.muse.ai/terms, effective 2026-09-18]

- Meta gets a licence to use our name and marks to promote the connector, and to use Connector Content and interaction data (queries, tool calls, outputs) to personalize and improve Muse.
- We may process User Data only to provide, secure, support and improve the connector, within user-granted scopes.
- Notify Meta within 48 hours of a security incident with User Data (vendor-incident@meta.com).
- Keep a public privacy notice. Meta and we are independent controllers under Meta's Data Protection Requirements.
- Delete User Data at the earlier of revocation, a deletion request, or when no longer needed. Keep records that show compliance. Meta may audit once a year.
- Fix defects and stale data promptly; keep commercially reasonable uptime and a support contact.
- Either side can end on 30 days' notice; Meta can suspend at once. Meta's liability cap is USD 1,000. We indemnify Meta.
- No reverse engineering, no circumvention of rate limits or review, no multiple developer accounts.

## 6. Samples, SDKs and repos

| Item | Finding | Tag |
|---|---|---|
| Meta connector SDK | None. Meta AI Connectors: "No new SDK, no new app." | [verified: dev.meta.ai/products/connectors] |
| Meta-Models GitHub | Repos: meta-model-cookbook, meta-oss-cookbook, muse-code-sdk, meta-sam, legal-agent-workshop. None is a Muse connector sample. | [verified: https://api.github.com/orgs/meta-models/repos, 2026-11-08] |
| dev.meta.ai docs | No connector page in `llms.txt` or the sitemap. Docs cover Model API and Muse Code (Muse Code supports MCP servers as a client). | [verified: https://dev.meta.ai/llms.txt; https://dev.meta.ai/sitemap.xml] |
| Community connectors (not Meta) | Houlens (OAuth 2.1 + PKCE S256, CIMD or DCR, scope `mcp`, all tools `readOnlyHint: true`): https://github.com/normantics/houlens-muse-connector. Barbaros (no auth, Streamable HTTP 2025-06-18): https://github.com/barbarkaragul-oss/barbaros-mcp. Adspirer (Existing MCP, OAuth PKCE S256): https://github.com/Adspirer/adspirer-muse-connector. A fantasy-football MCP connector exists: https://github.com/mitchellOpZero/muse-fantasy-connector. | [verified-2] |
| Launch partners | Gmail, Google Calendar, Outlook, OpenTable, Ticketmaster, Shopify catalog, Notion, Granola, GitHub, Box, Walmart, Best Buy, Instacart and others. No game partner found. | [verified: about.fb.com Connect post]; full list [verified-2: postfa.st] |
| Help Center | Connectors: https://www.meta.com/help/artificial-intelligence/1687253048996149/. Approvals: https://www.meta.com/help/artificial-intelligence/1385290430137537/. Browser: https://www.meta.com/help/artificial-intelligence/2124746764949121/. | [verified, read via fetch tool; curl gets HTTP 400] |

## 7. Behind a login, so unknown

- The exact portal form, dropdowns (for example categories and the payments choice) and any portal-only rules.
- Production OAuth client metadata (`https://muse.ai/oauth/client-metadata.json` needs auth).
- MCP version, session handling, timeouts, size limits, rate limits and source IPs that Muse uses at run time.
- Whether Muse renders anything except text (MCP Apps, images, links).
- Whether annotations set the Read/Write class.
- The minimum token lifetime behind `token_lifetime_too_short`.
- Whether an individual developer passes business verification.
- Whether the Meta AI Connectors preview (glasses) and the Muse platform share one connector.
