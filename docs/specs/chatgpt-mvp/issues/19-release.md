# 19 · Release to the private testers

Status: needs-info
Type: HITL (every deploy needs the owner's word)
Size: M
Blocked by: 18

## Scope

- The owner checks two Supabase settings: sessions signed with an asymmetric key; a trigger allowed on `auth.sessions`.
- The branch's release order (`supabase/README.md`), with the new migration of ticket 06 and its grants.
- The move to `https://kingdown.dev/mcp` (multiplayer branch ticket 03 steps: OAuth client, redirect URLs, Vercel env, the publish path).
- Live checks with two test accounts on ChatGPT web and the iPhone app: each play mode, each toggle mix once, the side panel, the profile, the settings, the CSP for the art.
- A short tester guide.
