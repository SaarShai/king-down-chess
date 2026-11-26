# The black Stratus NW turn join differs in one patch

Status: wontfix. The lead decided on 2026-11-26: no route plays this join, and the check now compares only the joins that a route plays. Open it again when a new route or rest facing plays `black-turn-W-NW`.

Source: ticket [10](10-red-by-name-checks.md), `stratus-registration`.

## Problem

- Two turn frames of the black Stratus king meet at NW: the first frame of `black-turn-NW-N` and the last frame of `black-turn-W-NW`. They must be the same picture. They are not.
- The alpha is the same. One patch of about 10 × 19 px (x 188-197, y 244-262, an orange cloth corner under the robe) has other colours. The largest channel difference is 80.
- Before commit 10dc57004 ("Ship the wrap-up walks and all colour picks", 2026-11-05) the patch is the same in both frames. The colour picks recoloured each source frame by its hash, and the two NW sources have different hashes.

## Red assertion

The old form of `tools/verify-stratus-registration.mjs:21`, `${army} endpoint pixels differ`, for black NW. The check now compares only the joins that a route from the rest plays, so it is green (ticket 10).

## How a player reaches it

- Not today. The runtime turns only from the rest facing, SE (`src/render/painted/character-runtime.mjs:415`, `:477`). No route from SE plays `black-turn-W-NW`.
- A new route from another facing shows it: a new rest facing, or a turn chain for the Stratus king (today only the Beast makes a chain, `src/render/painted/scene.mjs:1315-1317`). The patch then blinks for one frame at the NW join.

## Evidence

- A probe of the check's pixel compare on the shipped package: of the 16 ring joins of both armies, only black NW differs.
- The picked source PNGs are not on this Mac, so an art repair needs the pick pipeline again.
