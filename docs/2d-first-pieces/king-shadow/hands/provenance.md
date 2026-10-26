# Painted Shadow hands

The original five-pose, two-army PNG is generated with the built-in ImageGen tool on the owner’s ChatGPT plan. The original Shadow king is a style reference only. The original king and smoke are unchanged.

The source PNG has ten complete paintings: open, reach, half-clutch, clutch and retract; ivory above, charcoal below. `prompt.txt` holds the exact generation prompt. Source: `/Users/za/.codex/generated_images/01a17186-f895-7b93-a078-cd76f1c98ee0/exec-a2095269-1a11-4753-afdb-3f4e9052db00.png`.

## FILM motion

The owner asks for FILM smoothing. `build-film.py` uses the existing local FILM SavedModel at `/tmp/kingdown-film/weights/film-1`, through `/tmp/kingdown-film/venv/bin/python`. No API or dependency changes are used. FILM predicts half-time frames, so four recursive levels create 16 intervals between each adjacent painted key. Each army has 65 complete RGBA frames. Source keys use measured windows and wrist pivots, then share a 192 px cell with wrist at (96,176).

FILM returns RGB and forward/backward flow pyramids. Original alpha follows the finest flows: pose A uses backward flow/2; pose B uses forward flow/2. Alpha combines after spatial alignment. Synthesized RGB is uncomposited from a neutral grey matte with that alpha. There is no chromakey and no unwarped key cross-fade. The stored atlas retains transparent gutters and dark charcoal bone.

`film-build.json` records model path, source/output hashes, inference count, registration measures and the numerical warp check. `audit-film.py` independently checks all normalized key frames, gutters, dark opaque pixels and both model warp outputs. Results: `film-audit.json`. `film-alpha-review.png` shows the keys and intermediate frames over both stone colours.

The original ten painted keys remain intact. Runtime uses 65 FILM RGBA frames per army in 192 px cells, with alpha carried by the actual FILM flow fields as described above. Each hand draws one complete frame through its fixed crevice anchor. This is frame interpolation, not an articulated finger rig. Intermediate frames can show softer painted detail in close-up than the original keys.
