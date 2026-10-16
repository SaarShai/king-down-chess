# 14 · Submission gaps: E5

Status: needs-triage

## Scope

Build E5 from ticket 14. Serve a committed token file at
`/.well-known/openai-apps-challenge`. Do not build F8 or B4.
The owner approves this scope on 2026-10-16: "Yes, the cut".

## Plan and checks

1. Keep the file in the site build. Add its plain-text header to the site routes.
2. Check status 200, no redirect, `text/plain`, and the exact file bytes.
   Skip the check when the file is absent.
3. Add tests with temporary files. Add the owner step to checklist row 52.
4. Run `npx tsc --noEmit`, `npm test`, and the local Vercel check.
   Run `plugin-ui` and `plugin-ui-http` on the M1. Keep all time limits.
5. Check the diff and commit on `claude/sub-e5`.

## Progress

- The Vite build copies the public folder with `cpSync`, which keeps dot folders.
- `vercel.json` has no headers or rewrites. The server build writes the site routes.
- This branch has no submission checklist. Use the packet branch's checklist as
  the source. Change row 52 only.
- The M1 identity check passes.

## Checks

- `npx tsc --noEmit`: pass.
- The local Vercel build and check pass without a token file.
- A second Vercel build and check pass with a temporary token file. The static
  file has the same bytes. Its one matching route adds `text/plain` and has no
  destination or redirect. `vercel.json` stays empty.
- `npm test`: pass. 164 files; 2,535 tests pass; 8 tests skip. All 50 artwork
  checks pass. The 14 new E5 tests pass. No time limit changes.
- The M1 has code commit `715571991fc3184f22c9fdf723eafd2d4b85436d`.
  `plugin-ui` passes in 98.4 s. Its run folder is `kd-sub-e5-mMYM8P`.
- The first `plugin-ui-http` check fails at the settings remount assertion in
  `tools/plugin-ui-check.mjs:848` after 80.1 s (`kd-sub-e5-KcoFEB`). The check
  does not wait for the settings write before it remounts. Its code and the
  settings code match the parent commit. The page still shows `Connecting…`
  when the assertion runs. This can be a timing fault; E5 does not change this
  code. The check remains failed.
- Extra HTTP retry: canceled before launch after over an hour in the M1
  queue. At cancellation, it has one sleep child, no browser child, and no
  lock. The settings screen and its check stay outside this E5 build.
- E5 is built and its checks pass. The full browser gate is not clear because
  the HTTP settings assertion fails. Keep this ticket open for that result.
- Local test log: `/tmp/kd-sub-e5-tests.log`. Local Vercel logs:
  `/tmp/kd-sub-e5-vercel.log` (absent file passes; a later temporary runner
  inherits production mode from Vite) and `/tmp/kd-sub-e5-vercel-present.log`
  (present file passes in a fresh test process).
- M1 check logs: `/tmp/kd-sub-e5-plugin-ui.log` and
  `/tmp/kd-sub-e5-plugin-ui-http.log`.

## Choices and limits

- No taste choice is needed. The route and the owner step come from the ticket.
- F8 and B4 stay outside this build, as the owner directs.
- No token or placeholder token is committed. The owner must add the token and
  deploy before the portal can check the live domain.
