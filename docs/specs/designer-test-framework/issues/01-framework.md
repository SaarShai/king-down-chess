# Designer test framework proposal

Status: resolved
Type: research

## Request

The owner asks for a framework on a separate branch. It must let designers test new
pieces, cards, powers, effects and rules. It must cover integration, interactions,
strategies, fun, challenges and game scenarios. Read the two named Codex chats and
the Claude chat, “Codex rules framework visualization review”.

## Plan

1. [x] Read the three chats and check their claims against the current main source.
2. [x] Define the designer workflow, shared records, test stages and decision rules.
3. [x] Give a usable study template and worked examples. Map proposed work to the
   existing Proving Ground, engine and balance tools.
4. [x] Get an independent review. Fix confirmed findings. Run the doc checks and
   check links, source claims and the diff against the branch base.

## Verification criteria

- Each requested design type has a definition, test path and evidence record.
- Current functions and future work have distinct status.
- Tests cover legality, state, interaction, balance, strategy and human play.
- Each claim has a scope, a unit, a control and a limit.
- One example shows the whole route from question to a decision packet.
- The proposal does not change game rules or launch games.

## Scope

This branch contains the framework proposal and study documents. The owner
approves the spec before its software build, as AGENTS.md requires. Main tracker
files and the other chats' branches keep their current state.

Base: `ab6e751a10f0cc2198363a68e37f4604850eafc7` (`origin/main`).
Branch: `codex/designer-test-framework`.

## Evidence and review

The [spec](../spec.md), [protocol](../test-protocol.md),
[template](../study-template.md), [worked studies](../worked-studies.md),
and [source review](../source-review.md) meet the criteria above. Tickets 02–05
give complete build steps and their checks. The proposal is complete; its
software build still needs the owner's approval.

Two independent readers review the documents. Neither writes the proposal.
The evidence reader finds two should-fix items, both fixed and checked again:

- The Mimic + SkyLift example now states how caps are scored, the affected
  counts, and the need for a paired sensitivity check.
- Policy comparisons now record actual cost, overruns, worker/thread settings
  and the timeout rule, beside the requested budget and measured strength.

The code reader finds no must-fix or should-fix item. Two small corrections are
also applied: the location of `specKey`, and wording that distinguishes
king-target restrictions from the attack semantics used to detect check.

Both readers support the smallest complete route: saved studies and scenarios
around the current engine, then focused interaction traces. General authoring
comes later. There is no second interpreter or new service layer.

Verification:

- `npm run test:docs`: 7 files and 113 tests pass, exit 0.
- Local Markdown links resolve. The source review's five later commits are
  checked and are not ancestors of the branch base.
- The cap bound is independently checked: `0.5 * (18 + 19) / 640 * 100 = 2.890625`
  percentage points. The documents do not treat that bound as a new interval.
- The branch diff contains only this proposal folder. It changes no code,
  generated balance report, rule source, main tracker or other worktree.

The doc log is outside Git at
`/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kd-designer-framework-ad1m8o3_/docs.log`.
No new games run. No live or remote state changes are part of the proposal.
