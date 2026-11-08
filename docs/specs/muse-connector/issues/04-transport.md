# Choose the transport and the SDK

Type: grilling
Status: resolved
Blocked by: 01, 02
Parent: [Muse connector map](../map.md)
Labels: wayfinder:grilling

## Question

How does Muse reach the connector, and on which protocol version and SDK?

## Answer

One remote MCP endpoint, decided 2026-11-08 under the owner's standing rule.

- `POST https://kingdown.dev/muse/mcp`, Streamable HTTP, stateless, JSON responses. Protected-resource metadata (RFC 9728) at `/.well-known/oauth-protected-resource/muse/mcp`.
- The v2 SDK's `createMcpHandler` with the default 2025-era stateless fallback: Muse's protocol era is unknown, and one handler serves both.
- It runs in the existing Node function of the `kingdown` Vercel project (`tools/plugin-server.mjs`), behind the build switch `MUSE_CONNECTOR`. A parked build answers 404 on the Muse paths.
- The plugin's guards stay: Host and Origin checks, a 128 KiB body cap, no batches, admission slots per instance and per user.
- Rejected: a REST/OpenAPI face (the Muse form takes MCP; add it only if Meta AI Connectors needs it); a separate host or platform; the v1 SDK (it cannot answer a 2026-07-28 client).
