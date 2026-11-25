# Review rule for a new or renamed ChatGPT tool

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- docs/FORMS.md:35: a new or renamed ChatGPT tool goes live only after the OpenAI review; "Add no tool and rename no tool unless the run needs it".
- This is a process rule. No code check stops a pull request that adds or renames a plugin tool without a plan for the review.

## Change
Cheapest step: none in code. The guard-tools branch puts all plugin tool names in one file, src/plugin/tool-names.ts, and its comment names docs/FORMS.md. A change to that file in a pull request is now a visible signal. Optional: add src/plugin/tool-names.ts to the review checklist of the pull request template, with the line "A tool name change waits for the OpenAI review (docs/FORMS.md)".
Product change: none.

## Proof
A pull request that adds a plugin tool must change src/plugin/tool-names.ts, or typecheck fails at src/plugin/server.ts:66 (proved on the guard-tools branch).

## Known limits
- The signal works only if the reviewer reads the file list.
- The pull request template is under .github/, which the seam-ci lane owns.

## Work record
Not started.
