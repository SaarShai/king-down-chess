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

ChatGPT discovers the OAuth endpoints and redirects the separate connection to the staging consent page. Sign-in is not complete. The public provider settings still report GitHub and Google as disabled.

The [King Down Staging GitHub app](https://github.com/settings/applications/3948844) exists. Its public client ID is already in the [staging Supabase provider form](https://supabase.com/dashboard/project/puhspsyjyzaghmgtkzqd/auth/providers). The owner must generate the new client secret, put it directly in that provider form, enable GitHub and save. Browser-control policy requires the owner to enter and submit a new authentication credential. Do not put that secret in chat, source files or evidence.

## Proof still required

The local browser check uses the built page, real HTTP and MCP handlers, and a disposable local database. It does not prove that ChatGPT can load the widget, finish OAuth or continue the game in its own host.

Before marking the staging game complete:

1. Enable a staging social sign-in provider and finish sign-in on the website.
2. Connect King Down Staging in ChatGPT and finish its OAuth consent.
3. Create a friend game on the website, open that same game in ChatGPT, and verify the board and hidden setup there.
4. Complete a move and retry, then verify the same result on both surfaces.
5. Record the deployment, source commit and evidence in `plan.md`.
