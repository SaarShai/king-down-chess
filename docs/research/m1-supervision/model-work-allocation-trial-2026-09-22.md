# M1 work-allocation trial — 2026-09-22

Owner asks to test Gemma 31B and focus outsourced work on what M1 does reliably. Preserve the five research workstreams; revise the division of labor from general local-agent autonomy toward measured reliability.

## Checkable plan

1. Finish or bound the current Qwen starts/duplicates task at 15 minutes from its 08:36:04 UTC start. Preserve candidate, logs and outcome; an interrupted partial result is not a completed failure/pass.
2. Test installed gemma4:31b-mlx on the same accepted f4482cb baseline, task prompt, 32k context/4k output, 16-step limit and file scope, one local model at a time. Bound its round to 15 minutes. Compare actual code, independent cases, tests, wall time and supervision needed. Preserve both candidates; no inference from fluent prose alone.
3. Run a prescribed deterministic worker check on M1 with model inference unloaded: TypeScript/targeted tests, then three short identical fixed-depth simulation jobs (two single-worker repeats and one two-worker repeat). Eight games per job, 40-ply ceiling, no early adjudication, explicit setups/seeds. Treat these 24 short records as execution validation, not rule-balance evidence or completed full-game studies. Retain every record, end reason and checksum. Timeout each job at 90 seconds; preserve a failed/stalled job and diagnose rather than retrying it blindly.
4. Verify unique counts, source/spec equality, replay legality and equality of timing-free outcomes between repeats/worker counts. If this passes, focus M1 on running frozen scripts, tests, simulations and numerical summaries. Codex owns research design, engine changes and acceptance. Local models may assist only with bounded tasks they demonstrate they can complete reliably.

## Acceptance

A coding model passes only with actual files, TypeScript/tests and independent duplicate/start/zero/one-pair checks. Script execution passes only with recorded exit codes, exactly 24 audited validation records, legal replay and identical deterministic outcomes. Small trials establish suitability for these bounded tasks, not general model superiority or stronger-play throughput. Do not start the full research game batches until integrity/search/protocol gates are met. Do not change gameplay defaults, integrate into main, fabricate human feedback, call cloud models or Jev, or disturb unrelated M1 jobs.

## Outcome

Completed. Qwen 12/12 independent behavior checks, Gemma 9/12; raw candidates preserved before any repair. Qwen’s CLI test helper was corrected by the supervisor, and paired-start code accepted as c339361 after 57 targeted tests and independent audits. M1 prescribed execution passed 30/30 audits across 24 short capped records. The owner’s requested focus is now prescribed execution, with Codex handling design, fixes and acceptance. Full report: ../m1-work-allocation-2026-09-22.md.
