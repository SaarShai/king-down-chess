# Friend invite and join (J5 a)

Status: resolved

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

## Build

- The code screen puts Share first, with Copy beside it. Both actions
  use the same sentence with the code and the enabled rule names.
- Share uses the device share sheet. If it is absent or refuses,
  Share copies the full text. Cancel leaves the clipboard alone.
  If Copy also fails, the page shows and selects the full invite.
- The waiting friend row shows the known code and its own Share button.
  Share keeps the code and leaves the game closed.
- The join preview button names White or Black from the server preview.
  The code screen keeps its Ends line.

## Checks and review

- `npx tsc --noEmit`: pass on the final code.
- First `npm test`: 165 files pass; 2,565 tests pass; 8 skip.
  One unchanged rules test times out at its 5-second limit
  (`src/rules/power-fixes.test.ts:470`, 6.4 s). The suite ends in 182.2 s.
  All invite and join tests pass.
- Second full run: the same rules case times out at 5.1 s.
  The case now runs as five cases, one for each reading. Each keeps
  the same seed, all 4,000 boards and the same assertions. No rule or
  time limit changes.
- Final `npm test` at `c89f1594`: pass. All 166 files pass;
  2,570 tests pass; 8 skip. Vitest ends in 159.9 s.
  All 50 document tests also pass. The command returns 0.
- M1 `npm run -s check:browser plugin-ui`: pass at `d72c4165`, 245.7 s.
  Run folder: `kd-od-end-GNepfn`. The check tests the full clipboard text,
  native Share, refusal, the invite row and the Black join label.
- The phone captures show both buttons, the Ends line and the full
  Join and take Black label. No text is cut.
- No server code changes. The HTTP browser check does not apply.
- Follow-up review A reports three faults. Review B reports none.
  See Review fixes below. Review A finds no lost coverage in the rule-test
  split and no fault in the hidden action row.

## Choices and limits

- Share copies the full invite when the device cannot share it.
- Codes stay in page memory. After a remount, the player can select
  Make a new code. The page does not renew a code by itself.
- No ticket part is omitted.

## Comments

### Review fixes

1. Check each reported fault against the code and the J5 a pick.
2. Add a waiting invite to the 197 px reflow test. Check the text bounds
   and the Share bounds. Put Share below the row at narrow widths.
3. Give the Copy button tests a share function that counts calls.
   Check zero calls and the full invite on the clipboard.
4. Update the QA steps, tester guide, live checks and Q28. Add a document
   check for the current invite and join steps.
5. Run `npm test` here and `npm run -s check:browser plugin-ui` on the M1.
   Run plugin-ui-http if server code changes. Keep all time limits.
   Record the results, then commit.

- A1, confirmed: the two-column invite row has no narrow-width rule.
  Share now sits below the row under 300 CSS px. The 197 px test creates
  a waiting friend game and checks all text bounds against the row and
  Share. It also scrolls Share into view and checks access above the
  composer gap. The browser check checks text at 197, 320 and 390 px.
- A2, confirmed test gap: the Copy handler already passes `false`.
  The button tests now give the device a share function that counts
  calls. They check zero calls and the full invite on the clipboard,
  then check the full selected text when Copy fails.
- A3, confirmed: the four listed documents give old Copy and Join steps.
  They now describe Share first, Copy with the full invite, the fallback
  words, Share in Your games and the open side on Join. A document test
  checks each file. Q28 and user story 30 now use the J5 a pick.
- Review B has no finding to fix.
- M1 `npm run -s check:browser plugin-ui` at `8eac6257`: pass,
  222.2 s. Run folder: `kd-od-end-4MQxQK`. The real clipboard contains
  the full invite. Both Copy paths make zero share calls. Row text
  stays inside its button and clear of Share at 197, 320 and 390 px.
  The check saves a row image at each width. The images show the code;
  the 197 px row uses vertical scroll. The check releases its lock.
- No server code changes. The HTTP browser check does not apply.
- `npm test` at `a827ff68`: pass. All 166 files pass; 2,574 tests pass
  and 8 skip. Vitest ends in 145.74 s. All 50 document tests also pass.
  The command returns 0. The run uses the local test database from the
  house rules and keeps each time limit. The new reflow, Copy and
  document checks pass. No confirmed finding stays open.
- The final commit hooks pass the type check and the staged checks.

- The server keeps code hashes only. This change uses the code that the
  page receives when it makes an invite. A remount keeps the existing
  Make a new code path. It does not end a code by itself.
- Review 2 finds that Back can keep an old list after Make a new code.
  Play now renders the saved list again when it needs no server read.
  A regression test covers Make a new code after a remount, then Back.
- Review 2 also finds that a code can arrive after Back. Code receipt
  now renders the saved rows. A held-reply test covers this path.
- Review 1 finds that these new rows must keep the current command lock.
  Row rendering now applies the button state. The held-reply test also
  holds Resume and checks both buttons before it releases Resume.
