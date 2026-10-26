# Wide painted material motion

Status: revised; see ticket 32 for current visual checks

## Plan and acceptance checks

- Cache source-colour masks and small painted texture cutouts for all eight assigned wide paintings.
- Move only their fire, dust, teal breath, lilac essence and small loose flecks. Keep figures, board and frozen impacts still.
- Draw the full 512 × 288 source first. Keep the idle loop at eight seconds, the awaken at 3.2 seconds with exact source endpoints, and reduced motion at the exact source.
- Check module syntax, draw-state balance, deterministic reverse seeks, temporal endpoints and draw-time canvas/pixel allocation. The parent owns browser and visual host checks.
- Add Sacrifice's existing crack light and small ivory dust, plus Back's source-gold sheen. Keep the previous six effects unchanged and compare their rendered pixels with the saved renderer.

## Source inspection

All six approved source paintings were inspected in full. Firewall is a fire wall behind a still ivory army. Earth Quake has a fixed heave with fine ochre dust. Burn has a bright courtyard wake. Fire Starter has a dark fortress wake. Control has a teal link between its adjacent ivory rook and knight. Morph has lilac light and ivory flecks around its already formed sculpture.

The new Sacrifice source has an ivory pawn shell around a rigid ivory rook. The Back source has a fixed gold crown and gold ornament over navy paint. Both new sources were inspected in full.

## Result

- `magic.js` exports all eight assigned IDs and `createEffect(id, image)` with the requested draw API.
- Source-colour cutouts provide each flame tongue, dust layer, teal wisp, lilac wisp and small loose fleck. All canvases and colour masks are cached at creation.
- The eight-second idle is periodic. Awaken fades in over 0.4 seconds and returns to the exact source at 3.2 seconds. Reduced motion always draws the exact source.
- Stable figure areas are masked after all material layers are drawn. No figure, board, camera or impact changes its position. No combat action is added.
- Sacrifice adds warm light within source crack paint and tiny source dust. Its ivory rook and all shell chunks retain their geometry. Back adds source-gold sheen and eight small source-painted glint patches at fixed positions. Its crown and ornament never move.
- The previous six renderers retain identical pixels at the seven sampled idle, awaken and reduced settings.

## Verification

- Syntax: `node --check` passes.
- `KINGDOWN_TEST_FILE='/tmp/kingdown-wide-magic.test.mjs' KINGDOWN_TEST_LOCK_WAIT=30 npm test` passes: typecheck, nine focused native Canvas cases and 51 existing painted-piece cases. This is a focused run, not a full Vitest suite.
- Each focused case checks exact awaken endpoints, reduced source equality, eight-second wrap, negative time wrap, reverse-seek equality, active visible material pixels, unchanged body sample pixels, caller state restore and no draw-time canvas creation or source pixel read.
- Native Canvas contact sheets were inspected at 512 × 288. Browser, host and owner taste checks remain with the parent.
- The ninth focused case compares the saved six-effect renderer with the expanded renderer at seven settings per effect. All 42 image comparisons are byte-identical.

## Review times and stable areas

Use idle at 1.35 and 4.4 seconds to compare the flowing paint. Use awaken at 1.1 seconds for the stronger material motion.

| Painting | Stable body samples in 512 × 288 coordinates | Motion to inspect |
|---|---|---|
| Firewall | Rook `(60,130)`, bishop `(124,145)`, knight `(178,135)`, pawns `(158,198)` and `(241,184)` | Tongues behind the army and at the right edge; rising painted embers |
| Earth Quake | Knight `(92,99)`, pawn `(429,140)`, heave `(255,176)` | Fine ochre drift, sparse chip edges and small existing crack glints |
| Burn | Ivory rook `(229,100)`, black knight `(367,140)` | Low courtyard fire wake and loose embers around the fixed impact |
| Fire Starter | Ivory knight `(221,90)`, black rook `(317,98)` | Long fortress fire trail and embers near the fixed rook |
| Control | Rook `(112,140)`, knight face `(277,89)`, base `(229,200)` | Existing teal breath between the two figures |
| Morph | Face `(262,85)`, base `(245,205)` | Existing lilac gaps and small ivory flecks outside the sculpture |
| Sacrifice | Rook shaft `(263,147)`, crown `(263,116)`, base `(262,211)`, pawn shell `(245,40)` | Existing warm crack light and tiny descending ivory dust |
| Back | Navy outside the ornament at `(20,280)`, `(490,280)`, `(100,280)` and `(400,280)` | A narrow source-gold sheen across the fixed crown and gold leaves; small painted glints |

## Current preview revision

The noticeability pass supersedes the initial amplitudes and the unchanged-renderer claims above. See `docs/specs/effects-animation/issues/32-motion-noticeability.md` for the final changes, independent findings, evidence paths and observation limits. Original artwork remains unchanged.
