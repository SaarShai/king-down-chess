# Close the balance evidence gaps

Type: task
Status: done

The owner says the M1 is available and asks to complete pending work. Commit, merge,
and new M1/Kaggle runs follow after this work. This step starts no simulation.

## Plan and checks

1. Verify the M1 identity. Inventory its run outputs and copy finished evidence without a remote change.
2. Check the four named runs against exact recorded game schedules. Keep stopped samples separate
   from complete plans. Preserve the comparison sample and the source rule and price context.
3. Close source-document and schema gaps that need no rule decision. Keep unresolved choices explicit.
4. Rebuild all measurements and dependent status. Update the supported findings and next-run order.
5. Test completion, stopped samples, contrasts, source drift, and report changes. Check a stable rebuild.
6. Leave reviewed files on the existing branch. Do not commit, merge, launch, or change game behavior.

## Acceptance

- Remote source coverage has a verified inventory and local copies. Missing material has an exact reason.
- Pending status follows the data. An incomplete original plan is never reported as fully complete.
- Stopped samples have explicit selection and denominator. Different comparison populations stay separate.
- The report uses completed evidence and retains unknown decisions. The next-run list avoids duplicates.
- The checks pass or name only an unresolved owner decision. No game rule or price changes.

## Result

The result below records this step. The owner later approves the three source corrections.
[Ticket 03](03-resolve-source-conflicts.md) records their resolution and final checks.

The M1 identity matches the recorded host, hardware and host key. The read-only copy has
6,966 files and 884,068,015 bytes from nine project folders. All copied files match the
later remote SHA256. `m1-snapshot.json` records the hashes. The builder checks them locally.

| Run | Lifecycle | Verified games | Original plan |
|---|---|---:|---:|
| deal-c4k | stopped | 3,498 | 14,000 |
| deal-d4k | stopped | 6,998 | 14,000 |
| deal-nosalv2 | complete | 3,500 | 3,500 |
| ab-guard-drop-any | complete | 4,000 | 4,000 |

The stopped schedules use exact shard IDs. They keep the original plans. The four-card
sample has no paired overlap. The six-card stopped sample has 1,166 paired openings.
The no-Salvation sample has 1,750 paired openings. The Guard contrast uses 100 arrangements
and the old Archer price of 505 cp. None certifies the full current target.

The framework now records all 97 rule axes, copy inheritance and mark renewal. It maps
the archived Squire Base to its source reports. Three source conflicts remain: the king-power
movement rule, the workbook six-card cell, and the workbook Beast-limit cell. The check
keeps these visible. This task does not choose a new rule or rewrite the historic workbook.

Target checks require full valid flags, pool, mode, source and spec hashes, and a price review.
Game criteria keep controls separate. Proposal removal requires the planned evidence, not
one matching row. A report-only backup cannot hide a checked paired result.

The next list separates Kaggle activity from M1 odds worth. The standard Guard value swap
starts on b1, so it cannot close king-adjacent Guard worth. No run starts here. The owner
keeps commit, merge, and run orchestration for the next step.


## Verification

- `VITEST_MAX_WORKERS=2 npm test`: 1,513 pass; 13 skip. All 42 artwork checks pass.
- `npm run test:docs`: 74 pass. Typecheck and `git diff --check` pass.
- Two full corpus builds read 22,011 sources and 866 run IDs. They each yield 13,145 rows.
- Final regeneration from the checked dataset gives identical measurements, status, framework,
  coverage and workbook files. The dataset SHA256 is
  `7f9dd869d36eff42cac2dca687362687ebda54974e2bc33cd05ef47ffe53b329`.
- The M1 copy check verifies all 6,966 saved hashes with zero gaps.
- `npm run balance:check` deliberately returns 1 for the three named source conflicts.
  `--report` returns 0 and retains the same findings. No drift or missing rule axis remains.
- Review checks cover exact stopped schedules, missing or extra games, paired sample units,
  report-copy order, complete rule domains, separate controls, evidence links and proposal removal.
- Game sources, eval prices, main trackers and the original workbook have no changes.

The work is ready for commit review on `codex/balance-framework`. This step makes no commit,
push, merge, deployment or new simulation. PR 30 remains at its prior committed state until
that next step.
