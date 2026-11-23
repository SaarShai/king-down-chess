# Card cast finale

Status: ready-for-human (the owner approves the rendered frames)

When a card lands on the board, one short beat (440 ms) plays on the effect layer at the squares that the card changes. Each card family has its own beat, so a player learns the families by sight. The family table is `CAST_FAMILY` in `src/interface/play/cast.ts`; `cast.test.ts` fails when a card of the rules has no family (that card gets the rule beat).

| Family | Cards | Beat |
| --- | --- | --- |
| shift (a piece moves in a new way) | Strike, Haste, Flight, March, Leap, Mimic, Vault, Curse, Rage, RageB, Burn, FireStarter, Control, Rally | Hammered brass studs run from the start square to the landing square; a brass star glints at the landing. |
| trade (two pieces change squares) | SkyLift, FirewallB, MorphS | Two lines of studs cross between the two squares, one each way; both squares glint. |
| ward (a mark binds or guards) | Freeze, IceWall, Firewall (at the own king), Rescue | A brass ring with eight rivets closes on the square; a glint runs round it. |
| change (a piece comes or takes a new type) | Sacrifice, Salvation, Morph, MorphB, MorphP, Spawn, SpawnK, Spawn2, SpawnK2 | Gilt vellum flecks rise from the piece's foot round a fading gilt ground ring. |
| quake (pieces are pushed) | EarthQuake, EarthQuakeB | A limestone crack opens from the chosen square; stone chips fall from each pushed piece. |
| rule (no square changes) | Growth, GrowthB (Mirror and MirrorB play the copied card's beat) | A gilt lozenge pops at the start of the turn text. |

- Every form has the umber keyline of the board marks, so it reads on light and dark stone. Studs, flecks and chips are small; no form covers a piece for more than about 200 ms. At 440 ms the board is plain.
- The caster sees the beat at the landing (`animate` in `main.ts`). The opponent sees it in the opponent turn playback, offline (`animate`) and online (`playReply`), and in Replay, which animates the moves. A Haste or Rage plays it at its first move only (the second move has no card tag).
- A card that captures plays no cast beat: the capture beat wins its square.
- None: Undo, a reload, a hidden page, reduced motion (the app's Motion and the system setting; also when it comes on during the beat).
- A board tap, Undo, a new move or reply, a newer online revision, the game end, a new game and exit from the game end the beat at once. The turn coming back does not end it: in a solo game the turn comes back just after the computer's card lands, and the beat must show. A modal dialog (Menu) stops its drawing.

Frames: `PLAYABLE_OUT=<folder> node docs/specs/gui-cast/capture.mjs` (after `npm run build`): `cast-<family>-1280-strip.png` (40, 150, 230, 360 ms after the beat starts) and `cast-390-sheet.png` (230 ms). No released card is in the rule family, so it has no picture.
