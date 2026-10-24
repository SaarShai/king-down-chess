# 08 — State material flare

Status: ready-for-review
Type: prototype

## Scope

Revise five signal studies: `archer`, `guard`, `holy-light`, `mercy`, and `swap`. Keep all 12 IDs and the shared control API. Own only this ticket and `preview/signals/`. The owner approves more local samples on 2026-10-23. This work does not deploy or change the game.

## Plan

1. Check the real fixtures, capture exceptions, scene layers and material direction.
2. Build Guard, Holy Light and Swap first. Check syntax and legal state. Write `preview/signals/EARLY_READY.md` with stable copy paths.
3. Build the Archer target and Mercy shelter. Keep source figures fixed. Keep the pawn and king capture exceptions clear.
4. Check deterministic frames, the 12 IDs, both board directions, reduced motion, and the unchanged samples. Record exact evidence and limits.

## Pass criteria

- Guard has a brief protective material flare and a quiet shield. Only a king can capture it. Do not show total immunity.
- Holy Light visibly starts at the Spirit king and reaches the supported knight. Mercy retains its pawn capture exception.
- Swap has intertwined magical light. Figures stay on their original squares.
- Archer shows a distant eligible target over a blocker. Do not draw a shot, contact damage or a removed victim.
- New effects use one deterministic progress value. They settle after onset. All ground marks draw below the figures. Art stays intact.
- Production marks and pips stay. Freeze, Ice Wall, Firewall, Check, Shove, Hint and ghost keep their existing drawing paths.
- Fixture checks and a strict targeted TypeScript check pass. The root task performs the final workshop and browser check.

## Evidence

The fixture inputs match `tools/fixtures/shared-mechanics.ts`: Guard, Holy Light, Mercy, Archer and Maester swap. `GameRules` resolves each legal action. `fixtures.ts` already checks the capture exceptions and all six far2 directions.

## Result

- Five samples change: `guard`, `holy-light`, `mercy`, `swap`, `archer`. The page keeps 12 samples and the same API keys: `ready`, `select`, `seek`, `getState`, `samples`.
- Guard raises open bronze flanks and local gold flecks. Its shield gains a still red crown: only a king can capture it. There is no closed immunity dome.
- Holy Light gathers at the Spirit king, sends a short packet of light to the supported knight, then opens a broad light mantle behind it. Quiet source wisps keep the king clear as the support source.
- Mercy shares the light material but leaves the pawn-facing side open. Its shield gains a still red pawn. The rule text states that the pawn can capture. The old king and pawn diagram links are removed.
- Archer focus feathers gather in place at the Archer and each real eligible distant target. The production target frame and shot badge stay still. There is no projectile, contact, damage or removed victim. The Archer stays on c3, and the blocker stays on c4.
- Swap has two filled light wakes that cross between the pair, then settle into quiet local wisps. The Maester and king stay on a1 and e1. The old continuous orbit is removed.
- The first ready file names Guard, Holy Light and Swap before the remaining work ends. It now gives the final copy list for all five samples.
- New draw modules use only the supplied progress value and scene feet. They have no clock, random runtime value, figure transform or game-state change. All ground marks stay in the under layer.

## Checks

- Pass: `KINGDOWN_TEST_FILE='docs/specs/effects-animation/preview/signals/state-flare.test.ts' npm test`. Four focused tests pass. The same command passes the project type check and 54 existing scene tests. This is not a full unit-suite pass.
- The focused tests check real fixtures, finite drawing values, balanced context state, immutable inputs, repeated deterministic draws, stable quiet holds and stable reduced-motion holds. They sample 90 state/orientation/time combinations twice. A new fixture check confirms that the legal swap exchanges the pair without a capture.
- Pass: strict targeted TypeScript check of `main.ts` and `state-flare.test.ts`, with unused-local checks. The command uses `--ignoreConfig --allowJs --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --strict --noUnusedLocals --skipLibCheck --types vite/client,node --noEmit`.
- Pass: local Chromium renders at a 430.3 px board and in both board directions. All five studies have identical canvas output at progress .7 and 1: ten quiet holds. The new material is inspected at actual board size. Swap's first wake looked dotted; one filled wake replaces the repeated segments. The Spirit source light is strengthened after the first render.
- Pass: 42 frames of the seven preserved samples match the starting version exactly. Each frame is checked against two stable baseline renders in the same browser. IDs: `freeze`, `ward`, `firewall`, `check`, `shove`, `hint`, `ghost`; progress .12, .42, .8; both board directions.
- Pass: no browser errors in the local render. The shared API keys remain the same. `materials.ts` is byte-identical to the starting version. The seven preserved sample drawing paths and existing control handlers remain unchanged.
- Pass: the board, controls and status fit 1280 × 720. At 390 × 844, document width is 390 px; controls sit above the 366 px board, and the board bottom is 706.4 px. There is no side scroll.
- Pass: actual replay advances, pause holds the exact progress, manual reduced-motion replay holds progress .42, and OS reduced motion stops playback. No new clock is added. Existing hidden-tab and keyboard/touch handlers stay unchanged.
- Evidence: `/tmp/kingdown-state-flare-review/review.json`, `playback.json` and the board screenshots in the same folder. Latest Swap frames use `swap-final-*.png`.
- Pass: owned source whitespace check and `git diff --check`.

## Handoff and limits

Copy `preview/signals/main.ts`, `state-flare.ts`, `archer-flare.ts`, `fixtures.ts`, `state-flare.test.ts` and `EARLY_READY.md`, plus this ticket. All are final. The existing `materials.ts`, `index.html` and `style.css` stay unchanged. No unfinished file remains.

The root task owns the final workshop and registered browser check. It must still check the combined groups and the hidden-tab, keyboard and touch paths there. The owner has not approved these five revised samples. No production source, figure art, dependencies, commit, pull request or deploy changes here.
