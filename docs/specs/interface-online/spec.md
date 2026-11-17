# Online play and the home

Status: ready-for-human

## Source

The owner orders this build in `runs/launch/online/scope.md` in the design project.
Decisions 63 to 72 set the home, board and online scope.
The approved labs set the visual target. No publish occurs.

## Scope

Use the existing account and match clients. Join the People controller and screens.
Use one game screen for computer and person games. Keep local play when signed out.
Keep online drafts, receipts and game rows by account. Show the server turn and deadline.
Add the chosen home picture, game rows, portraits and corner coordinates.
Keep old page defaults. Add no dependency, server change or database change.

## Limits from the current service

Named invitations stay parked. The old page has no client entry for them.
Opponent views have an icon and a name, but no service picture address.
Use a service picture where the account client supplies it. Else use the initial.
The opponent-photo requirement stays open. A null field does not complete it.
The report records these limits and each check.

## Checks

See [ticket 01](issues/01-online-and-home.md).
Run related tests during the build. Run the full tests, document tests and build at the end.
Check five sizes in Chromium with a local protocol fixture and two player contexts.
Keep logs and pictures in `runs/launch/online/` in the design project.

## Build record

The implementation joins the repaired People files. The stage report holds verification.
The working tree stays uncommitted. The independent check follows this build.
