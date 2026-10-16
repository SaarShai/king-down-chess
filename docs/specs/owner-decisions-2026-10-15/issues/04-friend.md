# Friend invite and join (J5 a)

Status: in-progress

Lane: od-end. Branch: `claude/od-end`.

## Scope and approval

The owner asks to build ticket 04-friend on 2026-10-15.
The approved pick is J5 a: Share first, Copy full text.
Keep the Ends line. Name the open side on the Join button.

## Plan and checks

1. Use one full invite text with the code and rule names for Share and Copy.
   Put Share first and Copy beside it on the code screen.
2. Show the known code and Share in the waiting friend row in Your games.
   Keep codes in page memory. A remount must not make a new code.
3. Name the real side on the join preview button.
4. Test each change, native Share, Copy, refusal and cancellation.
   Run `npx tsc --noEmit` and `npm test` on this Mac.
   Run `npm run -s check:browser plugin-ui` on the M1.
   Run plugin-ui-http too if server code changes.
5. Get two independent reviews. Fix each confirmed fault, then commit.

## Comments

- The server keeps code hashes only. This change uses the code that the
  page receives when it makes an invite. A remount keeps the existing
  Make a new code path. It does not end a code by itself.
