# 39 Device recheck faults

Status: in-progress
Branch: claude/release-candidate
Base: 170bf85c

The owner asks for F-1 to F-4 from the device recheck ticket.
F-5 and taste calls T-1 to T-3 stay out of this build.

## Plan and pass criteria

1. Add checks before the fixes. Show each fault on the source at 170bf85c.
2. F-1: hide the words line below 320 px. Check win and loss at 206 x 395, insets 27/12. Keep the existing 197 x 426 and Safari 201 x 357 cases.
3. F-2: apply the drag gate at pointer down. Check that a swipe sends no selection or click when drag is off. Keep a tap.
4. F-3: centre direct sheet buttons. Check card and power Use at 402 px. Keep move rows left aligned. Check the menu and resign sheet.
5. F-4: give the first dot its own row item. Check the row elements and the gap in the hall.
6. Run the type check, full tests through the lock, and plugin-ui on the M1 and WebKit on this Mac. Commit the build and record the results.

The checks use the interfaces that the owner names in ticket 39: PaintedView pointer events, gamesList row elements, and the built page.
The main session then checks Android F-1 and F-2 on the emulator.
No server code, game rule, dependency, push, pull request, merge to main, deploy, or sign-in is in scope.

## Evidence

Checks and results follow here.
