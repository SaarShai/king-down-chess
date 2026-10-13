# Source review for the designer test framework

Reviewed on 2026-10-12 Pacific. Code baseline:
`ab6e751a10f0cc2198363a68e37f4604850eafc7` from `origin/main`.
Session claims below are checked against code, tickets or saved reports where
stated. Historical test counts are records of those sessions, not new tests here.

## The three chats

| Source | Useful work | Limit or correction |
|---|---|---|
| [balance](codex://threads/01a12161-fb3f-7dc2-aece-f0ad7071ad24) | Balance catalog, evidence checks, campaign work, four-cell combination tests, and a proposed general rules studio | The studio was a proposal and HTML concepts. Later game work supersedes its claim that custom pieces cannot play games |
| [balance (2)](codex://threads/01a12e2a-26f4-7f12-8af3-7c9803ce0f91) | Fresh combination studies, deeper balance rounds and tests of another computer player | Engine legality, competence, speed, policy and game balance need separate checks. No study proves human fun |
| [Codex rules framework visualization review](https://claude.ai/epitaxy/local_a00d8966-1e03-47c3-a709-1fb227252ed7) | Review, approved Proving Ground design, shared legend, custom-piece engine and full-game work | Its early critique is partly resolved by its own later builds. Use the final code and tickets, not only the first critique |

The Claude review is read in the desktop app and its matching local transcript.
Its durable design record is
[rules UI review](../../research/rules-ui-2026-10-10/REVIEW.md). It identifies the
main risk: adding a fifth rule language instead of making one playable rule
system. The owner selects the Proving Ground, three rules per piece, and the
game's move legend with red targets. The later
[Proving Ground spec](../workshop-proving-ground/spec.md) and tickets record the
build and fixes. These choices govern the proposed interface.

## What is already available

- Main contains the early balance framework from PR #30. Its generated
  [report](../../balance/FRAMEWORK.md) describes an older evidence snapshot.
  It is not the complete record of later campaign work.
- Main contains the shared `genDesigned` interpreter and custom-piece full games.
  See [ticket 16](../workshop-proving-ground/issues/16-engine-designed-piece.md)
  and [ticket 17](../workshop-proving-ground/issues/17-play-a-design.md).
- Main's `src/rules/design.ts` supplies `DesignSpec`, `holds`, `patternOf`,
  `shelterOf` and `genDesigned`. Workshop `movesOf` calls it. One design uses `T`.
- `src/workshop/why.ts` supplies influence traces by removing rules and rule pairs.
  These are not full engine event or legal-refusal traces.
- `src/sim/replay.ts` restores records, but an ordinary LAN round trip alone is
  not a legal-action check. `tools/piece-activity.ts` shows the direct legality
  check that scenario validation also needs.
- `src/balance/schema.ts` defines catalog dimensions, not executable rules.
  `src/balance/measurements.ts` supplies context and validity fields.

## Useful work still outside this base

At review, `.claude/worktrees/balance-framework` is on `codex/combination-tests`
at `b0f2a45f`, with more uncommitted tickets, reports and design drafts. The
published combination history reaches `e96419fc` in `codex/combination-publish`.
The following commits are not ancestors of the framework branch base:

| Commit | Work to review and reuse |
|---|---|
| `a4ae81c2` | Balance review repairs and frozen campaign imports |
| `b0f2a45f` | Combination runner, numeric policy presets, action traces and piece identities |
| `3dd0933b` | Fresh confirmation setup |
| `d55a8d2f` | Beast + Flight precision study |
| `e96419fc` | Mimic + SkyLift precision study |

Key files on that workstream are `src/balance/campaign.ts`,
`src/sim/combinations.ts`, `combination-run.ts`, `action-trace.ts` and
`piece-identities.ts`. Import reviewed changes by responsibility against current
main. Preserve their frozen historical contexts. Do not replace current rule or
Workshop code with the older branch versions.

The uncommitted `docs/specs/rules-playground/spec.md` there contains useful
version, condition, scenario and evidence concepts. Its separate-interpreter and
no-full-games gaps are stale. The framework replaces those assumptions with the
current support table. It does not amend that other chat's draft.

## Findings that shape the tests

The 33,280-game target campaign contains worth, activity, power and card/control
studies. Its four-card arm reduces draws from 21.17% to 11.87%, a difference of
−9.30 percentage points with paired interval [−11.13, −7.47]. This applies to
the frozen 28-card pool and policy. It neither measures every card separately nor
proves enjoyment. The balance worktree's ticket
`docs/specs/balance-framework/issues/04-run-target-checks.md` records the campaign.

The combination reports give a useful warning against overclaiming:

| Saved campaign under the card's `King Down/results/` | Games | Finding |
|---|---:|---|
| `combination-tests-20261010/REPORT.md` | 5,632 | No registered contrast clears the family interval; leads selected for confirmation |
| `combination-confirm-20261011/REPORT.md` | 1,216 | No registered contrast clears the family interval; uncertainty stays wide |
| `beast-flight-precision-20261011/REPORT.md` | 3,840 | Draw interaction +2.03 points, [−10.86, +14.92]; the earlier lead does not repeat |
| `mimic-skylift-precision-20261011/REPORT.md` | 4,480 | Spend minus standard with both cards is −10.08 points, [−17.53, −2.63]; no card-pair interaction clears its family interval |

These reports are read from the mounted card. Resolve its path through
`tools/lib/results-root.mjs`; do not assume the volume name is stable. Preserve
their source/spec/hash manifests. The study tickets record independent counts,
legal-replay checks and verified final backups. The framework uses the findings
as historical examples, not as results for a new ruleset.

The Mimic + SkyLift report scores 126 caps as draws. In the two compared
both-card cells, standard has 18 caps and spend has 19, out of 640 games each.
Alternative outcomes can shift the point contrast by up to 2.89 percentage
points. The quoted interval is conditional on the draw convention. Robustness
needs a paired sensitivity check; this bound alone does not resolve it.

The later depth-four power round records 1,584 games, 120 sampled legal replays
and 27 caps. Its report scores caps as draws. Keep that convention visible and
keep its results separate from depth three. The corresponding depth-four card
study is still open at the reviewed checkpoint. This proposal does not duplicate
its launch, collection or monitor.

## Gaps to fix before new measured claims

1. A complete scenario must carry every state and history field its rules read.
   Workshop `TryState` alone is not that contract.
2. Rule influence, execution order and legal refusal need distinct traces.
3. Main's `specKey()` in `src/sim/identity.ts` omits `powerHold` and `powerHoldSides`,
   although `playGame()` uses them. Review and repair study identity before
   relying on it for policy comparisons or resume checks.
4. Stable entity and card-instance history must replace label-based attribution
   before claims about copied, spawned, promoted or returned items.
5. Criterion 4 is descriptive as written; 4b is still an owner choice. New
   equivalence and noninferiority margins also need an explicit decision.
6. There is no human evidence here that establishes enjoyment, clarity or a
   difficulty level. Those require the playtest path in this framework.
