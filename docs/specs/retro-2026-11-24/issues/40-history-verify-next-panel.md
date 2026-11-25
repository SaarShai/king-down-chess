# Register or remove the browser check tools/verify-next-panel.mjs

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- tools/verify-next-panel.mjs:1 is a browser check (the S1 panel proof). No entry in tools/lib/registry.mjs names it, and it never had one (git log -S finds no registry change). Nothing runs it.
- tools/registry-ci.test.ts:22 holds it on the exempt list, so that the new orphan guard is green on the real tree.
- tools/verify-*.mjs is a protected file set (lane seam-ci). This lane cannot remove or change the script.

## Change
Do one of these two steps, and decide in the PR:
1. Add a byName entry to tools/lib/registry.mjs: name 'next-panel', script 'tools/verify-next-panel.mjs', a limit, channel 'chromium', and the flags that its PLAYABLE_URL and PLAYABLE_OUT need. Run it once with npm run check:browser next-panel.
2. Or remove the script, if a newer check covers the S1 panel.
Then remove 'verify-next-panel.mjs' from the exempt list in tools/registry-ci.test.ts.

## Test that fails first
tools/registry-ci.test.ts 'gives each tools/verify-*.mjs browser check a registry entry'. After the entry or the removal, the stale-exempt assertion is red with: tools/registry-ci.test.ts: remove "verify-next-panel.mjs" from the exempt list; it is gone or registered. Remove the line, and the test is green.

## Known limits
- The orphan guard reads only tools/. 8 of the 18 docs/**/verify*.mjs files have no registry entry today. Many are one-time preview proofs. A guard for docs/ needs a decision about which of them are checks.
- Nobody ran the script in this lane (no browser check here). Its flags are not known.

## Work record
Not started.
