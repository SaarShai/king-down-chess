# Five held-back attack banks

Status: ready-for-review

## Plan and checks

- Test frame removal and retiming at board size and normal speed. Keep each contact time and duration.
- If needed, test alpha midpoints or the approved Queen colour adaptation. Check each new frame's alpha.
- Record a contact sheet, board preview and verdict for each bank. Replace exact catalog hashes and pin the ready selections.
- Build and verify the runtime. Run relevant tests and registered capture checks. Open a PR; do not merge.

## Draft result

A local draft removes the flagged frames and splits their time between the adjacent frames. The Queen banks keep release at 380 ms and duration at 800 ms. Both Beast banks keep contact at 345 ms and duration at 760 ms. The 88 distinct retained frames pass the alpha check. The draft uses no new character frames.

The orchestrator looked at the board-size contact sheets and the timed videos at normal speed and accepted all five drafts. Each video shows the recorded timing on light and dark squares at about 170 px figure height. The still sheet alone is not a motion review; the owner's orchestrating session supplied the motion verdict.

## Adoption

The frozen catalog is not in Git. It lives in the main checkout at `docs/specs/character-animation-samples/preview/consolidated-animations` and the selection pins its SHA-256. The main checkout is read only for this session, so the replacement ran on a byte-identical copy of that catalog in the run folder, under the copy's own catalog lock. `tools/replace_animation_selections.py` froze the five new banks, their source manifests, the report, the evidence and a new catalog snapshot. The new catalog SHA-256 is `8c3919af2217a8a9413a9271d136a5e8be2cdff299069dc8386354e39ec8af3f`; the copy starts from the published catalog `54abc4ff79287f536d2678ec110f86cdad8213a671d4bbaa7f0196869bb0c4fd`. Entry count stays 748: ready banks go from 468 to 473 and repair banks from 12 to 7. No other row changes.

`runtime-selection.json` takes every hash from the replaced catalog bytes; no hash is typed. It pins the new catalog and adds the five banks. It now holds 473 entries. Queen white attacks are 8 of 8, and both Beast armies have 8 of 8 attacks.

| Bank | Old bank SHA-256 | New bank SHA-256 | Frames | Removed | Retimed |
|---|---|---|---|---|---|
| Queen white E | `f5fe53a29151f8c91ce14d060f9a1036a0a17420e60b71dfe23c214dec748299` | `8c3a817ac1ea11d8f758439f10a985c2ea193ca7eb5d12aab1926bed78eeac22` | 27 to 26 | 9 at 230 ms | frame 10: 255 to 242.5 ms |
| Queen white N | `5612c56fe0a80e922999d3e9298d99733f6c39691226e11a04bfc87609a1bb10` | `f5bf9f25ffc0764aa3487756245696d0878a4fb28b4a3accc8e69f2461790c52` | 24 to 22 | 5 at 185 ms, 14 at 480 ms | frame 6: 217.5 to 201.25 ms; frame 15: 500 to 490 ms |
| Queen white SW | `92af995b876ce967bfb176843d88f25c175c05240247887ee97dc35b367faa1d` | `06931788bb1fea9511d8367f7d3f1993d10699ebdccaabce0811c9980205e374` | 21 to 20 | 12 at 480 ms | frame 13: 500 to 490 ms |
| Beast black NW | `92cbe5be27dbfea92b926300b6104d3b120a056305e007fae7d02184768919aa` | `a1058a6745a15c30a0b56f0db79b2d338ed0d80e39f76f01e751299fef98acb4` | 27 to 25 | 2 at 55 ms, 24 at 675 ms | frame 3: 82.5 to 68.75 ms; frame 25: 717.5 to 696.25 ms |
| Beast white NW | `3dd0b47801d82a3f187ea1bb3e7178edc58ed6d0da681cd73f02433fefbdbe81` | `4226489f2f36523e5454054395f08c25441e8a0c2e9cab444de8a59fdceaa301` | 27 to 25 | 2 at 55 ms, 24 at 675 ms | frame 3: 82.5 to 68.75 ms; frame 25: 717.5 to 696.25 ms |

The first frame, the last frame, the duration and the contact or release time stay exact. The replacement tool also checked the alpha of every retained frame against `tools/validate_animation_alpha.py`.

## Runtime

`node tools/build-character-runtime.mjs --source <catalog copy> --output public/character-runtime` builds 473 banks and 5,313 assets. The package is 521 MB. Its manifest SHA-256 is `f11e5032f795757021b78415a942fffec2b94a2a5dcd40b65cc30e551454e3ab`. The five banks keep these timings in the runtime: Queen 800 ms, release 380 ms, 26, 22 and 20 frames; Beast 760 ms, contact 345 ms, 25 frames. Queen white, Queen black, Beast white and Beast black each have 8 of 8 attack directions.

## Tests and checks

`KINGDOWN_TEST_FILE='**/{character-runtime-package,animation-replacement}.test.ts' npm test` passes: type checks, two selected test files and 67 board checks. This is a focused run, not a full suite pass.

`npm run check:browser character-runtime` runs `tools/verify-character-runtime.mjs`. It passes in 75.7 seconds over 23 game cases: both armies, a flipped board, the ready cast, the king designs, turns and joins, effects, cancellation and Undo. The log is `ok ready game character bodies: 23 cases`. This check does not play the five new banks in the game. Their frames, timings and canvas come from the build checks and the runtime manifest, not from a live clip.

The new package adds exactly the five banks to the current 468-bank package. A manifest compare shows no other bank change and no removed bank.

## Open problems

- The owner or the parent must replay the same replacement on the main checkout catalog, or copy the run folder catalog there. The pinned hash matches only that catalog. Until then, a build from the main catalog fails its pinned hash check.
- The generated package is local only. It is not committed and this task does not deploy.
- PR CI remains to run. No merge.

Run evidence is in the `five-attacks` scratch folder: `checks.json`, `acceptance.md`, the contact sheets and videos in `media/`, `catalog-manifest.before.json`, the replaced catalog, `build.log`, `test.log` and `browser.log`.
