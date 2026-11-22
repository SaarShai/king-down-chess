# Rules round: three page repairs

Status: ready-for-human
Type: task

Source: the rules audit, sections 9 and 11 (lead brief of 2026-11-22). Web page `next.html` only.

## 1. Sky Lift: either piece first

Cause: `DraftTurn.options` and `armedMoves` read `m.from` only, and the engine lists each Sky Lift pair one time.
Repair: `turn.ts` also shows each Sky Lift or Morph pair from its second piece; `stage` turns that copy back into the
engine move, so the stored and sent action does not change. Maester swap, Firewall swap and Ogre push keep one direction.
Cases: `turn.test.ts` (both orders, Mirror as Sky Lift, Maester swap); browser check `next-skylift` (mouse 1280x800,
touch 390x844, both orders, Mirror, one stored action, Undo).

## 2. The 50-move draw in the solo page

Cause: `DraftTurn.open` took any staged step as "the game still runs". A free mark or a Haste step at count 99 makes
the engine status `draw50`, but the page accepted one more move or a pass. The engine and `game.ts` have no fault.
Repair: after a staged step the turn is open only while the engine status is `playing`; End turn then plays no pass.
Case: `turn.test.ts` (Freeze, Ice Wall, Haste at count 99: no more step, End turn, `draw50`, count 100).

## 3. Guide and Help text

False lines repaired: Death Touch check, en passant with a Darkness king in Classic, Strike and Flight "any piece",
"safe when the turn ends", the Powers-off preview rules. Limits added for the leads that a player meets. The Rule
sheet of a power or a card also shows its limits. Cases: `learning.test.ts`, `powers-ui.test.ts`, `help.test.ts`;
browser check `next-rule-text`.
