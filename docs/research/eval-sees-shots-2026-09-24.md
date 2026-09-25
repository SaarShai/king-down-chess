# Does static eval need a shot or shove bonus? (2026-09-24)

> Recovery status, 2026-09-24: Source-time explanation. Search can see special-move material, but this is not a completeness or strength result. [Catalog and qualifications](../cursor-recovery/2026-09-24-0213b442/RESEARCH.md) · [Adoption record](../cursor-recovery/2026-09-24-0213b442/EXECUTED.md).

Context: Archer static eval is material **505** plus a piece-square table, with
no shot-target term. Ogre static eval is material **318** and a zero
piece-square table, with no shove-target term. Beast keeps its small
adjacent-enemy bonus (10cp, cap 18) and has no chain-length term — leave it.
A 24-game depth-2 sketch still saw about **3.42 shots** and **1.50 shoves** per
game (`docs/research/shipped-balance-2026-09-24.md`). This note asks whether
those verbs need a new eval term. It does not change values or add one.

## Finding (search)

In `src/ai/search.ts`, the main search builds legal moves with
`genLegal(..., 'all')`, which walks the board through `genPiece` and then
applies each candidate with `apply` / `undo` before scoring the child. An
ordinary capture is a move whose `captures` list names the squares to clear;
`apply` writes those squares to empty, so the next position’s material count
already reflects the take. An archer shot is the same shape: the generator
emits `to === from` with the victim in `captures`, and `apply` clears that
victim the same way — so a shot is a searchable move and the material change
is visible on the position the search evaluates next. An ogre shove is also
emitted as its own move (`captures: []` plus `shove: { from, to }`); `apply`
relocates the shoved piece (and under shipped `push` lands the ogre on the
vacated square). A shove removes nothing, so it does not change material by
itself, but it is still a move the search can pick for whatever the child
position scores. Quiescence only asks for `captures` mode, so shoves stay out
of Q-search; shots, as real removals, are in that set.

## Conclusion

Do not add a shot or shove bonus. Shots already earn their keep through
ordinary material once the search plays them. Shoves already appear without a
shove-target term (traffic above). Either bonus would be a new value with no
measurement behind it.

On `8/4NKN1/4P1P1/4gNP1/3O4/8/8/6k1 w - - 0 1`, depth 1 plays Ne7-d5 and
misses the winning shove Od4>e5-f6; depth 2 plays the shove, and the king then
takes the trapped guard. That gap is capture-only extension not looking at
shoves — not a reason to add a bonus. The game's computer is not limited to
depth 1.

At depth 1 the search will take a free archer shot such as Ac3*c5, but it
still misses the winning shove above. The difference is simple: a shot is a
capture, so material changes right away; a shove is not a capture, so it does
not.
