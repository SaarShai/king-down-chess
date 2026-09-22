# M1: model comparison and work allocation

> **Delegation stopped by owner — 2026-09-22.** Workers and the task-owned API server are inactive; recurring supervision is paused. This document retains historical instructions/evidence, not authorization to restart. Current policy and future-use prompt guidance: [DELEGATION.md](../DELEGATION.md). Studies remain unfinished.

The owner requested a Gemma 31B trial and a shift toward work M1 performs reliably. The strongest evidence supports using the machine as a prescribed execution worker. Gemma did not improve correctness on the bounded coding task: Qwen passed all 12 independent checks; Gemma passed 9. This is a task-specific result, not a general model ranking.

## Measured execution work

With Ollama inference unloaded, M1 passed TypeScript and 43 targeted simulation/replay/identity tests. It then completed three eight-game jobs: two with one worker and one with two workers, using the same four explicit setups, seed, depth 1, four opening plies and a 40-ply limit. Game-job wall times were 0.764, 0.726 and 0.769 seconds (2.259 seconds total).

All 24 records had unique IDs within their job, the expected source identity, consistent source/spec/rule stamps, legal replays and matching event counts. Every timing-free field matched across both repeats and worker counts. All 30 audit checks passed. All 24 games reached the ply cap: these are execution-validation records, not full endings, balance evidence or evidence about enjoyment. This small fixed-depth check does not establish deeper-search throughput or the reliability of long campaigns.

Evidence: `m1-results/worker-validation-20260922/`. Source `3545663dcf97`; spec `7f0087356cbf`; common timing-free SHA-256 `12d32d45bc962947b512abd373d0f89f1562298f6b89322092f309581680b0c2`.

## Bounded coding comparison

Both models receive the same accepted f4482cb source baseline, identical paired-start/duplicate/sparse-pair assignment, 32k context, 4k output, temperature 0.2, 16 agent steps and a maximum of 15 minutes. One local model runs at a time. There is no supervisor corrective feedback within either measured round. Independent CLI tests and source review decide quality; fluent handoffs do not.

| Model | Observed work | Independent checks | Own tests | Outcome |
| --- | --- | --- | --- | --- |
| Qwen 3.8 27B MLX | Implementation and tests in 12m50s | 12/12; TypeScript and diff check pass | 5 pass, 9 fail | Correct functionality; test helper invokes the CLI incorrectly. Supervisor repair required. |
| Gemma 4 31B MLX | Implementation, tests and report in 14m41s | 9/12; TypeScript and diff check pass | 15 pass | Zero matched games incorrectly produce a zero effect estimate; one-pair uncertainty and per-game interval qualifications are missing. Own tests miss these requirements. |

The initial independent harness had ten checks. Manual review caught an insufficient zero-pair assertion and missing multi-pair interval qualification coverage. Two explicit checks for those pre-existing requirements were added and run against both unchanged candidates; original and expanded results are preserved. The one-pair case separately requires an explicit unavailable-interval label.

Qwen's full raw candidate, tests, logs and checks are preserved in `m1-results/model-comparison-qwen/`, and Gemma’s in `m1-results/model-comparison-gemma/`; no supervisor fix is included in either trial score. The constrained round was a considerable improvement over its earlier 23.5-minute read/compaction loop, but does not establish autonomous-research suitability.

## Division of work

- M1 executes frozen test commands, replay audits, checksums, simulator batches and numerical aggregation. Run IDs, source/spec identity, counts, time limits and expected outputs must be explicit. Start with at most two simulation workers and unload heavy model inference during game batches.
- Codex owns experiment design, engine fixes, source/spec review, stopping rules, interpretation and phase acceptance. Give M1 executable jobs with checkable outcomes, rather than broad research missions.
- A local model may help with a short isolated edit only when the task is fully specified, independently testable and time-bounded. Model selection remains limited by the observed trial, not a general ranking.
- Do not delegate rule adoption, enjoyment judgments, human feedback or unattended changes to the experiment design. Human sessions remain pending real participants.

The five original workstreams remain authorized. Their integrity, search and protocol gates still precede full batches. Four-minute supervision was subsequently paused when the owner stopped delegation.

## Accepted useful output

Retained Qwen’s paired-start implementation and repaired its comma-separated test invocation plus two comments. The corrected tests reproduce eight failures against the old implementation, then all 57 targeted tests pass. Independent checks pass 12/12 for pairing and 12/12 for the previously accepted statistics. Saved on M1 only as `c3393615a6eb11db21c6b7fd50e4eda471f300a2`; evidence in `m1-results/pair-starts-accepted/`. No gameplay defaults changed or main integration occurred.

Local inference is unloaded. No open-ended local-agent round is running. This was the provisional division of work before the owner stopped delegation. See the current checkpoint and DELEGATION.md; no worker or remote-job continuation is scheduled. Zero balance-study games are complete; the 24 retained validation games are explicitly separate.
