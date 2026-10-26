# Wide card motion: air and mist

Status: all seven effects ready for integration checks

Own `air.js` only. The source art, host, manifest and shared checks belong to the parent task. Ticket: `docs/specs/effects-animation/issues/31-wide-card-animation.md`.

## Plan and checks

1. Read the source paintings and prior source-painted studies. Add Rescue from its revised source and Mirror from approved revision 4.
2. Cache source-colour masks, soft paint textures and the Sky Lift rock plates in `createEffect`. Draw a full stable base each frame. Add local material motion only.
3. Check syntax and the draw contract without a browser. Report useful fixed times and stable regions for the parent's visual and pixel checks. Browser checks and servers wait for the parent.

Acceptance: seven lower-case IDs, including Rescue and Mirror; 512 × 288 output; deterministic 8-second idle loop; exact source at both 3.2-second awaken endpoints and under reduced motion; no per-frame pixel reads, canvas creation or random state. Keep towers, figures, the rook, ice barrier, knight, arms, hands and cards fixed. Move source-painted snow, vapour, water, wind and cloud shapes; visibly raise selected detached Sky Lift rocks.

## Source

The parent confirms Salvation is the approved CalledHome painting: the living valley is above the ruined realm in the cyan chasm. The original source stays read-only.

Mirror uses the owner-selected revision 4. The navy and gold card back faces the camera. The ivory frost reflection and right fingers stay behind the blue glass; the right wrist crosses the liquid boundary.

## Material motion and review frames

All times are idle seconds. Compare `0.8`, `2.4`, `4.8` and `6.8`; the loop returns at `8`. Check awaken at `0`, `0.8`, `1.6`, `2.6` and `3.2`.

| ID | Visible material motion | Keep still |
| --- | --- | --- |
| `icewall` | Source ice glints cross facets. Source snow drifts down and left. Three low source snow/mist regions flow. | Ice wall contour, arrows, flag and mountains. No impact or projectile animation. |
| `skylift` | Four detached source rocks rise by 27–35 px over each cycle. Source wind sweeps and warm cloud banks drift. `0.8` and `2.4` show the largest rocks in different parts of their rise. | Both tower bodies and all ground landmarks. Source-colour tower masks restore the stone over the wind. |
| `mimic` | Four upper painted cloud banks drift by 15–21 px per cycle. Existing ground moonlight travels in soft bands. The shadow darkens locally and gently. | Hood, cloak, body and the shadow silhouette. No horse anatomy, reach, rearing or cloth deformation. |
| `salvation` | Four cyan source mist regions rise through the chasm. Existing turquoise edge light travels upward. | Ivory rook, ruined towers, chasm walls and landscape. No rook lift. |
| `curse` | Five purple source wisp crops flow low around the base. Source purple light follows the existing haze. | Complete ebony knight and base. A fixed source silhouette covers the moving mist. |
| `rescue` | Five source water crops ripple around the arm. Source lake mist drifts, frost flecks fall and eight light bands cross the existing ice facets. Compare `0.8`, `2.4` and `4.8` for the water changes. | Hands, grip, both arms and all ice contours. A fixed source layer covers the exposed human arm. |
| `mirrorb` | Five soft source glass-wisp crops drift within the mirror. Existing wrist-boundary sheen and frost-branch light travel in small bands. Three source candle highlights shimmer. Compare `0.8`, `2.4` and `4.8`. | Both hands, wrists, navy card back, ivory reflection card and ornate frame. Fixed source masks cover the reflected card, fingers and frame ornament. No card extraction or whole-mirror pulse. |

## Evidence

- `node --check docs/specs/effects-animation/preview/card-art/wide-review/motion/effects/air.js` passes.
- `/tmp/air-contract-check.mjs` passes for all seven IDs. It uses real 512 × 288 source pixels and a recording canvas context. Idle `0`, `8`, `-8` and `16` have equal draw traces. A seek to `2.4` gives the same trace after seeking to `7.1` and `0.3`.
- Awaken `0`, `3.2` and times outside the duration draw the source only. Reduced idle and awaken draw the same source-only trace. Each draw balances `save` and `restore`.
- No canvas creation or pixel read occurs during those draw checks. All cached textures have nonzero coverage. Texture count, including the source: Ice Wall 15; Sky Lift 20; Mimic 12; Salvation 14; Curse 8; Rescue 18; Mirror 18.
- `/tmp/air-offline-render.mjs` reconstructs the image draws with the existing Sharp dependency. The seven `2.4` frames are inspected at 512 × 288 in `/tmp/air-frame-<id>.png`. They retain source colour, fixed composition and soft material edges. This is a bounded mask/raster check; the parent owns actual browser motion and final pixel checks.
- Rescue's offline `2.4` frame keeps grip core `[203,84,8,13]` and forearm core `[278,192,13,15]` byte-identical to the prepared source. The water region `[155,215,245,48]` has 6,622 pixels with a channel change above two levels.
- Mirror's offline `2.4` frame keeps navy card core `[193,116,16,33]`, left hand `[154,156,12,12]`, reflected fingers `[323,135,10,10]`, right forearm `[391,194,12,11]` and frame ornament `[312,213,15,10]` byte-identical to the prepared source. Glass air `[288,67,56,31]` has 159 pixels with a channel change above two levels.
- `/tmp/air-preservation-check.mjs` compares the six pre-Mirror renderers with the new module. Every cached texture byte and all 24 sampled draw traces per effect match. The six offline `2.4` PNG hashes also match. Mirror is an added branch; the six prior effects keep their behavior.
- No browser, server, dependency, image API, source art change or commit is part of this work.

## Current preview revision

The noticeability pass supersedes the initial amplitudes and the unchanged-renderer claims above. See `docs/specs/effects-animation/issues/32-motion-noticeability.md` for the final changes, independent findings, evidence paths and observation limits. Original artwork remains unchanged.
