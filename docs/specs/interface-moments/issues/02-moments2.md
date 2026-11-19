# Port the painted collapse and bow

Type: task
Status: resolved

Port the approved 34 sheets and the frame player to the Daylight base.
Use the body's board height at the join (MM2). Apply the reference times
and the P19 dissolve. Provide skip, reduced motion and an offline fallback.
Keep the demo for review. Leave game integration, MM1 and MM3 to their lanes.

## Checks

Check each bank, the playback clock, scale, cleanup and load failure.
Check both service worker templates and verify the game build.
Save first, middle and final poses of pawn, knight, ogre and one king.

## Result

All 34 sheets and 701 frame times match the accepted banks. The focused
tests pass. Both browsers play each sheet. The web-game browser check
passes. The demo frame pairs and the commands are in the Daylight
moments report in the design project.

The join still supplies the current pose, its board height and the
effect clock. It checks MM2 on the live board.
