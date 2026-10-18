# 41 Keep legacy short codes during the change-over

Status: in-progress
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
