# Public Muse tool documentation

Type: task
Status: claimed

## Scope

The owner asks for a public tool reference at `/muse-connector.html`.
Use the Support page style and links. Generate the page and the private
reference from the same tool listing. Include connection, authorization,
tool fields, results, errors, limits, side effects and data deletion.

## Checks

The doc test compares both files with the generator. The worker test checks
that the page bypasses the worker. The production build check serves the
static page with GET and HEAD, with and without a query.

## Results

The generator writes both files from the MCP tool listing. The public page
uses the Support page head, style and links. Tables scroll inside the page
and keep tool names on one line. It adds no script or tracking.

- Focused doc and worker tests: 2 files and 144 tests pass.
- Doc lint: 19 files and 199 tests pass; one test skips.
- Full suite: both type checks, 392 files and 7,721 tests pass. One file
  and 17 tests skip. All 114 native tests pass.
- Production build and production route check: pass. The page serves as
  a static file with GET and HEAD, with and without a query. The worker
  does not cache it. The Muse server paths stay separate.
- Browser check `muse-docs`: pass at widths of 1440 and 390 pixels.
  The final renders show the page top, tables and deletion text.
- Design detector: no findings. The diff has no whitespace fault.

The first full run fails because the Playwright browser files are absent.
After a local browser install, the full suite passes. A later CSS change
keeps names on one line. The focused tests, doc lint, production checks and
browser check pass again after that change.

Only a new disposable loopback database runs for these checks. It is now
stopped. No dependency changes use the linked package folder.

## Next step

The normal commit and push hooks call the secret-file scan. This run forbids
both secret-file reads and hook bypasses. The request for an exception has
no answer. Thus no commit, push, draft pull request or CI run starts.

This branch does not merge, deploy, or change a live setting or database.
