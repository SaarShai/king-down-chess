# Research MCP standards and hosting

Type: research
Status: resolved
Blocked by:
Parent: [Muse connector map](../map.md)
Labels: wayfinder:research

## Question

Which MCP version, SDK, host and authorization server fit a small remote connector in this repo?

## Answer

Report: [mcp-standards-and-hosting.md](../../../research/muse-connector-2026-11-08/mcp-standards-and-hosting.md). Resolved 2026-11-08.

- MCP 2026-07-28 has no sessions and no handshake; cross-call state goes in tool arguments. The v1 SDK in the repo speaks only up to 2025-11-25; the v2 SDK (`@modelcontextprotocol/server` 2.4) serves both eras from one stateless handler.
- Vercel Functions in the existing `kingdown` project: same deploy path, Postgres access and domain; no new fee. Cloudflare Workers and Supabase Edge Functions add a platform, and Edge Functions allow only 2 s of CPU.
- Supabase's OAuth 2.1 server supports PKCE, public clients and refresh tokens, but no custom scopes, no CIMD and no DCR in our setup. A pre-registered client fits the portal's static-client route.
- No primary source lists Muse as an MCP Apps host.
