# 06 — Spell flare

Status: ready-for-review
Type: prototype

## Scope

Revise the nine spell samples in `preview/cards/spell-effects.js`. The root task owns the scene, figure travel, figure exchange and shared ice and fire materials. Do not change game rules, fixtures, figure art or the interface.

## Plan and checks

1. Replace diagram marks with essence, mist, petals, sparks and mirror refractions. Give each spell a clear material and motion.
2. Use real scene feet and the shared event clock. Put ground effects below figures. Keep Control and Mimic as movement loans, Curse as an enemy move, and Firewall as army protection.
3. Check the module syntax and draw every legal fixture event in both layers. Check finite coordinates, balanced context state, endpoint silence and unchanged input state. The root task checks integrated still frames and playback.

## Direction

Spell samples use short lived material effects. Do not add arrows, connector rules, dotted routes, diagram glyphs, figure distortion, camera shake or screen flashes. A quiet continuation does not cast the spell again.

## Evidence

- The module exports `SPELL_IDS`, `SPELL_DURATIONS` and `drawSpell(ctx, scene, id, event, layer)`. It has no clock and does not draw or transform figures. Single samples last 1.7–1.85 seconds. Firewall and Mirror last 2.6 seconds in total.
- Sacrifice uses rising rose essence and falling gold fragments. Salvation uses rising gold petals. Morph uses a lilac cocoon. Control takes teal essence from the lending rook. Mimic uses paired pale fragments. Curse carries dark violet smoke with the enemy. Ice Wall gathers frost at the target. Firewall lifts embers at every friendly piece. Mirror splits the frost stream through reflective fragments, then joins it at the target.
- The root task retains figure exchange at `.35–.62`, legal board updates at `.62`, persistent material layers and the quiet continuation. Mirror draws no spell on its second event. Firewall only carries small embers with the second event.
- Pass: `node --check` on the new module.
- Pass: an assert-based self-check draws all nine legal fixture samples at 14 clock positions, in both layers and both board orientations: 616 draws. It checks finite draw values, balanced context save/restore, silent endpoints, silent Mirror continuation, and unchanged rule state.
- The integrated root browser check passes, and the spell contact sheet is inspected. See ticket 01 for the run. The owner's visual review stays open. No full suite, game build or deploy runs in this worker.

## Integration

Call the module once per layer. Call the over layer before moving actors to keep their silhouettes clear. Settled board figures are already drawn when this layer runs. Shared material functions retain the ice and fire after the spell ends. Read `SPELL_DURATIONS[id]` as the whole sample duration, including the quiet continuation.

The Control and Mimic donor is the friendly rook on a1 in their fixed legal fixtures. If those fixtures change, update that donor anchor with the fixture.
