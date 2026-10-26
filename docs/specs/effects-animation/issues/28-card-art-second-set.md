# More living card artwork

Status: Haste and Flight accepted; Called Home selected for Salvation. Its rising-from-the-dead-world revision continues in ticket 29. Preview only.

The owner requests three more card paintings in parallel after the first three previews. The selected cards are Haste, Flight and Salvation. Preserve Freeze, Sky Lift and Mimic. Show each new result before game integration.

## Direction and plan

Haste moves golden dust along the existing trail around the rook and gives its red banner a wind response. Flight moves the existing ribbon and painted wind around the floating bishop. Salvation gathers mist and raises soft light at the grave. Animate source material, keep the main shapes recognizable, and judge detail visibility in the real center crop. Avoid diagram lines, whole-image wobble and broad overlays that hide the painting. No combat sequence.

Source masks must select the intended connected object, including painted highlights; a colour threshold alone can select distant objects or leave a bright tip behind. Inspect the approach to the loop boundary as well as the exact endpoints. Equal endpoint frames alone do not prove a continuous loop.

Each isolated worker owns one effect folder. The parent owns the six-card selector, shared preview, assembly and verification. Keep the existing eight-second loop, 3.2-second awakening, Original/Animated, replay, pause, scrub and reduced-motion controls. Only the selected effect runs, at a capped frame rate; cached source masks avoid per-frame image processing. No dependency or source-asset changes.

1. Build the three effects in parallel from the actual artwork.
2. Inspect multiple frames, then show each ready effect on the shared preview.
3. Verify the three new effects and the existing three in the registered browser check. Record feedback separately from technical completion.

## Acceptance

All six cards load without browser errors or horizontal overflow. Original matches the source. Fixed-time frames repeat; loop endpoints match; canvas state and opacity remain valid. Reduced motion stays still. Controls, hidden/offscreen stops, 16:9 crop and 34/44 px hand icons work at desktop and phone viewport sizes. Visually inspect source contours, cleared regions, masking and depth order. Original artwork remains byte-identical. Owner feedback decides whether each preview is accepted. No game integration, commit or deployment is part of this request.

## Result and feedback

All six effects are live. The final registered browser check passes in run `effects-integration-uVgwkV` with 48 captures at 1280 × 720 and 390 × 844. The parent inspects the three new paintings and crops. The Haste mask now selects only the main banner. Flight returns smoothly through the original at the loop boundary and includes gold-painted ribbon tips. The stronger Salvation mist reaches the center crop. Docs checks pass: 166 tests in 13 files. All source assets and the accepted first three effect modules remain unchanged. The two inherited design-scan findings are the existing parchment palette and an unused imported text-glow rule; local text shadows are disabled.

The owner says “haste is fine” and “fine” for Flight. The owner specifically requests that Salvation artwork be redone and improved, with two different concepts. Two built-in image-generation drafts are saved under `preview/card-art/salvation-concepts/`: Reforged shows an ivory knight drawing itself back together through warm gold light; Called Home shows a spectral rook becoming solid as it returns through turquoise mist. The page shows full paintings and center card crops. Prompts are saved in `PROMPTS.md`. Both image files are non-empty 1254 × 1254 PNGs. The original Salvation asset is unchanged; the owner chooses the replacement before animation work continues.

Evidence lives in the session's external `card-art-second/verified` folder. Physical-phone performance and full-game regression are outside this preview task. All worker preview servers are stopped; shared port 5199 remains live.
