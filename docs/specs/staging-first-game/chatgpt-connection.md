# Staging ChatGPT connection

Use a separate development connection called **King Down Staging**. Do not change the live King Down connection or use the production submission package.

| Setting | Staging value |
| --- | --- |
| Website | `https://kingdown-staging.vercel.app/play/` |
| MCP server | `https://kingdown-staging.vercel.app/mcp` |
| Authentication | OAuth |
| Client ID | `001472fe-cd83-4a73-b0e5-87edc54b0713` |
| Client secret | None: public client with PKCE |
| Auth issuer | `https://puhspsyjyzaghmgtkzqd.supabase.co/auth/v1` |
| Registered callback | `https://chatgpt.com/connector/oauth/88HoxvK4IWq2` |

These are public connection settings. Verify the callback shown by ChatGPT when creating the connection. If it differs, register that exact URL in the staging OAuth app before connecting.

The staging account database is separate. A player's Google or GitHub identity can be the same, but staging games and profiles stay in staging. Both website and ChatGPT must sign in to the same staging identity to continue the same game.

## Current connection

Website sign-in and ChatGPT OAuth complete. The public provider settings report GitHub enabled and Google disabled.

The owner saved the credential for the [King Down Staging GitHub app](https://github.com/settings/applications/3948844) directly in the [staging Supabase provider form](https://supabase.com/dashboard/project/puhspsyjyzaghmgtkzqd/auth/providers). Do not put that secret in chat, source files or evidence.

## Verified scope

The real ChatGPT widget and staging website share game `1e34ff0e-5f7b-84f0-8cc6-22268129d986`. A move on each surface appears in the other's history after reload. Resignation in ChatGPT appears as the same final result on the website. See [the real-host record](issues/09-real-host-proof.md).

The built local browser check separately covers a friend game, hidden setup, a complex turn and an injected lost reply with an identical retry and one effect. It uses the real HTTP/MCP handlers and a disposable database.

Fresh standalone ChatGPT page loads can show `Couldn’t display King Down Staging`. **Try again** loads the working game. A temporary trace observes no game HTML-entry marker on the failing load, then every startup marker on retry. The underlying cause remains unconfirmed. This does not invalidate the observed game round trip or establish production readiness.
