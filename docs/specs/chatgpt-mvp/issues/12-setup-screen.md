# 12 · The setup screen

Status: resolved
Type: AFK
Size: M
Blocked by: 11

## Scope

- The five toggles with their visibility rules (Arrangement shows only with Fairy on; Classic in the same place with Fairy off), the one-line texts, the defaults and the remembered last choices (spec Q7, Q26).
- The pieces "all" sheet (locks at 7), the cards "all" sheet (locks at 4).
- The king coin and its sheet (six kings, then two powers; only always-on powers with Cards on); the coin shows the chosen king's emblem.
- Colour (White, Black, Random) and, against the computer, the level.
- Start calls `kingdown_create` (computer, friend) or `kingdown_find` (random).

## Acceptance

- Browser check: each toggle mix starts a game whose view matches the choices; the locks; the cards-on power filter; remembered choices after a remount.

## Notes

- Reuse the web New-game data model and texts (`src/new-game.ts` `Pick`, `powerOptions`, `POWER_NAME`) where they fit; the page must not import web-only modules (explorer note D §4).

## Plan and checks

Base: local claude/chatgpt-mvp at 1a2b0ecc. The ticket 10 merge and both ticket 11 parts are present.

1. Test the pure setup model one case at a time. Check defaults, old settings, hidden toggles, pool locks, card locks, power limits and start arguments.
2. Fill the setup stub. Reuse game styles and art. Export the king sheet for ticket 14. Save last_setup before Start. Use the shared Start and route functions.
3. Add setup checks in one browser block. Check real views, remount, lost Start replies, locks and all controls at 360, 390, 400 and 1440 px. Compare the five sample states at phone and desktop size.
4. Run npm test, all browser checks, both named plugin checks and plugin:server:check. Record page bytes. Commit, merge the current local integration tip, test again and push.

Test seams: the public pure setup model and the app page through the shared harness. Checks use the disposable kingdown_mvp12_test database on 127.0.0.1:55432. Shared page and server files stay read only, except the setup section and the setup check blocks.

Ticket 10 keeps the initiator's king only in last_setup.king. Create and Find do not take a king. Choose is refused while waiting. The seat screen uses last_setup to prefill it.

## Model check point

Four red-to-green steps cover the defaults, old saved choices, toggle and pool limits, and the card-safe king and solo choice. npm test passes 2,298 tests in 151 files, with 8 skipped. The art tests and type check pass. The app check starts with the empty setup stub.

## App check point

The setup page and its three sheets work. Red checks catch an empty stub, an All button that is too wide, a lost Choose reply that stays on setup, and an unchanged king sheet that saves a pick. The fixes pass. The rows keep their text and the footer stays fixed.

The unit run passes 2,298 tests, with 8 skipped and all 50 art tests. Both named plugin checks pass. The built server check passes all 101 art files. The first all-browser run passes 23 of 24 checks; the website Turn check times out at the keyboard End-turn case. No website file changes. The latest layout and safe-inset checks follow the integration sync.

The current local integration tip adds a newer pending and mount recovery contract. The next step merges it, removes the old setup recovery path and checks the current page again. Status stays claimed until these checks pass.

## Result

The setup page has the modes, four levels, colour, five toggles and three sheets. It uses the game styles, fonts, sprite and art. Start saves all five last_setup fields, then sends the same choices through the shared Start function. A handle stop keeps these choices. A solo king-only game starts at once. Arrangement keeps the seat step. The initiator of a waiting game keeps the king in last_setup.king; Create and Find take no king, and Choose is refused while waiting.

The pure model is in src/plugin/screens/setup-model.ts. It exports SetupState, readSetup, setupOptions, withToggle, withPiece, withCard, pieceLocked, cardLocked, availablePowers, cleanKing, shownKing, createArguments and soloChoice. Ticket 14 can use cleanKing with the game's options and seat colour. It keeps null as no pick. It moves a power with uses to the same king's always-on power, else the colour default. The DOM module exports kingSheet(options, pick). It returns a promise for the pick. It returns the input object when nothing changes, so a mere inspection does not save a king pick.

The branch merges local integration tip f63606e3. Setup uses its safe pending fields and shared retry path. Page memory tracks its own calls. A restored solo Start completes its choice after the shared mount routes to the seat step. The screen builds its controls even when the restored draft already exists. Sheets close when their page changes. Card words use the new game's rules, with or without king powers.

Checks on the final code:

- npm test: 2,306 tests pass in 151 files; 8 skip. All 50 art tests and the type check pass.
- npm run check:browser: 24 of 24 pass. The earlier Turn and Painted-game timing failures pass on the final run. Website source files stay unchanged.
- The final named run passes 3 of 3: Painted-game, plugin-ui and plugin-ui-http. Both plugin hosts pass the setup block. It checks 16 legal toggle mixes, all levels, seat defaults, the real painted board, weighted piece locks, card locks, power limits, remembered choices, handle Save, Find with another game's options, lost Create and Choose replies, remount, the next setup, delayed settings, and sheet cleanup.
- Both hosts check 360, 390, 400 and 1440 px, safe insets, 44 px targets, text inside each row, scroll access, and Start and Done above the composer.
- plugin:build and plugin:server:check pass. The compiled HTTP and PostgreSQL flow passes on kingdown_mvp12_test. All 101 art files pass: 72 WebP, 1 PNG, 24 SVG and 4 woff2.
- node tools/plugin-ui-build.mjs: 546,651 HTML bytes; 548,933 resource payload bytes. The standalone server resource is 548,698 JSON bytes. All stay below 1,000,000 bytes.

Look checks: 20 PNG pairs, sample left and page right, for the five states at 390 x 844 and 1440 x 900 in both hosts. They are outside Git in /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-look/12.

Kept differences:

- The shared frame has the required spaced Play back control. The local host has a Remount control and reserves the composer area; the reference paints the host header and composer. These belong to the shared frame and host.
- Rows grow with their text. Buttons and level segments have 44 px targets. The body scrolls, so fewer rows can show at once than in the clipped sample. This follows the brief's phone fix and touch limit.
- Names, counts and rule words come from the current game helpers. Defaults come from Q26. The pool note says 7 pieces, and the lock sample uses four kinds that supply seven pieces. The reference's seven-kind locks do not follow the rule.

Gaps in the shared contract:

- Create and Find have no command receipt. Recovery reads Games before a resend, then uses the shared board read and retry path. No new tool is added.
- Choose replies omit the full rules. Setup reads the board before it opens a newly started game. Ticket 14 needs the same full read after Ready starts the game.
- The shared mount can route a completed Start before the setup caller returns. The setup module handles its restored solo choice in its own file. Shared page files stay unchanged by this ticket.

Open item: none in ticket 12. Ticket 14 owns the seat screen. Deployment and a live ChatGPT host check stay outside this ticket.
