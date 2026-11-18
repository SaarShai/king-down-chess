# Character sounds on the plugin board

Status: resolved

Use the approved recordings on the shared account board when Sound is on. Keep Sound off by default. The Queen has no selection cue.

The widget loads the WAV data in a static module from its declared resource origin. The web page loads the WAV files directly. Muse returns a text board and links to the web page.

The local sandbox test checks Sound Off, the silent Queen, and the Knight selection, leap and landing cues. The shared board, sound, build and plugin tests pass. The `plugin-ui` browser check passes.

## PR 379 repair

F11 checks the Pawn walk request and the synthesized sound for the skipped step. It still checks all five skip inputs and the final server position. N11 checks the Spirit King recording at the start of travel. Both recordings come from the same sound code that the web board uses.

The old Knight test can stop while the move still plays. With animation frames held for 1.6 seconds, the old check sees only selection and leap. All three cues play by the end of the move. The test now waits for board rest and checks the exact cue list.

F-107 uses Option+Tab on macOS WebKit to reach the menu buttons. It keeps the same focus checks.
