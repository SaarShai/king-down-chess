# Merge results and route storage
Status: claimed
Type: task

Plan: inventory local worktrees and verified M1; merge local and Drive collections onto the card with a source manifest; route tools through shared result-root configuration; collect M1 spools; copy compressed snapshots to Google Drive and verify cloud hashes; install daily maintenance. Preserve all unique content and existing sources.
Checks: collision and compression tests; missing-card failure; no writes to remote source collections; cloud hash check; npm test; independent review.

Independent review: Standards found misplaced CLI hashbang, absolute-path guard IDs, and missing M1 sparse dependency; Spec also found Q6 default reads still using the old root. Fixed all four. Conflicting historical versions remain archived and are excluded from automatic statistical samples until provenance is reviewed. Recovery-card results were compared to main: no missing/different files. M1 deep inventory found the same 13 sources.

Corrections re-reviewed independently on both axes: no remaining should-fix findings. Full npm test passes (typecheck, Vitest and Node document tests); all 19 changed tool/src TypeScript files also parsed with esbuild because tools are outside tsconfig. Shell syntax and git diff whitespace checks pass.
