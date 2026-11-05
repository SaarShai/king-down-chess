# Painted attack preparation

Status: ready-for-human
Type: task

## Scope

The owner asks for repeated WebKit and Chromium captures on 2026-11-05.
Use staging read-only or a local build. Make a small fix only for a proved game fault.
Do not merge, deploy, change art, or use an independent reviewer.

## Plan and checks

1. Measure first and repeat captures for Frost, Flame, Pawn and one more piece.
2. Record preparation time, the return path, image load and decode time, and played frames.
3. Separate a game fault from a check fault with a controlled comparison.
4. If a small fix is proved, measure it against the base and check slow-link delay.
5. Run the focused local tests once. Open a PR to `staging/first-game` and read one CI round.

Pass criteria: each claim has a saved trace. The fix must improve painted playback
without a longer preparation limit. The board must complete a capture on a slow link.

## Evidence before the fix

Base: `bea4747946d5b6685dace310495c9544fa1eee12`.
The local manifest and the saved staging manifest have SHA-256
`a5742556130fee1d4b9759d9b6e40a585dccf39045da04002818e7e13a181570`.
The runtime source matches the prior staging probe source byte for byte.

The probe uses real board input, first capture, Undo, then repeat capture.
It records preparation return paths, image onload and decode times, and scene frames.
It blocks service workers to expose the image load cost. It changes no art.
Results live outside Git in `~/kd-runs/fin-attack/`.

- Fast local assets: 80/80 attacks play, across both browsers and four pieces.
- Staging image responses through a local HTTP proxy: Frost plays on 1/3 first
  WebKit captures and 3/3 repeats. Each other group plays on 3/3 captures.
- The two Frost skips stop at 1,002 and 1,001 ms. Required images are still absent:
  12 of 27 and 4 of 27. Decode takes at most 9 and 5 ms. Cache use is 15.94 and
  30 MiB, below the 64 MiB limit. The missing images are not evicted decoded images.
- With byte warm-up and 25 seconds after selection, 32/32 attacks play.
  First Frost preparation still takes 353–778 ms in WebKit.
- With 300 ms per image response, all 3 first Frost captures fail in each browser.
  All 3 first Flame captures fail in WebKit. The scene starts with no prepared body
  in each failure. This is a game fallback, not a missed frame in the check.

The loader has six image slots. King capture preparation requires each turn frame
on its facing route and the first four attack frames. Frost N needs 27 distinct
images; Flame N needs 17; Pawn NE and Knight NE need 8 each. Large turn routes
increase the cost. A bank's total attack-frame count alone does not set this wait.
Selection passes quiet destinations only and prefetches walk banks only. Captures
therefore start their required image loads at the capture click.

## Fix scope

Pass legal capture targets from the view to the scene. Use the current selection
prefetch queue to decode the first four attack frames and the required turn route.
Keep the existing 1,000 ms capture limit, six slots and 64 MiB cache limit.
Tests cover the view caller, scene target choice, and delayed capture preparation.

## Result

The game has a proved preparation fault. All 40 skips in 344 measured captures
return at the required-frame readiness check, with zero attack samples. No skip
follows successful preparation. The two natural staging-response Frost failures
have missing images that have not reached onload at the cutoff. Decode and cache
pressure do not explain those failures. The exact old hosted moves have no such
trace, so their individual network state remains unknown.

The fix uses the current selection queue. It adds no wait limit, new queue or art.
Quiet-move prefetch keeps its prior frame selection.

| Browser | Piece | Staging-response first: base/fix | Repeat: base/fix | First prepare median: base/fix ms |
|---|---|---|---|---|
| WebKit | Frost | 1/3 / 3/3 | 3/3 / 3/3 | 1001 / 1 |
| WebKit | Flame | 3/3 / 3/3 | 3/3 / 3/3 | 679 / 0 |
| WebKit | Pawn | 3/3 / 3/3 | 3/3 / 3/3 | 110 / 0 |
| WebKit | Knight | 3/3 / 3/3 | 3/3 / 3/3 | 355 / 0 |
| Chromium | Frost | 3/3 / 3/3 | 3/3 / 3/3 | 777.2 / 0.5 |
| Chromium | Flame | 3/3 / 3/3 | 3/3 / 3/3 | 370.9 / 0.3 |
| Chromium | Pawn | 3/3 / 3/3 | 3/3 / 3/3 | 169.8 / 0.3 |
| Chromium | Knight | 3/3 / 3/3 | 3/3 / 3/3 | 338.2 / 0.3 |

With a fixed 300 ms image response delay, the base plays 39/48 attacks. The fix
plays 48/48. First Frost playback rises from 0/3 to 3/3 in each browser. First
Flame playback rises from 0/3 to 3/3 in WebKit. Each other group stays at 3/3.
Fixed first Frost preparation takes 508–536.5 ms. Each other fixed preparation,
including repeats, takes at most 1 ms. Peak decoded cache use stays below 61 MiB.

With 1,500 ms images and one second after selection, all eight first captures use
the fallback on both base and fix. Repeat playback is 1/8 on base and 5/8 on fix.
Median click-to-scene-start time is 1,009.0 ms on base and 1,004.8 ms on fix.
The maxima are 1,028.7 and 1,028.1 ms. These trials do not show a longer board wait.

A WebKit control uses 1,500 ms images, byte warm-up, then 25 seconds after selection.
All 58 Frost responses and all 81 Pawn responses load. Base first playback is 0/1
for each piece; fixed first playback is 1/1 for each. Fixed repeat playback is also
1/1 for each. Fixed preparation takes 0–1 ms. Thus the old warm-byte setup can still
skip an attack; early runtime image preparation prevents that skip in this control.

## Verification

- One focused `npm test` call uses
  `KINGDOWN_TEST_FILE='src/render/{character-runtime,scene-load,PaintedView}.test.ts'`.
  It passes 184 focused tests. The command also passes its 70 board tests and both
  type checks. There is no second local unit-test run.
- The build passes. `npm run check:browser character-prepare` fails at
  `legacy body is used after the deadline`. The same check fails on the base code
  at the same assertion. Base fallback keeps its painted rest body, while this
  check expects no painted body. The fixed sources are restored byte for byte
  after this comparison. This task leaves that existing quiet-move check unchanged.
- Browser versions: WebKit 27.2 and Chromium 156.0.8078.4, Playwright 1.64.1.
- No independent review, merge, deploy, art change or walk-bank change occurs.
- CI and the PR head are recorded in the PR and `~/kd-runs/fin-attack/fin-attack.md`.

A very slow link or a quick capture can still use the fallback. The fix starts
optional image work earlier; it does not make the board wait longer for it.
