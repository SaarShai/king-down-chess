# Establish the code baseline and check the earlier answer

Type: research
Status: resolved
Blocked by: none
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:research

## Question

What work exists at the named commits, and which claims in the earlier answer need correction?

## Evidence

- Main: `38a6bbffb3b85f10bb9e6d23e8e1f394b781b4f4`.
- Release candidate: `682e58bd47e38aa1e571deb17afb64f3183149a1`.
- The two-tip diff has 567 paths. The release branch is 968 commits ahead.
- The earlier answer is at transcript line 28059, timestamp `2026-10-18T05:11:09.020Z`.
- [The inventory](../inventory.md) records the file evidence and the limits.

## Answer

Most engine, art, and service work is reusable. The web already has sign-in, cloud saves, local turns, lessons, and a painted board. The release does not wire the web API into its server or deploy routes. The web client also lacks calls for several new services.

The plugin screens import their app globals. Device fixes often live in those screens or plugin CSS. They need a shared client boundary and a browser fit check.

The inventory has 79 work units: 17 a, 34 b, 18 c, and 10 d. These are work-unit counts, not an effort estimate. A common backend row does not imply that a web feature appears on merge.

## Base correction

**Base correction (2026-10-18).** The plan's agents read local `main` at `38a6bbff` (2026-10-12), which is 470 commits behind `origin/main` at `04b7af87` (2026-10-17). `origin/main` already holds the ChatGPT MVP merge (PR 55) and PRs 57–60. The release candidate (`442c5eb3`) contains `origin/main` and is 499 commits and 223 paths ahead of it. The web files that the plan depends on (`public/sw.js`, `src/main.ts`, `src/entry.ts`, `src/new-game.ts`, `src/screen/play.ts`, `src/screen/links.ts`) are the same at both commits; on `origin/main` only the deletion text (the seven-day grace) and a precache filter for `.well-known/` changed. All `R:` claims hold, because the release candidate contains `origin/main`. Rows A01, A07, A08, A11, A13 and B34 are already on `origin/main` with no further PR 61 change; the other a and b rows get their last part with the merge. Whether a row is already live depends on the deployed commit, which [ticket 08](08-release-evidence.md) records.

## Late source delta

The release branch advances to `442c5eb3` during this review. Its one commit keeps the Join return when a name screen queues during an inline collapse. The change and regression test fit the existing identity, queue, and host rows. The inventory count stays at 79. The web route test carries the same return-intent rule. No new test pass is claimed.

## Verification

This is a source review. The review checks both entry points, changed source areas, service contracts, browser checks, release records, and relevant memory. It does not run the code. The main checkout has unrelated local edits. No edit in the repo is part of this task.
