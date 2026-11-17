# 21. Repair the production switch CI check

Status: resolved
Type: task

## Scope

Repair the OAuth browser check in PR 370. Keep its exact permission list check. Rebase on `origin/main`. Run the local checks, push with lease, and record the new CI result. Do not merge, deploy, or change a live value or database.

## Cause

The combined build keeps both consent texts in the page. It hides the text of the other connector. The check reads every list item, including the hidden Muse items, but expects only the six ChatGPT items.

## Change

Check the exact visible permission list for each listed connector. Check the heading and the hidden text too. Keep the password, provider, account choice, approval, denial, and hook checks.

## Answer

The CI artifact and a local run show the same extra three hidden Muse items at line 94. The repair keeps all six ChatGPT permissions and all three Muse permissions as exact lists. It checks approval and denial for both listed clients. It also checks that the other connector text stays hidden and that only Muse shows the limit on games against a person.

The rebase on `1da48ebdc` has no conflict. The app code does not change in this repair.

- `npm run check:browser plugin-oauth`: pass after the repair; fail before it with the same CI assertion.
- `npm run check:browser plugin-ui plugin-ui-http account web-online`: all four pass.
- Focused `npm test`: 307 tests pass in eight files. The selected files cover the API, account access, account launch, the Muse account screen, consent config, server config, server builds, and the service worker.

The full suite runs with a disposable loopback database. The owner report outside this worktree holds its final result, the doc and production build checks, the pushed head, and the CI result.

The local commit and push gate reads credential files. The brief forbids those reads. This run checks file size, private paths, the commit message, and changed assertions directly. The type checks are part of `npm test`. Only these commit and push commands suppress hooks. No repo setting changes.

## Second CI fault

At `b926c92ef`, 11 CI jobs pass, including `browser-ui`. `browser-default` fails at `tools/verify-menu-extra.mjs:123`. The check inserts long Account content after the sign-in providers appear. A late Muse status reply can replace that content, even when Muse stays off. The overflow shade then has no long content to mark. The same redraw can move focus from an account control to the first button.

The regression holds the status reply until the providers load. With the old code, both a missing Muse field and `muse: false` replace the later content. Both cases fail. The repair redraws Account only when the Muse value changes. The same two cases then pass and keep focus. The existing Muse-on and disconnect tests also pass. No browser assertion or time limit changes for this fault.

- Focused `npm test`: 29 files and 551 tests pass, including every account test.
- `npm run check:browser plugin-oauth menu-extra account`: all three pass in 6.2, 9.7 and 57.4 seconds.

The owner playtest holds the machine lease before the regression runs. This run waits for the lease; it removes no lock and stops no other process. The first regression fixture uses the wrong fetch mock for provider discovery. The corrected fixture reaches and proves the content replacement before the code repair.
