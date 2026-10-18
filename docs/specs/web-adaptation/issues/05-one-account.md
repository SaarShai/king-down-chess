# Prove one account across the web and ChatGPT

Type: research
Status: resolved
Blocked by: none
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:research

## Question

Does one person who signs in on kingdown.dev (Google or GitHub through the existing website sign-in) and who connects the ChatGPT app get the same service user ID, so that one account owns the games and results on both surfaces?

Also: how each surface's token reaches the server and is verified (can a website session call `/mcp`, or an MCP token call `/api`?); what Supabase Auth does when the same email arrives through two providers; how long a token stays valid after sign-out, a ban or a deletion request, and which server checks read the account status; what the website sign-in keeps across the provider redirect (path, query, hash), and what a return to `/j/<token>` or `/g/<id>` needs; which facts only a test account can prove.

## Evidence to start from

`src/account/account.ts`, `src/account/client.ts`, `src/api/http.ts` (`sessionVerifier`), `src/plugin/consent.html`, `src/plugin/consent.ts`, `src/plugin/auth.ts`, `src/plugin/http.ts`, `src/online/accounts.ts`, `src/online/safety.ts`, the deletion grace in the account migrations, `tools/plugin-oauth-check.mjs`, `docs/HOSTING.md`, the release packet. Supabase Auth documentation for identity linking. No credential file or live setting is read.

## Why it matters

[Choose sign-in and account continuity](10-account-entry.md) cannot pick a sign-in route until this is known. If the two surfaces make two users for one person, that ticket needs a specific account-link decision.

## Answer

Research: [research-identity.md](../../../research/web-adaptation-2026-10-18/research-identity.md) (reviewed: sound, with one correction).

- **One ID, on two conditions.** The account key on both surfaces is the Supabase user ID. The consent page checks that the authorization request names the same user as its browser session, and the MCP verifier returns that ID as the actor. One person gets one account only if both surfaces use the same Supabase project and the person signs in to the same user record. The code supports this; the live project match and the user match are **unverified** until a test-account check.
- **Two users for one person are possible.** Supabase links a new OAuth identity to an existing user only by a verified email. Different provider emails, or two identities that already belong to separate users, give two users. Manual linking adds an identity to a signed-in user; it does not merge two users and their games. The review account's password sign-in is a third, separate identity.
- **The tokens do not substitute.** A website token fails the MCP audience and client checks; an MCP token fails the API's audience and no-client rules.
- **Status checks differ.** The MCP verifier asks Supabase for the current user on each request, so a ban or a revoked session fails at once. The website verifier checks only the signature and the expiry (the "one hour at most" text is a comment, not a limit). No service has a common ban or pending-deletion gate.
- **Deletion grace.** Seven days; a new sign-in session on either surface cancels it. A deletion request signs out only the current session.
- **Return path.** The website sign-in keeps the origin and path and drops the query and hash. A return to `/j/<token>` or `/g/<id>` needs a served route, the PKCE exchange, the selected account and a fresh server read.
- **Live checks** (release packet, ticket 17): the project match, same-provider and two-provider IDs, token lifetime, sign-out, revoke, ban, deletion grace and the return routes, each with approved test accounts.
