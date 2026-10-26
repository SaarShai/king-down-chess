# Card casting, promotion and check previews

Status: promotion approved; card casting and check await owner feedback

Owner request: build card casting, promotion and one other researched concept in parallel. Show rendered previews for feedback before game integration. The third sample is dramatic check and resolution.

Plan: use three isolated worktrees, one per sample. Reuse the painted board, real pieces and legal engine positions. Bring only standalone preview folders into this branch. Add one launcher, inspect desktop and phone frames, test transport and reduced motion, then show the samples.

Acceptance: each sample has nearby replay/pause/scrub controls, a clear outcome, readable phone layout and a static reduced-motion state. Card spend does not refill. Promotion reveals the chosen identity. Check shows the actual cause and a legal resolution. No production code, existing approved effects, static indications, rules or combat changes.

Related: [research and proposed designs](../research/king-down-motion-direction-2026-10-24.md).

Delivered: [preview launcher](../preview/concepts/index.html), with independent card casting, promotion and check studies. Each has replay, pause, timeline, slow playback, reduced motion and board flip. Cards compare local release with a short wisp for Freeze and Firewall. Promotion offers queen and knight. Check offers dense and open legal positions, plus a legal resolution.

Verification: individual preview checks cover legal outcomes, controls, repeated seek, phone/desktop layout, both board orientations and reduced motion. Promotion passes 89 checks. Card casting captures 22 frames. The combined `npm run check:browser effects-concepts` passes; its report is `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/effects-integration-Nff8m0`. The parent inspects rendered frames and opens all three previews. Game source and the shared painted scene have no changes. Physical-phone performance and full-game regression tests are outside this preview-only pass.

The early card and promotion materials are refined after phone inspection. The check study repairs its local starting position so only the intended king is in check; the older shared fixture stays unchanged. Owner feedback must precede game integration.

## Owner feedback

Promotion: approved. The owner replies “looks great” to the question about the gold reveal and piece recognition. Preserve this visual direction. Card casting and check remain open for feedback. No game integration occurs in this feedback update.
