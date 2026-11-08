# Choose the account link

Type: grilling
Status: resolved
Blocked by: 01, 02
Parent: [Muse connector map](../map.md)
Labels: wayfinder:grilling

## Question

How does a Muse user link a kingdown.dev account, and how does the server know who calls?

## Answer

Supabase's OAuth 2.1 server, as the parked ChatGPT app used it. Decided 2026-11-08.

- One pre-registered **public** client for Muse: authorization code with PKCE S256, token endpoint auth `none`, refresh tokens. Redirect URIs: `https://muse.ai/api/hatch/oauth/callback`, `https://platform.muse.ai/oauth/credential-test/callback`, `https://platform.museai.com/oauth/credential-test/callback`. In the portal: the static client ID route.
- The access-token hook sets `aud` to `https://kingdown.dev/muse/mcp` for that client (a `kingdown_oauth.client_resources` row; the hook's path check must accept `/muse/mcp`). `src/plugin/auth.ts` checks the issuer, the exact audience, the client ID allow list and the live session.
- The consent page (`/authorize`) is shared: Supabase has one authorization path for each project.
- The actor is the token's `sub`, never a tool argument.
- Open: the read-only option ([ticket 13](13-read-only.md)) and the review accounts ([ticket 15](15-review-accounts.md)).
