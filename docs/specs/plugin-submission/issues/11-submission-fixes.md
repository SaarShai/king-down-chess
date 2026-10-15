# 11 · Submission rehearsal fixes

Type: task
Status: closed

## Scope

The owner asks for R5–R8, R18–R21, R23 and the small shared part of R24. The base is `4bc171ec` on `claude/submission-fixes`, after integration `24d3fbd4`.

D10 stays open. This branch sets the six destructive hints for review. It waits for the owner's word before any merge. No push, merge or deploy occurs. Sign-in, policies, retention, safety controls, online visibility, random matching and listing promises stay outside this change.

## Plan

1. Add regression checks for hints, private metadata, empty board opens, count words and safe field errors. Record the failures before the code fix.
2. Fix the server and every widget or check reader. Skip unchanged icon writes. Keep the current game and profile IDs and useful deadlines in the model reply.
3. Correct both packet case copies and the 60 checklist grades. Add the support page to the deploy check.
4. Run the touched plugin/server tests with `npm test`, typecheck, the compiled server check and the protocol check. Use `kingdown_subfix_test` and the test suite's own database copy.
5. Repeat P1–P5, N1–N3 and the MCP tool table. Add an After the fixes section to the scratch report. Stop owned processes and drop owned test databases. Check and commit the diff with both requested trailers.

## Verification criteria

- New regression checks fail on the old code and pass with the fixes. Test time limits do not change.
- Board IDs, game revisions and report receipts stay in widget metadata. Widget mount, remount and board selection still work.
- P2 includes the king and arrangement choice, Ready and then Your move. Negative cases expose no new operation or data.
- The checklist separates local proof from owner and release steps. D10 remains a merge gate.
- Required commands pass. Logs and MCP transcripts stay in the scratch rehearsal folder. Cleanup confirms no owned server or database remains.

## Results

- The six destructive hints are true. Join and seen are not idempotent. An unchanged icon causes no profile update. D10 still gates merge.
- Empty board opens return home. Internal board IDs, revisions and report receipts stay in widget metadata. The widget and check readers use that metadata.
- Descriptions state the board write, preview limit and setup defaults. Singular count text is correct. Both P1 and P2 packet copies match. All 60 checklist rows use the new grades. The deploy check covers support.html. The shared input guard returns safe field errors.
- The new server/client checks fail on the old code: 7 failures in 23 tests. On this branch, the 7 touched test files pass all 146 tests. The 50 drawing tests also pass. Typecheck, the compiled server check and the protocol check pass.
- The HTTP browser check passes with the existing limits. Its old fallback assertion now checks status and turn data without an internal revision. A mount-retry test waits for the existing Retry panel to close before it reads status. No test limit changes.
- The local MCP repeat covers P1–P5, N1–N3, all 25 tool descriptors, safe invalid-field replies, the widget resource and phone renders. It records 58 protocol calls. Host routing, refusal words and confirmation still need the final owner account.
- Logs, transcripts, samples and the After the fixes section are in the scratch rehearsal folder. The report marks 10 findings fixed, 14 owner and 1 optional item open.
- Cleanup drops kingdown_subfix_test and the suite’s kingdown_subfix_chatgpt_test copy. It stops the owned servers and browser. No push, merge, deploy or owner policy change occurs.
