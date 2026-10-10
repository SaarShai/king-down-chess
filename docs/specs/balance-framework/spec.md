# Balance and rules framework

Status: approved for build

The owner supplies the full framework prompt and says, "execute this prompt" (2026-10-09).
This approval covers the framework, its checks, and a pull request. It does not approve a game change or a run.

## Scope

Read the approved rules, the ability matrix, the status workbook, and all available run sources.
Keep the rule version and the source for each result. Keep void and pending runs out of conclusions.
Build a typed design model, a measurement file, formal criteria, a status report, and limited effect models.
List proposed runs and open owner choices. Do not launch a run. Do not change shipped rules or prices.

## Plan and checks

1. Audit the sources. Record missing files, duplicate copies, void records, and pending runs.
2. Build and test the schema and its document check. A change to a rule or a matrix dimension must fail the check.
3. Build and test the data reader. Check duplicate records, rule context, incomplete data, units, and pending values.
4. Build criteria and effect checks. Each result must link to evidence. An unknown result must stay unknown.
5. Rebuild the dataset and status with one command. Run `npm test`, document checks, and a second rebuild for stable output.
6. Review the diff against main. Open a pull request. Do not merge it.

## Work

See [ticket 01](issues/01-framework.md).
