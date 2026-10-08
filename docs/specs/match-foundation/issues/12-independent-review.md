# Independent review of the private plugin

Status: resolved

## Request and scope

On October 8, 2026, the owner asks for two independent reviews of all work in this task. Review the match service, private plugin, account controls, persistence, phone controls, release tools and acceptance evidence. Exclude unrelated game balance and workshop changes.

The fixed baseline is `7d4370fff4d2f63150416d5be2687323c50640bd`, the parent of the first match-foundation commit. The review target is `860386f12f78c3505b32fcb6f1c54015f5cb8488`. Use the final diff and relevant commit history.

## Plan and verification

Give two external reviewers the same scope in separate fresh contexts. Each reviews both documented standards and specification compliance. Neither sees the other's report. Limit both to reading tracked source and supplied review material. Do not access secrets, change live accounts, deploy or edit source.

Check each reported defect against the target source. Record the trigger, file and line, impact and evidence. Separate confirmed defects from possible risks and missing evidence. Keep both reports and their coverage limits. Do not treat passing tests or earlier completion claims as proof that the implementation is correct.

## Progress

The owner signs in through the subscription. Two separate tracked-text snapshots hold the fixed target, diff and commit list. Reviewers have read-only file tools and no live service access. Both requested reviewers start after the required CLI update. The response metadata confirms each requested model. Review results remain pending.

## Answer

Both independent reviews complete against the fixed target. Each uses a separate source snapshot and fresh context. The response metadata confirms both requested models. Neither sees the other report. The reports run through the installed subscription CLI; they do not use a connector. The required CLI update succeeds.

- [Reviewer A: complete report](../reviews/review-a.md). Six standards findings and eight specification findings. The most serious specification finding is unintended same-square actions from repeated taps or drag start. Standards findings are low severity, including subjective design suggestions.
- [Reviewer B: complete report](../reviews/review-b.md). Seven concrete standards findings plus a grouped set of subjective smells. Eight specification findings plus test-coverage notes. The most serious specification finding is lost board recovery after match deletion. This reviewer rates the forbidden test commands as a medium standards finding.

The reports are source reviews. Neither reviewer runs tests or visits the live host. The coordinator checks the cited source paths. The current documentation checks pass. No runtime reproduction or repair is claimed by this review.

## Coordinator validation

### Confirmed source defects

1. Reviewer A F1: `src/plugin/app.ts:70-73` matches a selected square against same-square actions. The engine emits Haste pass and Archer shot with `from === to` and no power flag. A unique one passes the ordinary filter. Freeze can pass the single-option filter. `onDragSelect` calls the same submit-capable function. [Ticket 13](13-explicit-board-actions.md) owns the repair and browser regression.
2. Reviewer B Spec 1: deleting a selected match cascades its board row. `src/plugin/server.ts:24` calls `getBoard` before Create, Resume or Join. A missing row throws FORBIDDEN before the recovery action runs. Reload also fails. A fresh model-side Open can still create a new board; the defect is recovery inside the old board. [Ticket 14](14-deleted-board-recovery.md) owns the repair and database regression.
3. Reviewer A F2: worker failures during apply are mapped to definitive INVALID_MOVE; create failures before a handle exists become INVALID_INPUT. Raw worker error text can reach the board. Retry classification needs a separate repair.
4. Reviewer A F3: provider timeouts, rate limits and server errors all become an OAuth 401. Fail closed remains required, but temporary provider failures need a service-unavailable response. Whether ChatGPT forces a reconnect in this exact failure case is not verified.
5. Reviewer A F7: horizontal keyboard movement wraps between ranks. Correct example: ArrowRight from h1 reaches a2; ArrowLeft from a1 is clamped and does not wrap. Vertical edge movement can shift file because it clamps the whole square index.
6. Reviewer B Spec 8: command text permits a null character; PostgreSQL jsonb rejects it before move validation. The generic error leaves an uncertain command pending. This concerns a crafted client request, not a move offered by the board.

### Confirmed record and operation gaps

- Both reports find bare test-runner commands in the match guide. They conflict with AGENTS.md and the setup ticket's claim that alternate commands are removed.
- Both find that the setup guide names migration 0002 but omits 0003 and per-board selections. The migration tool itself applies both; the defect is the guide and incomplete data inventory, not that tool. The startup check does not verify board-table access.
- Both find a visible Facebook consent button while the website hides that provider and the approved setup names Google/GitHub. Its current provider configuration is not checked in this review.
- Reviewer B finds that the push guard omits `plugin-deploy/` and `vercel.json`. The omission is confirmed. There is no finding that an unauthorized direct code push occurred.
- Reviewer B finds that startup maps database query failures to an allowlist-install message. Generic runtime logging also omits useful error categories.

### Suggestions and unverified concerns

- Missing indexes, full-save reads, row retention and account-level limits are confirmed code properties. Their production cost is not measured. Treat them as capacity work, not as a demonstrated failure at the private-test load.
- Moving board SQL into the store, unifying grant blocks and UUID/loopback helpers, and shorter prose are design or maintenance suggestions. They do not by themselves establish a functional defect.
- Reviewer B Spec 2 raises real-host definitive-error metadata delivery. The fixture passes it through; no live result establishes failure. Do not add a fallback solely on this assumption. Check the host first.
- Reviewer B Spec 3 treats tapping a marked friendly swap/shove target as an error. That tap follows the current direct-action policy and can be the intended move. Do not accept the proposed blanket own-piece reselection change without an interaction decision.
- Reviewer B Spec 7 needs a PostgreSQL connection-loss check. The failed rollback can mask the original error, but a broken client returning to service depends on pool behavior and is not confirmed here.
- Reviewer B's evidence-durability concern is partly valid: full logs under `/tmp` are temporary. Ticket 06 already stores the receipt digest, revision and command count; ticket 10 stores the revocation status and remaining token lifetime. Keep those source records and the clearly labeled owner reports. Do not describe the evidence as wholly absent.
- Reviewer A F8 identifies a broader beta packet than the completed live record. The private acceptance result does not prove every packet scenario live, particularly a mobile terminal game and all negative cases. Preserve the narrower evidence labels before any wider test or public submission.

## Follow-up

The review is complete; the new defects are not repaired. Tickets 13 and 14 record the two medium gameplay/recovery findings. The confirmed error-handling, keyboard, validation, documentation and operation gaps above also remain open. The prior test and phone acceptance records remain historical evidence, not proof that these newly found cases pass.
