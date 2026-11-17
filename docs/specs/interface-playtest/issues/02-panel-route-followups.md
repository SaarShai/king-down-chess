# New game panel: five small route and focus faults

Status: ready-for-agent

Priority: Low. None blocks a release. Source: the two reviews of PR 362 and
the lead's gate 7 diagnosis (`runs/launch/release/followups-362.md` in the
workspace folder). Items 1 to 3 were there before PR 362.

The owner playtest branch (`owner-playtest-1`, lane S1: one New game panel)
does not repair any of the five. It changes one fact for item 3: on an empty
Play, the large New game (`.home-hero-new`) replaces Change as the opener.

## Faults

1. **Address edit with the panel open.** The player edits the address while
   the New game panel is open. The layer history entry of the panel stays.
2. **Native Back race.** A native browser Back arrives while a layer Back is
   still pending. The two Backs can race.
3. **Focus fallback for an unknown opener.** On close, the focus goes back
   only when the opener is one of the known Play controls
   (`src/interface/play/main.ts:374`). An opener of another kind gets no
   fallback; the focus goes to the body.
4. **The Start click block stays after Back.** Start blocks page clicks for
   `--dur-sheet-in` + 300 ms (`begin()`, `src/interface/play/home.ts:356` to
   `:361`). The player leaves the game with Back in that time: the block
   stays, and a tap on Play is lost. Repair idea: remove the block when the
   route leaves the game, or block only the area of the closed panel.
5. **An open in the close window.** The guard in `newGameLayer`
   (`src/interface/play/main.ts:345`) drops an open request that comes
   between `dialog.close()` and its `close` event (a very short window). The
   next press opens the panel.

## Done when

Each fault has a repair or a recorded decision to keep it, and a browser case
in `tools/verify-next-menus.mjs` (or a unit test where no browser is needed)
shows the repaired behaviour.
