# M1 and DeepSeek: measured capabilities and prompting

Current policy is in [AGENTS.md](../AGENTS.md#helpers-and-machines): helpers and workflows are allowed again (owner, 2026-10-06), and every simulation run needs the owner's recorded go ([AGENTS.md](../AGENTS.md#runs-and-compute)). Incomplete studies remain incomplete.

## What was worth outsourcing

| Target | Best supported use | Evidence and limits |
| --- | --- | --- |
| **M1 as a computer, without an LLM** | Execute an already specified test suite, frozen simulation batch, legal-replay audit, checksum comparison or numerical script. | Strongest demonstrated fit. 230 tests passed; a subsequent repair passed 74 targeted tests. Three tiny game batches produced 24 identical repeat/worker-count validation records and passed 30 audits. All 24 were capped at 40 plies: this proves repeatable execution, not long-game throughput or balance. |
| **DeepSeek V4.1 Flash through OpenCode API** | One small implementation with exact inputs, owned files, known behavior and independent acceptance checks; mechanical fixtures or setup/spec generation under a supplied design. | Provenance implementation accepted after supervisor correction: 14 independent checks, TypeScript and 74 M1 tests passed. Generated 96 setups with 98 passing static checks, but the surrounding experimental design needed corrections. Useful coding throughput did not remove review cost. |
| **M1 local Ollama model** | At most a short, fully specified, isolated edit where local inference itself matters. Prefer plain execution for routine compute. | Qwen 3.8 27B MLX was the better candidate on one matched task: 12/12 independent checks versus Gemma 4 31B MLX's 9/12. Qwen needed a test-helper repair; Gemma's own 15 passing tests missed defects. This is not a general model ranking. |
| **Main agent / owner / real players** | Experiment design, stopping rules, causal interpretation, accepting engine fixes, integration and rule decisions. Real players supply enjoyment/recall/rematch feedback. | These decisions required substantial supervisor work. Agent activity, test counts and mechanically legal setups did not establish sound studies or enjoyable rules. |

M1's finite-time search check returned legal moves in six cold/warm trials. It also exposed timer overshoot: a 5 ms request took about 27.6 ms in one trial. A budget request is not a strict wall-clock guarantee; a single-position check is not a campaign benchmark.

## What created overhead

- Broad local-agent research repeatedly became reading/compaction loops. One Muse round spent 33 minutes without edits; a Qwen pairing round made 29 tool reads/status calls over 23.5 minutes without edits. Large startup trackers consumed most of a 32k context. Higher context also increased memory pressure.
- DeepSeek's initial search change produced exactly the old result: 25,447 nodes, score −287, same move. All its new tests also passed the baseline. The useful outcome was a negative result, not an accepted fix.
- The protocol draft confused equal depth with equal practical cost, left depth-only searches with infinite time allowances, double-counted head-to-head games in its budget, and needed censoring/inference corrections. Static validation did not catch design errors.
- A 40-step agent limit repeatedly ended rounds before cleanup and final verification. Continuation and correction turns added coordination cost. A smaller assignment is preferable to an open-ended retry loop.
- The head-to-head analysis implementation was interrupted before acceptance. The revised protocol and latest search edits are also unreviewed. Do not cite their claims as verified findings.

Only consider future delegation when the task is independent, its input/output contract is already settled, and checking it is materially cheaper than completing it directly. Otherwise keep the work in the main agent. The owner's current prohibition takes precedence over this suitability test.

## Prompt M1 with an execution manifest

Use a reviewed script/command, not a request to decide what to research. Verify the machine using [LOCAL-AI-MACBOOK.md](LOCAL-AI-MACBOOK.md) before changes. Freeze source and specification before a run; inspect existing processes before launching a writer. Start with at most two simulator workers, keep heavy inference unloaded, and leave unrelated jobs alone.

```text
Goal: execute this one reviewed job; no implementation or design decisions.
Workspace: <absolute isolated path>
Required source commit and source identity: <commit>, <sourceId>
Job/run ID: <unique ID>; specification: <path and checksum>
Exact command: <reviewed command with finite limits>
Budget: <workers, expected records, per-search/job timeout, output limit>
Outputs: <records, durable stdout/stderr, status, PID, checksums>
Acceptance: <expected counts and independent audit command/results>

Before starting, verify identity/source/spec and absence of another writer.
Execute once. Keep every record, cap, failure and missing case visible.
On timeout or mismatch, preserve seed/state/logs and stop; do not retry,
replace a game, change settings, or choose a new task.
Return exit status, observed counts, hashes and artifact paths. Completion
requires the artifacts and checks, not a live process or a success sentence.
```

Keep validation games separate from rule-study games. Count every physical head-to-head game once, even though both evaluators participate. Report capped games separately from endings. Use an external job timeout as well as explicit search limits, with preserved failure state.

## Prompt DeepSeek with one acceptance contract

The tested configured ID was `opencode-go/deepseek-v4.1-flash`. Verify availability and actual assistant message provider/model before attributing output to it. Use a fresh child session and isolated worktree per independent writer; never silently substitute another model. Pass the directory explicitly in API calls (or `--dir` for CLI launches); cwd alone previously resolved to the wrong directory.

```text
Deliverable: <one concrete artifact or small repair>.
Baseline/workspace: <commit and absolute path>.
Read first: <exact files/sections; concise context and settled decisions>.
Own only: <source, test and brief report paths>.
Other agents may own other work: preserve their changes and your boundaries.

Required behavior: <enumerated observable conditions and edge cases>.
Use existing interfaces: <specific functions/types>.
Acceptance: <fixtures with expected answers; commands; old/new evidence>.
For a bug fix, reproduce a meaningful failure on the old implementation,
then make that test pass. A test passing both versions proves no repair.

Budget: <bounded tool/time allowance, including cleanup and verification>.
Produce an artifact before broadening discovery. If blocked, save the exact
failure and partial diff, then return; do not invent a larger assignment.
Run the specified checks, inspect the final diff, and commit only owned files.
Return commit, changed behavior, exact results, limitations and artifact paths.
This is a review request. Adoption, integration and further work belong to
the supervisor; no simulations, training, external calls or new agents unless
this assignment explicitly authorizes them.
```

If the first result needs correction, send one short delta: failed requirement, reproducer/expected result, owned scope and finish criteria. Avoid re-sending the whole campaign. Reassess whether direct completion is cheaper before any further retry. A pure diagnosis task should end with a reproducible diagnosis; a protocol task should receive settled design constraints rather than decide them implicitly.

## If a local model is explicitly required

The matched Qwen/Gemma trial used a fresh round, identical prompt/baseline, 32k context, 4k output, temperature 0.2, 16 agent steps and a 15-minute limit, with one model active. Qwen took 12m50s; Gemma took 14m41s. Treat these as observed trial settings, not universal optimal values.

Use the same narrow implementation template, plus exact read paths and compact task-specific startup documents in the isolated copy. Preserve original documents with hashes; leave the owner's checkout intact. Require one source/test deliverable and exact fixtures. Stop on repeated read/compaction loops, memory pressure or a failed bounded round. A broader prompt, more context or another model is not automatic recovery. No keys were copied to M1 and no Jev calls were authorized.

## Review before accepting

Inspect the actual diff and invoke independent checks derived from the requirement. Verify fixture coherence, empty/sparse inputs, invalid identity, old-version failure and output labels. For a study, separately verify full starts, colour/seed mapping, frozen source/rules/spec/evaluator, actual search cost, physical counts, cap/missing-case treatment and the statistical unit. Distinguish a completed command, passing self-written tests, supervisor acceptance and actual study evidence.

The direct follow-up found that the proposed linear/residual comparison used different material-value snapshots despite passing 171 setup/model checks. Prompt for a field-by-field comparison of every evaluator parameter except the intended treatment, and verify it independently. A model label, valid network blob and source hash are insufficient. Substitution studies also need every comparator army checked against the current pool limits; track the designated replacement piece separately from other pieces of its type.

Keep reports short: what changed, measured results, limitations and paths. Avoid building another monitoring system to save a small amount of implementation work.

## Preserved state and evidence

- [Model/execution comparison](research/m1-work-allocation-2026-09-22.md): raw Qwen/Gemma scores and deterministic-worker evidence.
- [Accepted DeepSeek provenance](research/m1-results/provenance-accepted/provenance-report.md): M1 commit `2109d67f6daebc2e7ebc543bd7778964b51f337f`; isolated local integration `ffd78f0`. Gameplay source identity remained `3545663dcf97`.
- [Supervisor rejection/corrections](research/m1-results/deepseek-review-20260922T0945/supervisor-review.json): original search/protocol defects, not acceptance of later revisions.
- [Stop manifest](research/m1-results/delegation-stop-20260922/manifest.json): session IDs, final heads, abort/idle evidence and retained untracked files. Adjacent patches and archives preserve unfinished work.
- [Campaign checkpoint](research/m1-supervision-checkpoint.json): latest status. At delegation shutdown there were zero balance-study games and 24 capped validation records. The [direct continuation](research/direct-campaign-2026-09-22.md) subsequently verified 13,400 study records and closed at the owner’s request, leaving Guard/arrangement studies unrun; delegation remains stopped and human participation remains pending.

The task-local API server and worktrees are retained under `/Users/za/.local/share/king-down-supervised-20260922`; the server is stopped. The [API handoff](research/m1-supervision/deepseek-api-handoff.md) is an archived technical reference, not a restart instruction. Source changes accepted on M1 have not been integrated into the owner's main checkout. Preserve unrelated graphics work.
