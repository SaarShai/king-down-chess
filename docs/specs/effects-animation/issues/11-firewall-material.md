# Firewall: living fire material

Status: needs-info
Type: task

## Request and scope

Owner: “fire wall - not good. doesn't look like fire at all. you can do better than that!”
Rebuild Firewall only. Keep the figure clear. Keep the public draw API and the shared material phases. Do no combat work. Preserve all other effects. Work stays in this isolated worktree.

## Plan

1. Replace repeated flame icons with one turbulent fire mass on each side of the figure layer.
2. Inspect the signal and card previews at a 430 px board width. Refine the fire until its still silhouette, heat and colour read clearly.
3. Publish early PNG evidence and the ready file. Then finish focused checks and record the result here.

## Verification criteria

- Both preview URLs load with no HTTP or browser errors.
- Back fire stays behind figures. Front fire stays low at the centre. Outer flames curl upward within the local footprint.
- Formation, hold and expiry differ. Expiry ends with embers, then clears.
- Equal progress and seed give equal pixels after backward seeks. Different seeds vary the material.
- Both board directions, fixed reduced motion, and the moved ward in the card context stay clear.
- Imports and build syntax pass. Multiple wards remain responsive.

## Evidence

The rebuild is ready for owner review. The owner has not approved this revision.

### Change

Replace all repeated flame paths and the orange ring with a warped heat field. Hot roots merge and split into rising tongues. Red fringes stay translucent. Sparks rise at the outer sides. A low front and a taller back keep a clear pocket for each figure. Formation raises the fire. Expiry lowers and fades it, with dying sparks.

`materials.ts` changes only Firewall and its import. The new `fire.ts` helper owns the fire texture. It caches each fixed seed and state, so the quiet card ward does not recompute each frame. Freeze, Ice Wall, shared state and their helpers stay unchanged. No combat work.

### Visual review

I inspect the full canvas and the 430 px boards: formation, two hold frames, expiry, flipped boards and reduced states. The new fire reads as fire in a still. The figure stays clear. The card result shows the ward round the moved rook on d2.

Ready source and evidence: [FIREWALL_READY.md](../preview/signals/FIREWALL_READY.md).

Evidence root: `/Users/za/.codex/visualizations/2026/10/23/01a168fe-8505-7842-89a3-dd078bd311a1/effects-wave2-agents/firewall-evidence/`.

### Check result

- Both preview URLs: 430 px displayed board, 960 × 1024 canvas, both directions, no HTTP/browser/window errors.
- Ten timeline samples per preview. Exact canvas equality after backward seeks. Fixed reduced states stay pixel equal.
- Replay starts, advances and pauses. Card result: a2 clears; the rook and ward reach d2.
- Direct material checks: seed and time vary the pixels; equal inputs reproduce them; formation differs from hold; both endpoints clear.
- Three moving material states with both layers: median 4.9 ms per frame, p95 5.4 ms in the local browser.
- `npm run typecheck`: pass.
- Direct TypeScript check with `--ignoreConfig --noEmit --target es2022 --module esnext --lib es2022,dom --moduleResolution bundler --skipLibCheck` on `materials.ts` and `fire.ts`: pass.
- `checks.json` holds the full focused report. `check.mjs` holds its assert-based browser/material check. `firewall-430.mp4` holds 120 timeline frames over 4.8 s.

The combined root check and full game suite are not run. No game code or rules change. No commit, PR, deploy, dependency install, credential access or other agent run.

## Owner review

The owner reviews the rebuilt Firewall and Guard and says “both look great”. Keep this material as the approved local sample. The combined workshop check passes after integration. Production integration is a separate task.
