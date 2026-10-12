# Rules stress and longer thinking time

Status: claimed
Type: task

Owner approval (2026-10-12): "go ahead with the two-hour M1 stress test, then choose and run the longer-time Kaggle comparison based on the current results. only check at expected completion times, and don't merge yet."

Plan: run four disjoint seeded rules-check streams on M1 for two hours. Compare all legal atomic effects, attacks, state, history draws and sampled complete turns. Mix the directed corpus with fresh armies, kings, cards, piles, copies and delays. Check native keys, make/undo and transposition storage through the existing native inspection commands. Save the exact state, rules and trace before each check. Stop and preserve evidence on a mismatch. This is a test budget, not a fixed game sample or a strength estimate.

Checks: positive and altered-output controls; short native smoke; full project tests; pinned project and native source hashes; remote identity, AC power and idle check; hard two-hour process-group limit with a graceful stop margin. Collect outputs and verify their manifests. Report counts, coverage and failures. No claim that random testing proves all rules correct.

Keep the frozen 192-game 80 ms match unchanged. Collect and check it at its expected finish. Choose the next paired Kaggle comparison from its score, group results, caps and actual latency. Freeze the decision, starts, rules, timing and disjoint part schedule before launch. Check a timing pilot before the later parts. Use at most five account-wide notebooks. Check only at expected finish times. Back up raw data, sources and reports. Do not merge, train, deploy or change rules or shipped AI.

## Progress

The 80 ms match has launched all games. The M1 stress run and longer-time comparison are not yet launched.

M1 stress starts at 00:57:07 Pacific on October 12 from pushed `445e3cc0`. All 424 pinned project/archive/binary hashes and 75 native input hashes pass. The dedicated remote dependency install and short native preflight pass. Startup confirms all four seeds. Each worker has 7,120 seconds; the process-group deadline is 7,200 seconds. The expected finish is 02:57; collection is scheduled for 03:05 with delivery margin. Do not poll early. The result remains pending.

The checked 80 ms match has 192 games, 27,976 actions, 28,168 state/legal-set checks and no caps or illegal traces. Current AI wins 112; native wins 66; 14 are draws. Native score is 38.02%, with a 24-army block interval of 28.18% to 47.86%. Card score is 30.21%; the group intervals are descriptive. All seven independent raw-outcome summaries agree. Actual native mean time is 215.5 ms, p99 is 2,983.5 ms and maximum is 15,692.5 ms. Current mean is 72.7 ms. Equal requested time does not give equal actual time.

Choose 1,000 ms instead of 250 ms for the next comparison. Keep all four profiles, 24 fresh armies, 192 paired games, seed 164211 and the same explicit 28-card pool. This tests a useful larger search budget and fresh-army performance. It is an exploratory follow-up; do not pool prior games or claim a paired causal time effect. Report actual latency and overruns. The pilot has eight games, both colours in all four groups; later parts have 38, 38, 36, 36 and 36 games. Freeze the spec and source before launch. The decision and its source report hashes are on the card in `fairy-stockfish-long-20261012/decision.json`.
