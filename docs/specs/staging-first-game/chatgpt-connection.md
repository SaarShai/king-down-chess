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

Website sign-in and ChatGPT OAuth complete. The public provider settings report GitHub enabled and Google disabled. Source `25978776` uses those settings for the website and connection sign-in choices; it offers GitHub only in staging. Failed settings show retry and keep the approved review password path. Signed-in consent does not request settings. [Ticket 46](issues/46-available-sign-in.md) records compiled OAuth and fresh anonymous hosted checks; it does not repeat real provider login or close the second-account gate.

The owner saved the credential for the [King Down Staging GitHub app](https://github.com/settings/applications/3948844) directly in the [staging Supabase provider form](https://supabase.com/dashboard/project/puhspsyjyzaghmgtkzqd/auth/providers). Do not put that secret in chat, source files or evidence.

## Verified scope

The earlier game-owned mechanics checkpoint is source `be0786da`, preview `dpl_Tx6SkvtZnmT7R15NumP1Srp8owM6`. Its [game-owned mechanics proof](../game-ownership/owned-staging-proof.md) records March, Maester swap and Morph across both interfaces. Three later fresh native opens pass; an earlier `Internal error` is recorded at that checkpoint. Ticket 47 later captures the failing settings call and repairs serverless pooling. The records below describe the preceding product and startup diagnosis.

The real ChatGPT widget and staging website share game `1e34ff0e-5f7b-84f0-8cc6-22268129d986`. A move on each surface appears in the other's history after reload. Resignation in ChatGPT appears as the same final result on the website. See [the real-host record](issues/09-real-host-proof.md).

The built local browser check separately covers a friend game, hidden setup, a complex turn and an injected lost reply with an identical retry and one effect. It uses the real HTTP/MCP handlers and a disposable database.

Five fresh widget mounts through **Plugins → King Down Staging → Open plugin** in a control tab and four native direct-URL opens pass without **Try again**. A saved game resumes with the same history on the website and widget.

The follow-up proves debugger-associated interference: attaching browser control stalls navigation; canceling that debugger releases the same pending load in two tabs. Five distinct native first opens pass without retry or debugger attachment before readiness, including plugin-page entry. One is the earlier control later reused for the attachment test. The actual saved board resumes with the two expected moves. See [the first-load record](issues/10-first-chatgpt-load.md).

## First-load verification

For browser-controlled checks, keep navigation and the full readiness wait in one `cua_repl` call. Wait for the outer staging frame, then its nested game and enabled controls. Do not return at the first Loading app snapshot. The [controller diagnosis and tested procedure](browser-controller-startup.md) records the response that gets stranded when the browser call ends early. Ten fresh controlled opens pass on unchanged product `fd853122`, without Try again or navigation retries.

For an independent native control, open a new tab through native Chrome controls and keep the browser-control debugger disconnected until readiness. Use the direct staging app URL or **Plugins → King Down Staging → Open plugin**. Browser inspection can attach afterward.

Both paths require enabled controls and a new initialization ID. Record visible notices as well: a loaded game with `Internal error` is not a clean app pass. Do not count Try again, a navigation retry or a model summary as first-load proof. Close test tabs afterward.

This corrects test interference. The vendor controller's idle response-release defect remains; no installed code or security policy changes. The separate post-mount settings error is repaired by source `64205cdf` on preview `dpl_4oJy4wGygNEaEkDEYk86UGNCodxT`: transaction pooling and idle cleanup prevent the captured session-pool exhaustion. Ten fresh opens and later notice checks pass without Internal error or Try again. Both hosts retain the saved feature history. See ticket 47 for the source, artifact and hosted receipts. Cold-cache, mobile and cross-browser claims remain unverified.
