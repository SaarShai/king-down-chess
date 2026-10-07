# 02: Workshop checks on the shared check module

**What to build:** The two Workshop browser checks, `workshop` and `workshop-cast`, become readable code on the shared check module of the checks-and-hooks spec. They run under the browser-check runner on any channel and any server, and change no tracked file. Each check gets its server, channel and output folder from the module, traps page and console errors, fails on an error it does not allow, and writes its screenshots through the module into the runner's untracked folder. The cast check compares image paths with `imageIs`, so it passes on the dev server and the preview server. Neither check holds a literal cast size: the count comes from the cast list. Each check keeps every assertion it has today, written one step to a line in named groups.

**Blocked by:** checks-and-hooks/05 (shared check module: `env`, `launch`, `trapErrors`, `assertNoErrors`, `shot`, `imageIs`); checks-and-hooks/06 (browser-check runner with `workshop` and `workshop-cast` in its registry)

**Status:** ready-for-agent

- [ ] Both checks use `env`, `launch`, `trapErrors`, `assertNoErrors` and `shot`; the cast check uses `imageIs`. The check lint of checks-and-hooks passes for both.
- [ ] Neither check holds a port, a channel, a temp path or the number 34.
- [ ] Each assertion of today's two checks is still present (a before and after list in the ticket's Comments shows it); the commit needs no `Removed-check:` trailer.
- [ ] `npm run check:browser workshop workshop-cast` passes, and the runner reports no changed tracked file.
- [ ] The same run passes with `PLAYABLE_BROWSER=chromium`.
- [ ] The cast check passes against the dev server (`PLAYABLE_URL` set to it).

**Verify:** `npm test`; `npm run check:browser workshop workshop-cast`; `PLAYABLE_BROWSER=chromium npm run check:browser workshop workshop-cast`

**Owns:** tools/verify-workshop.mjs, tools/verify-workshop-cast.mjs
