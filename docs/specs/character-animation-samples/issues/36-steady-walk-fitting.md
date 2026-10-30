# Steady walk fitting

Status: claimed

## Plan and checks

- Fit walking keys on the head and shoulders. Keep the shipped rest pixels and baseline.
- Gate head movement and scale. Keep the pivot, rest and endpoint checks.
- Use authored poses at 120 ms. Do not make blended movement frames.
- Rebuild all 274 banks in a new folder. Report gates and head metrics. Make the comparison sheet.
- Run focused tests. Open the requested PR and check CI.

## Evidence

- `KINGDOWN_TEST_FILE=tools/animation-bank.test.ts npm test` passes 12 tests and 68 bundled checks.
- The local rebuild writes candidates and gate reports to `anim-out/offline-1030/out-steady/`.
- The report records the full rebuild, head measurements and the comparison sheet.
