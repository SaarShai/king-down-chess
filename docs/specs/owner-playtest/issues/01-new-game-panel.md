# One New game panel

Status: resolved

The owner's playtest feedback (`runs/review/owner-web-playtest-handoff.md`, section 2) asks for this change. The lead's decisions 88 to 93 set the design.

## Result

One New game panel serves Computer and Person. The hero opens that panel. The separate person row and game choice are removed.
The panel keeps its history layer and focus return. It stays outside the home page root.
Pieces, powers and cards have separate sections. Each checkbox changes only its option.
The pool keeps at least seven pieces. The preferred king returns when cards go off.
Pick four needs four cards. The level slider supports tap, drag and keys. Reduced motion gives still fills.
Sign-in keeps the options and the exact local deal. Both invite paths carry the supported server options.
The person army picture says Example army: the online game draws from the chosen pool.
The options key keeps the next-game preference. The repair binds each accepted king to its game and seat.

## Checks

- Model, online options, menus and game boundary: 52 tests pass.
- Three selected invite-page tests pass (`Send a link:`, `Play again:` and `a failed copy` in people/screens/pages.test.ts). The final full run also passes all 29 invite-page tests.
- Full suite: 6,999 pass, 2 fail and 385 skip. Both failures are in unchanged saved.test.ts: the old cards label at line 121, and cards-only resume at line 309. The lane brief leaves these base faults to the lead.
- Documentation: 195 pass and 1 existing skip. Type checks and build pass.
- Browser: 12 S1 cases pass. These cover all four computer games, options, touch, slider keys and drag, still motion, email return and provider return.
- Existing menu checks: panel and panel_refresh pass at all four required sizes (8 cases).
- Screenshots: 35 panel, game and lab views; 12 menu and refresh views. The build output folder holds them.

## Handoff

Lane S2 owns the in-game manual arrangement and online seat choices. No server change is needed for the fields in this lane.
The level lab is outside this repository at labs/level-slider/index.html. The game uses A (decision 107).
Account checks use stand-ins. No live account or live invitation is used.
Browser scripts use port 5441 directly; the standard wrapper selects another port.
The focus filter uses file patterns. The brief's `KINGDOWN_TEST_FILE=none` command selects no tests in this checkout.
The full next-save browser check is not run. Its panel entry and game-choice selectors are updated.

## Merged repair

Each pending invite keeps the accepted legal king for its account, game and seat. Both invite paths and the joining seat use that binding; the next-game preference stays separate.

[Ticket 05](05-merged-repair.md) records the shared state and layout repairs and their final checks. It supersedes the base-fault limits in this lane report.
