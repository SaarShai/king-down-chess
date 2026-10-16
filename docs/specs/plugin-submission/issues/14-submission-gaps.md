# 14 · Submission gaps: E5

Status: in-progress

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
- The tests wait for the shared test lock. The M1 browser checks are pending.
