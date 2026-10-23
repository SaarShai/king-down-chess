# 12 — Guard shield material

Status: done
Type: prototype

## Scope

The owner rejects the thin bronze Guard flanks and asks for a complete material revision. This is authorized local sample work. No combat animation. Keep the production shield, red crown and rule text: only a king can capture the Guard.

Own `drawGuard` and its private helpers, the Guard description, Guard tests if needed, and this ticket. Preserve all other samples and shared controls. No commit, deployment or new dependency.

## Plan and checks

1. Inspect the rejected image and the painted Guard on the served page. Save source baselines for the four other state effects.
2. Form a broad spectral forged shield over the lower body. Use a dark metal surface, thick bevel, one moving highlight and sparse onset sparks. Keep the face and square clear. Settle by progress .65.
3. Inspect onset, hold and reduced motion on a 430 px board in both directions. Compare backward seeks and quiet frames at .7 and 1. Check finite values, draw balance, immutable inputs and stable reduced frames through the focused state test.
4. Save board PNGs and a short video if available. Check browser errors and targeted TypeScript. Prove the other four state effects keep the same source. Write `preview/signals/GUARD_READY.md` with copy paths and evidence.

## Progress

- Read the project rules, open tasks, lessons, effects spec and Ponytail skill.
- Inspect `/tmp/kingdown-state-flare-review/guard-0.22.png`: the flanks read as a thin gold outline at board size.
- The sample paths are under `docs/specs/effects-animation/preview/signals/` in this worktree.

## Result

- Replace the thin bronze flanks with one low steel shield. Three fitted plates form the surface. A thick warm bevel, raised ridge, broad reflection and fixed uneven grain give it depth.
- One light sweep crosses the metal. Eight sparse sparks clear with the onset. The face, shoulders, square and red crown stay clear. No figure transform or combat action changes.
- Use only the supplied progress. Normal motion settles before .65. Reduced motion uses the same quiet shield at every progress, including 0. The back pass draws only ground light and contact shade. The front pass stays at the figure row.
- Keep the `drawGuard(ctx, foot, { progress, front, reduced })` API. Change only Guard and its private helpers, its description, and one Guard test. Keep all other sample paths and rules.
- Inspect the first render at 430 px. Add a recessed inner edge, uneven reflections, hammer marks and rim fasteners to give the smooth first face more material depth. Inspect onset and hold again in both directions.

## Verification

- Pass: `KINGDOWN_TEST_FILE='docs/specs/effects-animation/preview/signals/state-flare.test.ts' KINGDOWN_TEST_LOCK_WAIT=5 npm test`. Five focused state tests pass. The command also passes the project type check and 54 existing scene tests. This is not a full unit-suite pass.
- The added Guard test checks reverse seek, quiet at .65, and reduced motion at nine progress values from 0 to 1. Existing tests check finite draw values, balanced context, immutable inputs, real fixtures and repeat draws.
- Pass: strict targeted TypeScript on `main.ts` and `state-flare.test.ts` with `--ignoreConfig --allowJs --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --strict --noUnusedLocals --skipLibCheck --types vite/client,node --noEmit`.
- Pass: real Chromium renders with a measured 430 px board in both orientations. Ten progress values per direction. Exact canvas hashes match for forward versus reverse seeks, .65 versus .7 versus 1, and all reduced frames. The reduced result also matches the normal quiet frame.
- Pass: actual replay advances; pause holds exact progress; manual reduced replay and OS reduced motion stop playback. No page, console or failed-request errors.
- Pass: source comparison proves that Holy Light, Mercy, Swap, Archer, shared helpers, materials, fixtures, styles and all control code stay unchanged. Only the Guard description changes in `main.ts`.
- Evidence: `/tmp/kingdown-guard-material/review.json`, `source-comparison.json`, the `guard-*.png` files, and `guard-both-orientations.mp4` (4.83 s, 24 fps, 860 × 460; two 430 px boards). The video samples the same deterministic timeline used by the controls.
- Ready copy list and frame paths: `preview/signals/GUARD_READY.md`.
- Pass: owned-file whitespace and final newlines; `git diff --check`. Final evidence index: `/tmp/kingdown-guard-material/verification-summary.json`.

## Limits

The root task owns the combined registered browser check. The owner has not approved this new sample. No full unit-suite run, production integration, commit, pull request, deployment, dependency change, paid service or credential access.

## Owner review

The owner reviews the rebuilt Firewall and Guard and says “both look great”. Keep this material as the approved local sample. The combined workshop check passes after integration. Production integration is a separate task.
