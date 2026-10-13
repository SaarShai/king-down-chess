# Save and replay one design study

Status: resolved
Type: task
Blocked by: none

## Outcome

A designer saves one supported custom piece and one complete scenario, plays an
action, undoes it, and sees the same result in the Proving Ground, game and replay.
The [unchanged Rook example](../worked-studies.md) is the first acceptance case.

## Scope

Reuse `DesignSpec`, the existing share code, `Position`, FEN/LAN, `genDesigned`,
`movesOf` and the current save controls. Add stable version references and a
scenario contract for state, history, rules and expected facts. Validate imports
before changing the open game. Show the operation support table with reasons.

Use the existing one-design slot. Preserve the three-rule limit. Refuse unsupported
history conditions and a second distinct design. Do not add a new move interpreter.
The record format states its version and refuses an unreadable format.

## Checks

- Unchanged Rook has equal moves and attacks across the shared paths.
- Positive, blocked, pinned, checked-king and both-color cases pass.
- Save/reload, undo/replay and full-state equality pass, including spent state.
- Direct legal replay rejects a known illegal action.
- Bad or unsupported input leaves the saved game and current rules unchanged.
- `npm test` and the affected registered browser checks pass.
- The owner approves the rendered sample before the visual build.

## Evidence

Owner approval, 2026-10-12: “approved. start building the framework on this
branch, beginning with saved studies and interaction tests.”

## Build plan

1. Save a versioned study with full rules, explicit Position state, source
   identity, design references, legal history and assertions. Do not use FEN as
   the only state: extra actions make its inferred ply count wrong.
2. Validate the whole import before changing a session. Reuse Game and direct
   legal-action matching for play, undo and replay, in an isolated context.
3. Provide local file save/load and a deterministic study check. Build the
   unchanged Rook control and the boundary/negative cases.
4. Render a small sample of study controls around the real board. Get the
   owner's yes before the visual build. Continue nonvisual work meanwhile.
5. Review independently; run npm test and the affected browser checks. Record
   concrete results before marking the ticket done.

Verification follows the checks above. No game campaign is part of this build.

## Build checkpoint

The nonvisual layer is built. It has a strict, versioned full-state format,
source checks, legal replay, play, undo, and local file export. The command line
refuses output overwrite. Tests compare My Rook with Rook for both sides,
blockers, pins and check. They check moves and attacks in the shared engine
scope. Extra actions retain their exact counters; FEN is display only.

The [usage guide](../usage.md) gives commands and limits. The record supports
constructed positions. It refuses real-game provenance until a start and prefix
can prove it. The browser integration below completes this ticket.

The [rendered sample](../sample/README.md) contains eight desktop and phone
states. It uses the real board renderer and marks. Results are labeled
illustrative. The owner approves this layout on 2026-10-13: “Approve the layout”.

## Browser build plan

1. Add the approved study view from the Proving Ground. Reuse PaintedView and
   the common move marks. Keep the current game and the Try editor separate.
2. Run studies in a dedicated browser worker. Use the same source fingerprint
   as the command line. Validate imports before replacing the open study.
3. Add local save/open and JSON import/export. Keep storage failures visible
   and preserve unreadable records. Provide play, undo and assertion controls.
4. Check desktop and phone interaction, reload, bad imports, save failure,
   keyboard use and live-game isolation. Review independently and run tests.

Independent review finds one import gap: drawn cards can exceed the engine's
eight-card hand limit. The fix checks dealt plus drawn cards and adds a rejection
test. Further tests cover GrowthB and a held turn that gives check. The reviewer
checks the fix and finds no remaining should-fix in these changes.

## Nonvisual checkpoint verification

- `npm test`: 2,276 pass, 129 existing skips; all 50 art tests pass.
- `npm run test:docs`: 113 pass in seven files.
- `npm run check:browser workshop`: passes against the built worktree.
- All five generated study files pass through the actual command line: 38
  declared facts across 18 legal actions. Reports retain unsupported identity
  and untested experience cells.
- The 22 new tests cover session state, interaction checks, source identity,
  file limits, safe writes and the extract/play/save/undo path.
- Comparison with base `ab6e751a`: the build adds study modules and tools. It
  does not edit the game engine or current browser controls.

The full test log is `/tmp/kingdown-framework-full-test.log`. The browser log is
`/tmp/kingdown-framework-browser.log`. Generated studies and reports are in
`/tmp/kingdown-framework-verified`. The commands in the usage guide reproduce
the study files for the current source.

## Answer

The approved browser controls are built. Open Workshop → More → Studies. One
worker owns full legal play, replay and assertions. The current game, Try board,
rules and game storage remain separate. Local storage keeps immutable versions.
JSON imports validate before replacement. A failed save preserves the draft and
keeps Export copy available. Dirty exports get a separate identity.

The screen supports mouse, touch and keyboard input. Legal actions includes
cards, powers and end turn. Tests can declare legal/refused actions at the current
position. Imported files can also assert piece, state and status facts. A checked
action cannot be undone until its checks are removed. Challenges and coverage
survive check edits; the last check needs a replacement before removal.

Independent review finds and closes two browser issues: assertion edits could
drop coverage and challenge data, and a corrupt-library alert could sit behind
the open panel. A regression test keeps this evidence. The registered browser
check verifies visible panel errors. No should-fix finding remains.

## Final browser verification

- `npm test`: 2,287 pass, 129 existing skips; all 50 art tests pass.
- `npm run test:docs`: 113 pass in seven files.
- `npm run check:browser studies`: passes at 1440 × 900, 390 × 844 and 375 × 667.
- `npm run check:browser workshop`: passes in 113.7 seconds.
- Browser checks cover keyboard and touch play, capture, Haste and end turn,
  undo, six passing facts and one deliberate failure, save/reload/versioning,
  unchanged save, import/export, schema/source/illegal-action refusal, quota
  failure, corrupt library, focus and Escape. Game and Try state stay unchanged.
- Visual checks cover the desktop board and small-phone save failure. The board
  and the sidebar show the same selected Workshop figure.
- Comparison with base `ab6e751a`: the branch adds the study modules and tools,
  four Workshop entry lines, and source identification at build time. It does
  not change game rules or engine behavior.

Logs: `/tmp/kingdown-study-ui-tests.log` and
`/tmp/kingdown-study-ui-browser.log`. The registered checks keep their own build,
logs and screenshots under the output folders named in the browser log.
