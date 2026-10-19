# 41 Keep legacy short codes during the change-over

Status: ready-for-review
Branch: claude/release-candidate
Base: 801cc7c9

## Plan and pass criteria

1. Add two database tests before the code change. Use the Preview and Join methods that the owner names. Show the legacy test fail on 801cc7c9.
2. Read both short-code hashes. Prefer the HMAC row. Keep the matched hash for both Join reads and its row lock.
3. Keep new codes as HMAC values. Keep the code-try limit before each lookup. Mark the fallback with its removal condition.
4. Check legacy success, HMAC preference, the other game's free seat, and the row locks. Keep the missing-secret and long-link checks.
5. Run the type check, the full test suite with the local test database, and the required browser checks at a committed head. Use the owner's check runner. Do not push.

## Evidence

The source starts at 801cc7c9. The worktree is clean before the tests.

Both database tests are in place before the code change. The single-file run uses `npm test` and the owner's local test database. The source still matches 801cc7c9. The legacy test fails at Preview with `INVITE_UNAVAILABLE`; 39 tests pass. Log: `tests-red-801cc7c9.txt` in the owner's lane folder.

The two-row test holds locks on the legacy game and invite. A second connection must preview and join the HMAC game without those locks. Its lock limit is one second. It also checks that the legacy game, invite and seat stay unused.

## Build

The shared invitation method reads both hashes and selects HMAC first. It returns one matched hash. Both reads in Join use that value, as does the invite row lock. New invitations still write HMAC only. The code-try limit stays before the lookup. The shortcut comment gives the removal condition: FRIEND_CODE_DAYS after this build is published.

The old missing-secret test no longer expects a valid legacy code to fail. It still checks missing and short secrets, and a long link without a secret. The new tests also check Join retries and used codes. A used HMAC row cannot send a player to the legacy game.

The code-try test holds an exclusive lock on the invite table. Preview and Join must return RATE_LIMITED, without a lookup that would hit the one-second lock limit. No existing test or check limit changes.

## Checks

- `npx tsc --noEmit`: pass.
- Focused database suite with the fix: 40 tests pass, before the extra rate-limit test.
- Full `npm test`, with the owner's local test database and test lock: 191 files pass; 3,143 tests pass; 8 skip. All 51 art tests pass. Log: `tests-full.txt` in the owner's lane folder.
- `git diff --check`: pass.
- The browser checks use the committed head and the owner's check runner. The final runner result and head go in the lane report below.

## Review notes

The two rows have different hosts and seats. Preview must name the HMAC host and seat. Join must return that game and seat. Locks on the legacy game and invite prevent a test from passing if Join takes either extra lock. The test also checks that no join command, seat change or invite use reaches the legacy game.

The source change leaves code creation, secret checks, expiry checks and long links in place. Both Join reads still use the same column and value. This build has no client change, schema change, new dependency or taste choice.

Report: `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/legacy-code-hash/41-legacy-code-hash-build.md`.
