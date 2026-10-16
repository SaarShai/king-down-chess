# Base: the last three review fixes

Status: claimed
Type: task
Lane: od-base

## Scope

Follow ticket 01-base and the owner's three review items. D2 a says:
"Play now uses Beginner and an automatic army; saved custom options stay."
Pictures and game tokens keep their own shape. Controls use stone.

## Plan and checks

1. Make each Play now game use Beginner and an automatic army. Keep the
   saved setup for New game. Test a new player and a saved friend setup
   with Strong and Arrangement on. Update QA step 2 and its doc test.
2. Exclude king pictures from the stone rules. Check their face, selected
   state and size in the browser.
3. Limit the preset exclusion to the name pictures. Check that a preset
   button outside the name page keeps its stone face.
4. Run `npx tsc --noEmit` and `npm test` on this Mac. Run `plugin-ui` on
   the M1 in `~/projects/kd-od-base`, with the shared lock. Run
   `plugin-ui-http` only if server code changes. Raise no time limit.
5. Get two independent reviews. Fix each confirmed fault. Commit on
   `claude/owner-decisions`. Do not push, merge or deploy.

## Build

- `quickSetup()` reads the saved options, then sets Computer, Beginner
  and Arrangement off. It does not change the saved setup. `launch()`
  already skips the settings write for Play now. That guard stays.
- QA step 2 and its doc test state the same rule. Unit tests cover a new
  player and saved friend and random choices with Strong and Arrangement.
  The browser check also opens New game and checks its saved choices.
- Each stone selector excludes the king pictures. The browser checks
  their face, selected mark, disabled face and 44 px size.
- Only `#presets .preset` gets the name picture styles and stone
  exclusion. A browser check adds a preset control outside that group.
  Its face is stone, and its shape is a control.

## Reviews

- Reader A finds no fault in the setup, saved choices or QA changes.
- Reader B finds a test gap: the disabled stone rule has no image or
  inset shadow, so the first assertion can miss it. The repair checks
  that three disabled king pictures have transparent faces and borders.
  Reader B checks the repair and closes the finding. Both reviews have
  no open fault.

## Verification

- `npx tsc --noEmit`: pass.
- `node --check tools/plugin-ui-check.mjs`: pass.
- `npm test` waits for the shared test lock. The test uses four workers
  and the given local test database. Browser checks are pending.

## Taste choices

No new taste choice is necessary. The owner's picks set the result.
