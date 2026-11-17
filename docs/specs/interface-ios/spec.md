# The iOS shell of the launch build

Status: ready-for-human

## Source

Launch decision 39 defines this stage. The parallel iOS copy holds the work.
The Capacitor shell in `ios/` loads the new page of the launch build. The stage builds the app
for the simulator, starts it on an iPhone and an iPad simulator, and records what it sees.
It changes no file in `src/interface/play/` or `src/interface/ui/`. It lists what they need.

## Plan

- Use the launch switch of [the launch platform](../interface-platform/spec.md): `KINGDOWN_SOLO_LAUNCH=1`.
  The app router reads the same marker as the host. `/` opens the new page. `/play`, `/g/<id>` and `/j` open the old page.
- Read the empty path of `capacitor://localhost` as `/` in the new page.
- Give the web view the swipe from the edge as the browser Back.
- iPhone upright and on the side. iPad in all four orientations. Light style only.
- The launch image and the web view colour are the page colour of the new page. No link preview.
- A debug build opens one start address from a launch argument, for simulator checks.
- Remove the focus ring from the heading of the platform message. The play home does the same.

## Acceptance

Each new rule has a test that fails without it. Full npm test, docs and build pass.
The simulator build starts on both simulators. A browser checks the touched flows at 360x640, 390x844 and 1440x900.
The report lists the needs of the play and ui folders and the owner's App Store steps.
