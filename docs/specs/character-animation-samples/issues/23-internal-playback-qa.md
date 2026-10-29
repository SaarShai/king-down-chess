# Internal playback QA

Status: in-progress

Extend the existing alpha frame-bank player with an opt-in internal diagnostic mode. Keep the normal review player unchanged. The fixture supplies a positive source-to-board scale and, when available, a real board image. Support native and board-size display, exact selected-frame steps, normal and slow playback, and the largest interval between completed canvas draws during each uninterrupted run.

Verify that the selected images load before playback, frame steps use their timestamps, the requested scale controls the displayed pixels, all backgrounds work, and a stalled draw loop appears in the gap measure. Draw intervals are timing diagnostics, not proof of actual display delivery or visual quality. Screenshots are not motion review.

Use the existing player on a served internal fixture: add `data-playback-qa` and `data-board-scale="<CSS pixels per source pixel>"` to its `data-alpha-bank` element. Supply `data-board-image="<URL>"` for a real board background; without it the option is labeled as an approximation. Choose the scale and board image from the actual scene under test. The framebank must contain the exact selected frames and timing. Each Play or speed change starts a fresh gap measurement. Step controls pause playback and use the union of body and effect frame times. The displayed maximum is wall-clock time between completed canvas draws; it cannot establish whether the compositor presented every frame.

For an existing served internal page, load the module first, then create and load one diagnostic host (replace the three example URLs and scale with values measured for the clip):

```js
const { loadPlayer } = await import('/path/to/alpha-framebank-player.mjs');
const host = document.createElement('div');
Object.assign(host.dataset, { alphaBank: '/path/to/selected-bank.json', playbackQa: '', boardScale: '0.25', boardImage: '/path/to/actual-board.png' });
document.body.prepend(host);
await loadPlayer(host);
```

The supplied board image must be registered to the fixture's canvas; the player scales it to cover the canvas. This tool does not derive game geometry, capture a movie, or assess motion quality.

The focused `tools/animation-playback-qa.test.ts` test passed under the shared test lock. It checks distinct transparent body and effect PNGs, canvas pixels and the normal player. The same run passed typecheck and 54 Node checks. No selected Mud or Pawn clip has been reviewed with this tool yet.

## Independent review

The independent reviewer (`/root/improvements_review`) reviewed the player and test. The test was strengthened to check distinct body and effect pixels, frame stepping and normal-player behavior. The reviewer found no further actionable defect on re-review. On the staging base, `KINGDOWN_TEST_FILE=tools/animation-playback-qa.test.ts npm test` passed the selected test, typecheck and 67 existing Node checks. This is not a full Vitest run.
