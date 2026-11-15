# Launch platform

Status: ready-for-human

## Source

Launch decisions 13 to 15 define this stage. The parallel platform copy holds the work.
With the launch option on, web solo games run on the device.
The web API refuses solo creation, solo rematches and computer turns from web callers.
Released iOS apps keep their API. The off build keeps the old web flow.
The ChatGPT and Muse services keep their server games.

## Plan

- Isolate connector start faults from the website API and internal jobs.
- Refuse web solo creation and computer commands. Count web draft previews.
- Log the release. Add a daily fault summary command. Document uptime setup.
- Set no-cache for the runtime index and parts. Keep immutable frame caching.
- Correct the legal pages only for the launch changes. List each edit for counsel.
- Add KINGDOWN_SOLO_LAUNCH=1 as a build option. It is off by default.
- With the option on, serve the new page at /. Keep /play, /g/... and /j on the old page.
- Cover both public pages in the worker. Keep private routes outside the cache.
- Add the manifest, share metadata, browser support message, missing-page state,
  returning-player notice and old full-game link message.
- Prepare cutover and rollback steps. Do not deploy.

## Acceptance

Each new branch has a test. Full npm test, docs and build pass.
A browser checks the touched flows at 360x640, 390x844 and 1440x900.
The report gives logs, images, limits and exact shared-file merge hunks.

## Original build verification

The full npm test has 6,458 passes and 384 existing skips. All 114 Node checks pass.
The documentation check has 187 passes and one existing skip.
Both web build modes, 37 browser cases, the registered save check and 11 host probes pass.
The design-project report at parallel/platform/run/report.md holds the logs, images and merge hunks.

## Original build review

The owner asks for the build of the stated scope. This task authorizes the implementation.
No independent review or publication occurs. The next review uses the copy and its base.

## Repair verification

The two check reports identify eight faults. The repair closes all eight.
The repair section of the design-project report records the final checks.
The off artifact equals a fresh base build byte for byte.
The browser checks the old Computer flow in both modes with synthetic account responses.
It checks local handoff, the account control and offline recovery at all three sizes.
The worker never caches private pages or recovery responses.

## Repair review

Two independent check reports test the build. The repair verifies each reported fault.
The final report gives the evidence, corrections, limits and merge hunks. No publication occurs.
