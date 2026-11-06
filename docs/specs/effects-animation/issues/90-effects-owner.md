# Effects owner pass

Status: done
Type: task

The owner (2026-11-06): "review what we have for effects (normal taking, card powers, king powers, etc.) and own completing and any missing ones and improving ones that need improving."

This request replaces the old limit in ticket 15, "Normal king powers do not gain card effects." King powers now play effects.

## Batch 1

- King powers play effects: `cardAction` no longer needs a dealt hand.
- Strike, Haste, March, Rally and Fire Starter keep the real walk, with material from `travel-material.ts` drawn over it (`move-overlay.ts`). Flight, Leap, Hop and Sky Lift are air moves.
- A figure change hides behind opaque material: promotion, Sacrifice, Morph. Nothing crossfades two figures. Salvation rises from below a floor line.
- Maester swap trades two orbs (`swap-orbs.mjs`). Castling walks the rook round the king. En passant strikes the victim's square.
- Always-on powers show only on a move that needs the power: Darkness and Mercy.
- Earth Quake and Burn are rebuilt. Freeze and Ice Wall gain a cast. Approved materials do not change.
- Freeze thaw lasts 1100 ms. Shelter marks and the check wash no longer cut in one frame.

## Batch 2

- Over a piece in his path, the Mercy king goes through the air with a small gold cloud. A plain step keeps his walk.
- During the hop, shelter marks fade as they do under a walk. The cloud under any air move grows and lets go, and does not pop.

## Batch 3

- A mated king ends as a painted lying figure (`king-*/fallen.webp`), for six kings and both armies. The swap happens behind opaque dust at the slam. If the art is not ready when the fall starts, he stays the rotated figure, so no swap shows in the open.
- A king on column a or h falls inward. White and black face opposite ways, so the rotation follows side and column.
- The scene draws the Queen's thorns from its own atlas, so `drawnEffects` stops her old package from loading. The package stays published.

## Limits

Card mode stays parked (`docs/PARKED.md`), so a player cannot reach the card-only effects.

## Checks

One look at game-size sheets per effect, with both armies, a flipped board, Fast and reduced motion once per family. `tsc` and the focused render tests pass (385). Batches 2 and 3 use focused tests and game-size sheets, with 16 ms frames at the swaps.
