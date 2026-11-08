# Research the Muse connector contract

Type: research
Status: resolved
Blocked by:
Parent: [Muse connector map](../map.md)
Labels: wayfinder:research

## Question

What must a Muse connector do on the wire, for sign-in, for tools, for display and for access?

## Answer

Report: [muse-platform-contract.md](../../../research/muse-connector-2026-11-08/muse-platform-contract.md). Resolved 2026-11-08.

- Muse and Meta AI are two assistants with two programs. This map targets the **Muse Connector Platform** (muse.ai/platform). Muse is not on glasses yet.
- The submission form takes "Raw API" or "Existing MCP" (a hosted MCP URL). The portal takes an MCP snapshot of the tool list with a test token.
- OAuth: a static client ID (public client with PKCE, or confidential), CIMD or DCR. Callback URLs: `https://muse.ai/api/hatch/oauth/callback` and `https://platform.muse.ai/oauth/credential-test/callback` (also `platform.museai.com`). Two test accounts with a username and a password must pass a sign-in test.
- Tools are Read, Write or Sensitive write; reads and writes ask on first use, sensitive writes every time. Descriptions must be factual.
- No public source says that Muse shows widgets, images or links from a connector. Plan for text.
- Unknown until a test: the MCP era Muse speaks, time and size limits, the minimum token lifetime, and whether an individual passes business verification.
