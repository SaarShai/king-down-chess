# Daylight paper and type

Status: resolved

Apply the Daylight colours, fonts and shared control styles to the web game. Check each screen in the paper lane at three sizes. Keep the native splash art as a separate task.

## Answer

The web game uses Daylight paper, Cinzel titles, Alegreya Sans text and brass selection states. The kit keeps the same controls. The iOS web view uses the new paper colour.

The 24 game and reference pairs cover eight screens at three sizes. The text and control edge pairs pass their contrast targets. The 634 focused tests and the web-game browser check pass. A final board focus repair passes 492 focused tests and a browser keyboard check.

Set all three PNGs in `ios/App/App/Assets.xcassets/Splash.imageset/` to `#f5f0e4` in the native art lane.
