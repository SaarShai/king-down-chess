# Character sounds on the plugin board

Status: resolved

Use the approved recordings on the shared account board when Sound is on. Keep Sound off by default. The Queen has no selection cue.

The widget loads the WAV data in a static module from its declared resource origin. The web page loads the WAV files directly. Muse returns a text board and links to the web page.

The local sandbox test checks Sound Off, the silent Queen, and the Knight selection, leap and landing cues. The shared board, sound, build and plugin tests pass. The `plugin-ui` browser check passes.
