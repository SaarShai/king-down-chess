# Melee strikes and victim deaths on the painted attacks

Status: ready-for-review
Type: task

## Scope

The painted attack banks now drive the body of Bishop, Paladin, Rook, Knight, Pawn, Ogre and Beast. The strikes were written for the older sprites: effects landed at the old weapon point, and most victims only faded.

## What changes

- `docs/2d-first-pieces/board/fx-melee.mjs` holds the new code. A captor stands so its painted weapon (`targetPoint`, measured for the Pawn) meets the victim at the painted contact frame, in each facing.
- Each victim has a death that fits the blow: Bishop cuts it in two, Paladin and Rook crush it, Pawn and Knight run it through and it falls, Ogre throws it, Beast takes a bite out of it and shakes it.
- A chain plays one painted attack per bite, with the turn between bites and the turn back from the last facing. A chain of more than one bite plays longer than before.
- `prepare` keeps a capture's start frames decoded. Before this, the selection's own loads could evict them, and a Paladin capture then played the old figure.
- The old sprite (no painted body) keeps its own timing and motion.

## Checks

Focused tests: `docs/2d-first-pieces/board/fx-melee.test.mjs`, `src/render/character-runtime.test.ts`, `src/render/scene-load.test.ts`. Browser check: `painted-game`.

## Limits

- A captor that faces S strikes toward the viewer: its weapon cannot reach far down the victim on screen, so it lands on the upper body or just above the head.
- The Queen's spin stays as it was. It plays only when her thorns cannot load.
