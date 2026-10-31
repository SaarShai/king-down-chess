# Steady walk fitting

Status: in review

## Third review plan

- Balance head size, seam height and both seam body heights with one group scale.
- Reject low-score matches in the fit, gate and promotion. Check vertical motion inside the walk.
- Test the joint fit, saved measurements and promotion limits. Run the review mutations.
- Rebuild all 274 banks, report each failure and compare the four rounds. Update the PR and check CI.

## Second review plan

- Fit head size to the standing head. Flag a body height difference over 8%.
- Match the saved head template on each saved frame. Gate x, y and scale at each seam.
- Test the fitter, gate and promotion limits. Rebuild 274 banks and report regressions.
- Update the PR and wait for its checks. Do not merge.

## Plan and checks

- Fit walking keys on the head and shoulders. Keep the shipped rest pixels and baseline.
- Gate head movement and scale. Keep the pivot, rest and endpoint checks.
- Use authored poses at 120 ms. Do not make blended movement frames.
- Rebuild all 274 banks in a new folder. Report gates and head metrics. Make the comparison sheet.
- Run focused tests. Open the requested PR and check CI.

## Review fixes and checks

- Match the walking head band on the standing pose. Measure both ends with the same method.
- Gate the start, end and loop seams at 20 px. Reject missing and invalid values.
- Clear colour in transparent pixels. Test fitting, seams and promotion.
- Rebuild all banks, report each failed gate and check CI.

## Evidence

- Round 1: 269 pass, 5 fail. Round 2: 253 pass, 21 fail. Round 3: 73 pass, 201 fail.
  The gates changed between rounds. The independent head-top screen found 73 banks over 4% in round 2 and 210 in round 3.
- Round 4: 126 pass, 148 fail. A 5% or 6% y limit would pass 145 or 151 banks. The limit stays at 4%.
- The 274-bank rebuild has no missing output. Thirty banks fail the match-score floor. Fifty have a loop y step over 4%.
- The alpha head x step has median 1.89 px and p90 7.26 px. Eight banks exceed 20 px.
- All 24 review mutations fail on test assertions. The focused suite passes 18 tests and 68 bundled checks.
- The earlier focused run passed 16 tests and 68 bundled checks.
- `npm run test:docs` passes 187 tests.
- The local rebuild writes candidates and gate reports to `anim-out/offline-1030/out-steady/`.
- The report records the full rebuild, head measurements and the comparison sheet.

## Review record

- The first independent review found a standing-head anchor mismatch, missing seam checks and colour in clear pixels.
  The first fix matched the rest head, checked both ends and the loop, and cleared walking pixels with zero alpha.
- Two independent reviewers then found a different gate measure, head-size and vertical seam gaps, and weak tests.
  The second fix matches the saved head template, fits the standing head size, and checks x, y and scale at the seams.
- Issue 34 pinned each walking foot centre within 3 px. This fit replaces that rule: the foot centre moves by a
  median 62 px by design. The lowest row of each key still stays within 2 px of the standing ground line.
- The standing pixels stay unchanged. The rest gate compares the shipped RGBA bytes, including clear pixels.
