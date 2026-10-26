# Living card artwork

Status: six animations live; Haste and Flight accepted. Called Home rising from the dead world is approved for Salvation. Preview only.

The owner approves the first Freeze preview: “looks good.” Its exact material is retained in `freeze/effect.js`. A separate, stronger worker experiment is not adopted. The owner requests prominent Sky Lift rocks moving upward, and chooses the Mimic gentle loop with more prominent clouds. Mimic opens in gentle-loop mode. After the revisions, the owner says “great. now do 3 more in parallel, as you recommend.” Preserve this first set. The next previews are Haste, Flight and Salvation; see ticket 28.

## Preview

Use `/docs/specs/effects-animation/preview/card-art/index.html` on port 5199. Direct card buttons support `?card=freeze`, `?card=skylift` and `?card=mimic`. Original and Animated share one frame and the same crop. Gentle loop lasts eight seconds; Awakening lasts 3.2 seconds. Replay, Pause, timeline, slow playback and reduced motion are available. The full painting, a centered 16:9 study crop and 34/44 px hand coins are shown together. This centered study crop differs from the current game card layout; use the crop review below for actual game framing.

The second set adds `?card=haste`, `?card=flight` and `?card=salvation`. The owner accepts Haste and Flight. The owner chooses Called Home for Salvation and asks for the rook to rise from the dead world. `salvation-concepts/index.html` now shows the revised landscape painting, with the original two concepts under Previous concepts. The rook rises from a ruined world below the board. Its crown, base and the dead world stay visible in the card window. The draft PNGs are generated with the built-in image tool and remain separate from the original asset. Prompts are saved beside them. The owner approves this revision: “This direction works.” The replacement has not yet been animated or installed in the game.

One selected renderer fills a cached canvas, which supplies all four views. Source-derived masks and textures are cached at creation. The shared clock stops when hidden, offscreen or in reduced motion. Seeking is deterministic. Reduced motion shows the original painting. No dependencies or source-asset changes.

## Current game crop review

`crop-review/index.html` uses the actual released catalog, card renderer and game CSS for all 21 cards, plus Rescue and the card back. Measure both `.cf-art` and its image box when reviewing crops. The current grid retains each image’s natural aspect ratio inside a shorter 16:9 clipping window, aligned at the top; computed `object-position: 50% 50%` does not mean the visible content is center-cropped. The card back’s `30%` position does not move content inside an image box that already matches its natural ratio. Guides show the real lower area lost and preserve 491 × 512 sources without forcing squares. No production crop fix is applied.

## Checks

The final assembled revision passes `npm run check:browser card-art` (run `effects-integration-DqFHdK`). The check verifies three exact source images, repeatable reverse seeks, distinct animated frames, matching loop endpoints, finite canvas inputs, bounded opacity, context restoration, stable reduced frames, controls, one-shot completion, hidden-event and actual offscreen stopping. It captures 24 frames at 1280 × 720 and 390 × 844. No browser errors or horizontal overflow occur. The entire square art fits the short desktop viewport. Parent visual inspection catches and fixes the first Mimic column seams, the initial desktop height issue and the Sky Lift tower mask restoring a corner of the moving rock. The source assets are byte-identical to HEAD.

`npm run test:docs` passes 166 checks in 13 files. The design scan reports the inherited game parchment palette and an unused imported text-glow rule. The preview uses the existing game palette and disables text shadows locally. These findings do not call for a theme change.

These checks include the revised rising rocks, fuller clouds and Mimic gentle-loop default. Evidence lives in the session’s external `card-art/verified` folder. Browser viewport checks are not physical-phone performance tests. No full-game regression, production integration, commit or deployment is part of this preview task.

The final six-card revision passes `npm run check:browser card-art` in run `effects-integration-uVgwkV`, with 48 desktop/phone captures. It includes the connected Haste banner mask, Flight's continuous loop and gold ribbon-tip mask, and the stronger Salvation mist. The original view remains byte-exact. Awakening/reduced source frames allow a maximum two-level channel rounding difference when drawn through a cached canvas. The accepted first three effect modules and all source artwork are unchanged. `npm run test:docs` passes 166 checks. The second design scan reports only the same inherited palette and unused text-glow findings. Evidence for this set lives in external `card-art-second/verified`. The parent visually verifies the two artwork drafts and their center crops in the live comparison page.
