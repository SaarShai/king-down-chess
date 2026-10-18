# Approve a browser sample from the game UI

Type: prototype
Status: resolved
Blocked by: 09, 12, 13
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:prototype

## Question

How do the account screens use the chosen game look in a top-level browser?

## Rule

Reuse the chosen game materials and behavior, and get the owner's approval of a rendered browser sample before the visual build.

## Options

1. Adapt the actual account screens, with browser safe areas and no composer gap.
2. Make a new website theme.
3. Copy the iframe dimensions and host padding unchanged.

Recommended: 1. Stone controls, the painted board, the scroll, badges and the shared fonts already work. The browser needs its own frame sizes.

On yes: render the hall, setup, seat, board and profile, with a local-play entry, a result card and a card or power target state. Every board uses the engine and the painted view. Record each difference from an existing owner pick. The sample does not authorize a new rule or font.

## Sizes and input

Main comparison: 390 × 844 and 1440 × 900. Fit cases: 320 × 568, a short landscape view, and 197 × 426 (200% zoom). Use browser safe areas, not the ChatGPT composer values. Check the software keyboard, long handles, draw replies, all four cards and a blocked-move notice.

Keep round coins, whole words in tabs, visible target words, the board floor with page scroll, the approved card-strip wraps and 48 px touch targets. Use the existing reduced-motion path. A spent coin stays readable. Show touch and keyboard focus. Include the open plugin samples that [the scope picks](12-scope-picks.md) send here, and the visible shared changes from [the web baseline](08-release-evidence.md).

## Resolution evidence

A link to the rendered sample, the owner's accepted options, and any remaining taste choice. No sample exists yet and no approval is inferred.

## Answer

Decided by delegation (owner, 2026-10-18: "regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."). Two independent reviews checked the sample (look; fit and access) and gave 10 required changes; all are in. Two more independent reviews (product; access and facts) checked this answer; their 8 changes are in.

Sample and evidence: branch `prototype/web-account-sample` (base `ba88ba82`: the route prototype of [ticket 13](13-routes.md) joined to release candidate `52aca5fe`; sample commit `c8c9dc43`; a reference, never merged), folder `docs/research/web-adaptation-2026-10-18/browser-sample/` on that branch: `README.md` (render index, measurements, differences from owner picks, fit problems), `review.md` (both reviews and each answer), `measurements.md` and `measurements.json`, 78 renders at 390 × 844, 1440 × 900, 320 × 568, 844 × 390 and 197 × 426, and the trace `tools/play-sample-trace.ts` (69 checks pass). Run the sample on that branch with `npx tsx tools/play-route-prototype.ts 5195` and open `http://127.0.0.1:5195/play/`.

Decisions:

- **Option 1.** The account page uses the actual plugin account screens through two thin boundaries: a page host (browser safe areas with `env(safe-area-inset-*)`, page scroll, no composer gap) and a game client. No new theme, font, rule, component or art. Every board uses the engine and the painted renderer.
- **Frame.** The existing sheets and table columns at every size. At 1440 × 900 the page is a centred column; the board and seat use the existing side column; Profile uses its two columns.
- **Controls.** Every DOM control on the account page has a hit area of at least 48 CSS px, from the page-host CSS. Coins stay round and keep their faces and order. The plugin keeps its own sizes in the iframe; the larger hit areas go to the plugin as a later update, not a web-only fork of the screens.
- **Board squares: an accepted exception to the 48 px rule.** Eight squares fill the board column: 44.45 px at 390 × 844, 36.28 px at 320 × 568, 26.37 px at 844 × 390, 22.87 px at 197 × 426 and 82.25 px at 1440 × 900. A 48 px square needs a 384 px board with no frame, which the painted board cannot give on a 390 px phone. The main phone size meets 44 px (the iOS minimum). Every size except 197 × 426 meets the WCAG 2.2 AA target minimum of 24 CSS px (2.5.8). The 197 × 426 case only approximates 200% zoom of a small phone; there the 2.5.8 "essential" exception applies, because the eight-by-eight grid is the game. Separately, the board has a keyboard path (arrow keys, then Enter or Space, with a live label: `src/plugin/screens/board.ts` lines 251–254; the seat rank in `src/plugin/screens/seat.ts` lines 47–49); that is a keyboard fact (2.1.1), not a 2.5.8 exception.
- **Target rules.** Full words with page scroll. The target-first words of G1 stay; the box grows; the web page has no inner two-line scroll.
- **Local play, both ways.** On the account page, signed in: a stone row "Play on this device" ("No account needed. Local games, lessons and the Workshop.") under Profile and Settings. It lives in the web page host; the plugin screens do not change for it. Signed out: the "Play without an account" exit of ticket 13 stays. On the local home (the root): a row "Play online" ("Friends, random players, cards and Classic. Needs an account.") under Today's army, in the same row style; it opens `/play/`. This sample does not render the local-home row; the phase 2 render check shows it. Reason: each label fits its context, and the local-home words name what an account adds ([ticket 09](09-web-play.md), part 2).
- **Contrast and focus.** The measured fixes stay. The spent coin face darkens and its rim uses dark stone: face 3.91:1 and rim 5.42:1 against the table (WCAG 1.4.11). Focus uses a darker token with a light border, 3 px; at least one ring colour reaches 3.24:1 against each sampled walnut and parchment pixel (1.4.11; the outline against its own border is 10.48:1). Keyboard and touch focus are visible (2.4.7). These go into the shared CSS in phase 2, so both surfaces get them (one copy).
- **Player strips.** Names and subtitles get their own line in the side column, in short landscape and at 197 px. The narrow coin row keeps its horizontal scroll with a part-shown coin, an edge fade and "Scroll coins".
- **Open plugin samples.** B2/S2 (`taste/b2-row-preview`), C2, H4, Y1, Y3 and C5 (`taste/c5-seat-reveal`): the web follows the plugin's answer for each, through the shared UI. Until then, the first web release shows the release-candidate form. The sample's notes go to the plugin: B2 plays once with Replay (no loop); C5's four seat cards and slab are ready for review; motion stays with the plugin sample.
- **Y2 scroll cue.** Native page scroll on the web page, because the browser has no hidden iframe footer. A plugin fade gets a review before the web shares it.
- **Fault found, sent to the plugin session:** `src/plugin/screens/board.ts` line 373 said "Tap a marked square." and line 376 "Tap again to …", while the shared words use "Select" (owner pick B4). The plugin session fixed both on the release branch (`ed315972`).
- **Known art gap, not a fault.** About half the deal cards, Morph among them, have no painting in `public/ui/cards`. The card back with a two-letter word (`board.ts` line 315) is the designed fallback, recorded in the plugin's art note (`docs/specs/chatgpt-mvp/notes/e-art.md`). New card art is a visual change that needs the owner's yes on a sample; the web shows the same fallback.
- **Not checked** (they go to [the test gate](16-test-gate.md) and the release evidence): real phones and software keyboards, native safe areas, real browser zoom and larger text, focus not obscured (2.4.11), Firefox, WebKit, screen readers, live sign-in, the database, a worker upgrade, Share, B2 replay and C5 motion.
