# Make card motion clear at viewing size

Status: revised preview ready for owner feedback

The owner finds some animations too weak and asks for an independent review followed by improvements. Keep all approved artwork and compositions. Improve local material motion where the review finds it hard to see.

## Plan and checks

1. Review all 23 cards independently at displayed desktop and phone sizes. Assess motion over time and identify specific weak effects.
2. Apply focused changes to the affected renderers. Keep figure and weapon geometry fixed, source-painted materials, deterministic loops, and reduced-motion behavior.
3. Run `npm run check:browser wide-card-motion card-art-wide`. Compare before/after temporal evidence for affected cards and ask the reviewer to assess the changes. Show the revised preview.

Review evidence lives outside the repository in `/Users/za/Documents/king down chess (new)/evidence/effects-motion-review/`.

## Review and revision

The independent review identifies Sacrifice, Mirror, Mimic, Leap, March and Morph as the weakest set. It also identifies faint secondary materials and soft sky fill behind the moving Sky Lift rocks. The full report and before/after temporal captures are in the evidence folder. The reviewer observes all cards through time-ordered frames and inspects selected live playback; this is not a physical-phone user study.

The revisions increase selected cloth edges, dust and material travel. Movement awakenings reach useful strength sooner. Mimic moves opaque cloud contours within a protected sky mask. Mirror adds a moving sheen inside the glass. Sacrifice uses larger source-painted dust and wider travelling crack light. Morph and Control strengthen their local strands. Rescue masks the final water layer to the water opening. Sky Lift uses nearby sky paint instead of a diffusion fill; rock travel stays unchanged. The card-back sheen reaches the crown near the start and crosses it during awakening. Freeze and the three strong fire effects keep their accepted treatment.

Both registered browser checks pass after the revised implementation in effects-integration-LMFBCS. Final evidence and the independent follow-up verdict will be recorded after review.

## Independent revised-motion review

The bounded recheck compares supplied before/after frames at 352 × 198 and 512 × 288. The report is `/Users/za/Documents/king down chess (new)/evidence/effects-motion-review/recheck.md`. Mirror and Mimic pass the sampled noticeability check. Sacrifice, Leap, March, and Morph still need a stronger readable local cue. Sky Lift needs a clean background repair. Rally has no obvious attachment fault in the sampled phases. Final browser checks remain with the implementation owner. No source or art changes form part of this review.

## Final result

The independent follow-up accepts Mirror and Mimic, then Sacrifice and the repaired Sky Lift in its focused pass. It rejects a rectangular March dust fill, coarse Morph strips, and soft Leap spots. The final local fixes replace March's hard cutout with a feathered material field, sample Morph continuously by pixel rows and blend its local backdrop, and give Leap three solid painted leaf silhouettes with their original aspect ratio on clear-sky paths. The parent inspects the final captured frames; these last three fixes have not had another independent pass. Do not describe the whole set as independently approved.

`npm run check:browser wide-card-motion card-art-wide` passes in effects-integration-SyCbl2. The focused all-23 motion check also passes in effects-integration-D8OhFg. `npm run test:docs` passes 166 cases in 13 files. The final Leap leaf-paint/aspect refinement is checked with fresh deterministic captures. The full engine suite is not run for these preview-only changes.

Evidence contains the original review, two follow-up verdicts, original and revised temporal frames, and copied browser logs. Final March, Leap and Morph frames are in `final/frames/`; other final cards are in `after/frames/`. The shared local preview updates at the existing URL. No artwork source file, game integration or deployment changes.
