# MCP standards and hosting for the Muse connector

Research date: 2026-11-08. Scope: the facts that change a decision for a remote MCP connector that Muse (Meta AI) calls. Tags: [verified: source], [inferred], [unknown]. "Repo" means the worktree `app/.claude/worktrees/muse-connector` (branch `muse-connector`).

## Decisions in short

1. Build on the MCP spec **2026-07-28** with the **v2 TypeScript SDK** (`@modelcontextprotocol/server` + `@modelcontextprotocol/node`). Keep the default `legacy: 'stateless'` posture, so one endpoint also serves 2025-era clients. We do not know which era Muse speaks. [inferred]
2. Do not use sessions. The new spec has no sessions. Put game state in Postgres and pass a game ID as a tool argument. [verified: https://modelcontextprotocol.io/specification/2026-07-28/changelog.md]
3. Host the MCP endpoint on **Vercel Functions (Node, Fluid compute)** in the existing `kingdown` project, at `https://kingdown.dev/mcp`. [inferred, reasons in section 4]
4. Keep **Supabase Auth OAuth 2.1 server** as the authorization server, with a **pre-registered** Muse client and the existing audience hook. Do not turn on DCR. Supabase has no custom scopes, so a "read-only" option needs a second client or an app-level flag. [verified + inferred, section 5]
5. Design every tool for **text and structured output first**. No primary source shows that Muse renders MCP Apps (`ui://`) widgets. Glasses are a voice surface. [verified: https://modelcontextprotocol.io/extensions/client-matrix.mdx source; inferred for glasses]
6. Test with the SDK's in-process `Client`, the MCP Inspector CLI, and the subset of the official conformance suite that applies to a real app server. [verified, section 6]

## 1. MCP spec: latest version and server-side changes

**Latest version.** `https://modelcontextprotocol.io/specification/latest` redirects to `2026-07-28`. The previous version is `2025-11-25`. [verified: https://modelcontextprotocol.io/specification/latest]

**Changes that matter for our server** [verified: https://modelcontextprotocol.io/specification/2026-07-28/changelog.md]:

| Area | 2026-07-28 rule | Effect on us |
| - | - | - |
| Sessions | `Mcp-Session-Id` is removed. List results do not vary per connection. Cross-call state uses server-minted handles in tool arguments (SEP-2567). | Game ID and invite code are tool arguments. No sticky instances. |
| Handshake | `initialize` is removed. Each request carries protocol version and client capabilities in `_meta`. Servers MUST implement `server/discover` (SEP-2575). | The v2 SDK does this. The v1 SDK in the repo does not. |
| GET stream | The HTTP GET endpoint and `resources/subscribe` are removed. `subscriptions/listen` is a long-lived POST stream (opt-in). | We need no push. "Opponent moved" is a read tool. |
| Resumability | SSE resumability (`Last-Event-ID`) is removed. A broken stream loses the request; the client re-sends it. | Write tools must be safe to retry (idempotency key or move number). |
| Server-to-client requests | Replaced by Multi Round-Trip Requests: the server returns `resultType: "input_required"` with `inputRequests`; the client retries with `inputResponses` and an opaque `requestState` (SEP-2322). | A confirm step (for example "resign?") can use form elicitation through MRTR. `requestState` must be integrity-protected (the spec example says "AEAD-protected blob"). [verified: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr.md] |
| `resultType` | Every result carries `resultType`. | SDK handles it. |
| HTTP headers | POST requests carry `Mcp-Method` and `Mcp-Name`; the server rejects a mismatch with `_meta` (SEP-2243). | SDK handles it. CORS must allow these headers if a browser client calls us. |
| Caching | `tools/list` and resource reads carry required `ttlMs` and `cacheScope` (SEP-2549). Tools SHOULD be in a deterministic order. | Set a long `ttlMs`; the tool list is static. |
| Schemas | `inputSchema`/`outputSchema` allow any JSON Schema 2020-12 keyword; `structuredContent` can be any JSON value (SEP-2106). | Return the board as `structuredContent` plus a short text summary. |
| Error codes | Resource not found is `-32602`. MCP reserves `-32020..-32099`. | Use `isError: true` tool results for game errors, not JSON-RPC errors. |
| Deprecated | Roots, Sampling, Logging (SEP-2577); HTTP+SSE transport; **Dynamic Client Registration** (PR #2858). | Do not build on these. |

**Elicitation.** Form mode and URL mode exist. Servers MUST NOT use form mode for passwords, keys, tokens or payment data; they MUST use URL mode for that. [verified: https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation.md:14-33] The `notifications/elicitation/complete` notification and `elicitationId` are removed. [verified: changelog minor change 11] Muse support for elicitation is [unknown]. Muse has its own "Ask on first use" and per-call approval for sensitive writes [verified: https://platform.muse.ai/docs, section 3], so we must not depend on elicitation for a required step. [inferred]

**Tool annotations.** `readOnlyHint`, `destructiveHint` (default true), `idempotentHint`, `openWorldHint`, `title` stay. Clients MUST treat them as untrusted unless the server is trusted. [verified: https://modelcontextprotocol.io/specification/2026-07-28/schema.md (ToolAnnotations); server/tools.md:304] Muse's portal field for Read/Write/Sensitive is "coming soon"; until then the designations go in the tool docs. [verified: https://platform.muse.ai/docs, section 5.6] Set the MCP hints so that they agree with the Muse designations. The parked plugin already sets all four hints on each tool. [verified: src/plugin/server.ts:69]

**Resource links.** `resource_link` content and embedded resources remain in tool results. [verified: https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md:452-488] A link to a public web page alone does not give "value beyond the browser". [verified: https://platform.muse.ai/docs, section 1] A resource link can still point to the full game at `https://kingdown.dev/g/<id>` as a fallback, next to real tool results. [inferred]

**Authorization (2026-07-28)** [verified: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization.md]:
- The authorization server MUST implement OAuth 2.1 (PKCE). (line 60)
- The MCP server MUST publish Protected Resource Metadata (RFC 9728) and clients MUST use it for discovery. (line 72)
- The server SHOULD put `scope` in the `WWW-Authenticate` challenge. (Scope Selection Strategy)
- Client registration: **Client ID Metadata Documents (CIMD)** SHOULD be supported; **pre-registration** is the option "when client and server have an existing relationship"; DCR is MAY and deprecated. [verified: .../basic/authorization/client-registration.md:9-16, 128-145]
- Clients MUST send RFC 8707 `resource` with the canonical server URI. (line 217-222)
- The server MUST check that the token audience is itself (RFC 8707 section 2), MUST answer 401 for invalid or expired tokens, and MUST NOT accept or pass through other tokens. (line 285-296)
- Authorization servers SHOULD return `iss` in the authorization response (RFC 9207); clients MUST check it when present. [verified: changelog minor change 7]

## 2. MCP Apps extension

- **Status.** SEP-1865 "MCP Apps" is **Final**, Extensions Track. Identifier `io.modelcontextprotocol/ui`. UI is a `ui://` resource that the host renders in a sandboxed iframe. [verified: https://modelcontextprotocol.io/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp.md; https://modelcontextprotocol.io/extensions/apps/overview.md]
- **Package.** `@modelcontextprotocol/ext-apps` latest is 2.0.4 (2.1.0 published 2026-10-27 but not tagged latest). It has peer dependencies on the **v2** packages `@modelcontextprotocol/server`, `client`, `core` ^2.0.0. [verified: https://registry.npmjs.org/@modelcontextprotocol/ext-apps; node_modules/@modelcontextprotocol/ext-apps/package.json]
- **Hosts with MCP Apps support** (community matrix): Claude web, Claude Desktop, VS Code GitHub Copilot, Microsoft 365 Copilot, Goose, Postman, MCPJam, ChatGPT, Cursor, Archestra.AI, PostHog Code, Kiro Crew, Glean. Not Claude Code, not the Inspector. [verified: https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/docs/extensions/client-matrix.mdx, lines 37-53]
- **Meta / Muse.** Meta and Muse are not in the matrix. The Muse guidelines and the Meta AI Connectors page say nothing about UI resources, widgets or `ui://`. The connectors page says "No new SDK, no new app" and "turns your existing API into tools". [verified: https://platform.muse.ai/docs; https://dev.meta.ai/products/connectors] Meta's early-access form asks for "a live REST API" and offers "REST API (OpenAPI / Swagger spec)", "GraphQL" or "Other". [verified: https://dev.meta.ai/products/connectors] So Muse support for MCP Apps is [unknown], and the glasses surface is voice-first. [inferred]
- **Decision effect.** Do not make the connector depend on MCP Apps. Every tool result must stand alone as short text (for voice) plus `structuredContent`. A `ui://` board can be an optional add-on later if Meta documents support. [inferred]

## 3. TypeScript SDK

- **Repo state.** `package.json` asks for `@modelcontextprotocol/sdk` `^1.32.1` and `@modelcontextprotocol/ext-apps` `^2.0.3`. [verified: package.json:48-49] Installed: sdk **1.32.1**, ext-apps 2.0.3, client 2.3.1, core 2.3.1; `@modelcontextprotocol/server` is **not installed**, so the ext-apps peer is missing. [verified: node_modules/@modelcontextprotocol/*/package.json; ls node_modules/@modelcontextprotocol]
- **v1 cannot speak 2026-07-28.** Installed v1 has `LATEST_PROTOCOL_VERSION = '2025-11-25'` and supports only 2024-10-07 to 2025-11-25. [verified: node_modules/@modelcontextprotocol/sdk/dist/esm/types.js:2]
- **Current releases.** v1 line: `@modelcontextprotocol/sdk` 1.32.2 (2026-10-23), bug and security fixes for at least six months after 2026-07-27. v2 line (stable, implements 2026-07-28): `@modelcontextprotocol/server` and `client` 2.4.0 (2026-10-23), `@modelcontextprotocol/node` 2.1.2. [verified: https://registry.npmjs.org/@modelcontextprotocol/{sdk,server,client,node}; https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/README.md]
- **Recommended stateless server (v2).** `createMcpHandler(factory)` returns a web-standard `{ fetch }` handler. The factory runs once per HTTP request and gets `authInfo`; the handler keeps nothing between requests. On Node, wrap it with `toNodeHandler` from `@modelcontextprotocol/node`. It replaces the v1 per-request `StreamableHTTPServerTransport` + `connect()` wiring that the parked plugin uses (src/plugin/http.ts:116). [verified: https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/serving/http.md]
- **Legacy clients.** Default `legacy: 'stateless'` serves 2025-era `initialize` clients per request from the same factory; `legacy: 'reject'` makes the endpoint modern-only. [verified: .../docs/serving/legacy-clients.md] Keep the default until we know Muse's era. [inferred]
- **Host and Origin.** The handler checks no `Host`, no `Origin` and no token. Put `hostHeaderValidationResponse` / `originValidationResponse` (or the Node guards) in front. [verified: .../docs/serving/http.md, "Validate Host and Origin"] The parked plugin already does its own host and origin checks. [verified: src/plugin/http.ts:52]
- **Auth helpers.** `requireBearerAuth({ verifier, requiredScopes, resourceMetadataUrl, expectedResource })` exists for Express and for web-standard handlers. It gives 401 `invalid_token` with a `WWW-Authenticate` challenge that has `resource_metadata`, and 403 `insufficient_scope`. It also answers 401 when `expiresAt` is unset. `mcpAuthMetadataRouter` publishes RFC 9728 metadata. We supply `verifyAccessToken`. The v1 authorization-server helpers (`mcpAuthRouter`, `ProxyOAuthServerProvider`) are frozen in `@modelcontextprotocol/server-legacy/auth`; the SDK says to use a dedicated identity provider. [verified: .../docs/serving/authorization.md] The repo's `jose` verifier (src/plugin/auth.ts:21-37) fits as `verifyAccessToken`. [inferred]
- **Test helpers.** Pass `handler.fetch` as the `fetch` option of `StreamableHTTPClientTransport` and drive it with a real `Client` in-process (no port). `InMemoryTransport.createLinkedPair()` also exists. `handler.close()` aborts in-flight work between tests. [verified: .../docs/testing.md]
- **Vercel adapter.** Vercel's `mcp-handler` v2 now builds on `@modelcontextprotocol/server@2`, but it targets Next.js App Router. [verified: https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel.md:61-146] The repo is not Next.js, so the SDK's own handler plus `toNodeHandler` is the leaner path. [inferred]

## 4. Hosting

| | Vercel Functions (Node, Fluid) | Cloudflare Workers | Supabase Edge Functions | Fly Machines |
| - | - | - | - | - |
| Time limit | Default 300 s; Pro max 800 s. [verified: https://vercel.com/docs/functions/limitations.md:146-154] | CPU 30 s default, 5 min max (paid); free 10 ms. [verified: https://developers.cloudflare.com/workers/platform/limits/index.md:22,73] | **2 s CPU per request**; wall clock 400 s (paid); idle timeout 150 s. [verified: https://supabase.com/docs/guides/functions/limits.md] | No platform limit (a VM). [inferred] |
| Cold start | Bytecode caching and pre-warming on production; instances serve many requests. [verified: https://vercel.com/docs/fluid-compute.md:50,100-114] | Isolates; startup limit 1 s. [verified: CF limits:29] | [unknown] | Stopped machine must boot; always-on costs money. [inferred] |
| Cost at low traffic | Pro usage billed on demand against the Pro credit the team already pays. Invocations $0.60/M. [verified: https://vercel.com/docs/functions/usage-and-pricing.md:18,84] | $5/month minimum for paid plan. [verified: https://developers.cloudflare.com/workers/platform/pricing/index.md:19] | Pro: 2 M invocations included, then $2/M. [verified: https://supabase.com/docs/guides/functions/pricing.md] | From $2.19/month (256 MB, always on). [verified: https://fly.io/docs/about/pricing/] |
| Postgres | Repo already reaches Supabase Postgres from Vercel with `pg` and a runtime role. [verified: package.json:53; docs/HOSTING.md] | Needs Hyperdrive or a driver over TCP sockets; new setup. [inferred] | Same platform as the database. [inferred] | TCP, like Vercel. [inferred] |
| OAuth | Bring your own AS (Supabase). | `@cloudflare/workers-oauth-provider` is a full AS + resource server: pre-registered, CIMD and DCR clients, RFC 8707 audiences, RFC 9207 `iss`, custom scopes, MCP 2026-07-28; needs a KV namespace. [verified: https://raw.githubusercontent.com/cloudflare/workers-oauth-provider/main/README.md] | `@supabase/server` gives `withOAuthProtectedResource()` and `withSupabase({ auth: 'user' })`. [verified: https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication.md:74-82] | Bring your own AS. |
| Lock-in | Low: web-standard handler, plain Node. [inferred] | Medium-high: KV, Service Bindings, workerd. [inferred] | Medium: Deno runtime. [inferred] | Low (Docker). [inferred] |
| Fit with repo | Same project, same deploy script, same domain, same checks. [verified: docs/HOSTING.md "Deploy"; tools/plugin-server-build.mjs:77 writes a `nodejs24.x` function with `maxDuration: 30`] | Second platform, second deploy path. | 2 s CPU is a risk for the computer player and the match runtime. [inferred] | Second platform, ops work. |

**Recommendation: Vercel Functions in the existing `kingdown` project.** Reasons:
1. The repo already builds, checks and deploys a Node MCP function to Vercel (`functions/mcp.func`, `nodejs24.x`) through `tools/deploy.sh`, and the parked build already answers 404 on `/mcp` and the OAuth paths. [verified: tools/plugin-server-build.mjs:45,77-92; docs/HOSTING.md "Parked"] A Muse switch can reuse this path. [inferred]
2. Postgres access, secrets, the domain and the staging profile exist and work. [verified: docs/HOSTING.md]
3. No new monthly fee; Fluid compute removes most cold-start cost; the 300 s default covers engine moves. [verified: Vercel docs above; inferred for engine timing]
4. The SDK handler is web-standard, so a later move to Workers or Fly costs little. [inferred]

Cloudflare is the better choice only if we want CIMD, custom scopes and `iss` today without Supabase; that needs a second platform and a new user store bridge. [inferred]

## 5. Authorization server: Supabase OAuth 2.1 server vs our own

**Supabase now has an OAuth 2.1 server** [verified: https://supabase.com/docs/guides/auth/oauth-server.md; .../getting-started.md:28]:
- Beta, all plans, no separate charge; users count as MAUs.
- Authorization code with PKCE; OIDC; refresh token rotation; JWKS.
- Dynamic client registration is optional and off by default (`allow_dynamic_registration = false`); Supabase warns that it lets any client register. [verified: .../getting-started.md:44; .../mcp-authentication.md:62-64]
- Public (`none`) and confidential (`client_secret_basic`, `client_secret_post`) clients. [verified: .../oauth-flows.md:221-251]
- **Custom scopes are not supported**; only `openid`, `email`, `profile`, `phone`. [verified: .../oauth-flows.md:399]
- Access tokens default to `aud: "authenticated"`; a Custom Access Token Hook can set `aud` per client. [verified: .../token-security.md:25,166-247]
- The consent UI is ours: Supabase redirects to our page with `authorization_id`, and we call `approveAuthorization` / `denyAuthorization`. [verified: .../oauth-flows.md:165-177]

**Live production metadata** (public discovery document): issuer `https://utqzovjmclfyojedmwok.supabase.co/auth/v1`; `code_challenge_methods_supported: ["S256","plain"]`; scopes `openid profile email phone offline_access`; auth methods `client_secret_basic client_secret_post none`. It has **no `registration_endpoint`**, **no `client_id_metadata_document_supported`**, and **no `authorization_response_iss_parameter_supported`**. [verified: https://utqzovjmclfyojedmwok.supabase.co/.well-known/oauth-authorization-server/auth/v1, read 2026-11-08] Whether Supabase reads the RFC 8707 `resource` parameter is [unknown]; its docs do not mention it.

**The repo already has the resource-server half for Supabase:**
- RFC 9728 metadata at `/.well-known/oauth-protected-resource[/mcp]`, 401 with `WWW-Authenticate: Bearer resource_metadata=..., scope="openid"`. [verified: src/plugin/http.ts:46,68-71,102]
- `jose` verification against Supabase JWKS with exact `aud === <origin>/mcp`, `iss`, `client_id`, ES256/RS256. [verified: src/plugin/auth.ts:25-37]
- An audience hook that maps each registered `client_id` to its exact `https://<origin>/mcp` resource. [verified: plugin-deploy/oauth-audience-hook.sql]
- A consent page that uses `authorization_id` and Supabase sign-in. [verified: src/plugin/consent.ts]
- The server refuses to start without the OAuth setup. [verified: tools/plugin-server.mjs:100-106]

**Decision.** Keep Supabase as the AS and **pre-register** one Muse client.
- Muse asks the developer for "OAuth client credentials" in the submission. [verified: https://platform.muse.ai/docs, section 5.4] That is pre-registration, which the spec allows, and which needs neither DCR nor CIMD. [verified: client-registration.md:128-145; inferred for the match]
- Running our own AS adds token storage, rotation, revocation and security review for no gain at this size. The SDK itself points new servers to a dedicated identity provider. [verified: SDK docs/serving/authorization.md; inferred]
- Gaps to handle: (a) no custom scopes, so Muse's "offer read-only account access" (section 3.1) needs a second, read-only client mapped in the hook, or a grant flag stored at consent and checked per tool. [verified gap; inferred fix] (b) No `iss` in the authorization response: allowed (SHOULD), and the repo's checklist already lists it as an open question for ChatGPT. [verified: docs/submission/checklist.md:154] (c) `plain` PKCE is advertised; the client must use S256 (Muse's choice is [unknown]).

## 6. Testing practice

- **In-process contract tests.** Drive the real `createMcpHandler` with a real `Client` through `handler.fetch`; assert on `structuredContent` and `isError`. [verified: SDK docs/testing.md] This replaces the repo's v1 `plugin:check:protocol` style. [verified: package.json:31; inferred]
- **MCP Inspector.** Latest `@modelcontextprotocol/inspector` 2.14.0 (2026-11-05). It has web, CLI and TUI clients, OAuth support and protocol-era handling. The CLI runs one `--method` per run, with exit codes and CI gates; `tools/list --strict` checks schema portability. [verified: https://registry.npmjs.org/@modelcontextprotocol/inspector; https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector/cli.md:9-59]
- **Conformance suite.** `npx @modelcontextprotocol/conformance server --url <url>`; latest 0.1.16, alpha 0.2.0-alpha.12. `--requirements 2026-07-28` runs the frozen set; scenarios that apply to both eras must run once per era. It has no authorization-server scenarios. [verified: https://raw.githubusercontent.com/modelcontextprotocol/conformance/main/README.md; requirements/2026-07-28.yaml] Most server scenarios (`tools-call-image`, `prompts-*`, `resources-*`) expect the suite's fixture tools, so for our app only `server-stateless`, `tools-list`, `dns-rebinding-protection` and the auth resource-server scenarios are useful. [inferred from the scenario names]
- **Muse review.** Meta runs risk assessment, tool review and end-to-end QA with a dedicated test account. [verified: https://platform.muse.ai/docs, sections 5.5, 6]

## Open questions

1. Which MCP era and which features (elicitation, `structuredContent`, MCP Apps, `resource_link`) does Muse's client use? [unknown] The Meta form also offers REST/OpenAPI onboarding, so MCP may not be the only path. [verified: https://dev.meta.ai/products/connectors]
2. Muse's OAuth redirect URI, PKCE method, and whether it sends `resource`. [unknown]
3. Muse rate limits and timeouts for a tool call. [unknown]

## Sources used

- MCP spec 2026-07-28: changelog, authorization, client-registration, streamable-http, tools, elicitation, MRTR, schema (modelcontextprotocol.io).
- MCP extensions: apps overview, client matrix (.mdx source), SEP-1865.
- TypeScript SDK main README and docs: serving/http, legacy-clients, authorization, testing (github.com/modelcontextprotocol/typescript-sdk).
- npm registry: sdk, server, client, node, ext-apps, inspector, conformance.
- Conformance README and requirements/2026-07-28.yaml.
- Vercel docs: functions limitations, fluid compute, usage and pricing, deploy MCP servers.
- Cloudflare docs: Workers limits and pricing; workers-oauth-provider README.
- Supabase docs: OAuth 2.1 server (overview, getting started, flows, token security, MCP auth); Edge Functions limits and pricing; live discovery document.
- Fly.io pricing.
- Muse developer guidelines (platform.muse.ai/docs); Meta AI Connectors page.
- Repo files: package.json, node_modules/@modelcontextprotocol/*, docs/HOSTING.md, plugin-deploy/oauth-audience-hook.sql, src/plugin/{auth,http,server,consent}.ts, tools/plugin-server*.mjs, docs/submission/checklist.md.
