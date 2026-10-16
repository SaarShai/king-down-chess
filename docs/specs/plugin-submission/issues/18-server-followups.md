# 18 · Server follow-ups, lane server-2

Status: in-progress

## Scope

Build ticket 14 B4 and ticket 18-c on `claude/r9-server`.
The owner approves this scope and the exact B4 words on 2026-10-16.
The source tickets are in the owner's scratch ticket folder.

## Plan

1. Use the approved consent heading and six permission lines. Remove the token text and raw scope row. Keep the providers, account details and D8 password form.
2. Let each tool set `openWorldHint`. Set it true on find, say, invite, join and handle. Set it false on all other tools. Update the protocol check and checklist rows 28, 30 and 44, with the A6 result.
3. Add consent and tool-hint tests. Run `npx tsc --noEmit` and `npm test` with the specified local test database. Run `plugin-ui`, `plugin-ui-http` and the consent check on the M1, with the shared browser lock.
4. Check the diff and commit with both required trailers. Record results here.

## Verification criteria

- The consent page uses the owner's exact words. It shows no raw scope code or token text.
- The D8 form stays closed at first. Its mock password failure and success paths pass.
- Every tool has a boolean open-world hint. Only the five named tools that exist have a true value.
- Typecheck, unit tests and both required browser checks pass with the existing limits.

## Limits

- `kingdown_block` does not exist on this branch. Ticket 18-b adds it and must set its open-world hint true. This step does not build 18-b.
- Tickets 18-a, 18-d and 18-e are outside this step.

## Choices

- Remove the raw scope row, as the approved B4 rules permit. Keep the existing page layout and sign-in controls.
