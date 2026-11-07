# Cold capture: the contact frame shows on time

Status: ready-for-human
Type: task

## Fault

The first capture of each kind after a page load skips frames, sometimes the contact frame.
The runtime decodes only the first four attack frames before the move. The other frames load during play,
and `sample()` shows the last decoded frame. Evidence of the fault: `~/kd-runs/checks/attacks/evidence/`
(`rook-E-held-frame.png`, `ogre-S-held-frame.jpg`) and the `cold` field of each JSON in `shots/warm`.

## Change

- `strike(bank)` in `src/render/painted/character-runtime.mjs`: the attack frames up to and including contact.
- The selection prefetch loads the strike toward each capture target. Past half the decoded budget, a further
  target loads only its first four frames, so two large strikes do not evict each other.
- `prepare()` loads the strike behind the start frames at the same priority and pins it until the action ends.
  The start waits only while, at the decode rate seen so far, a strike frame would not be ready one frame before
  the attack clock reaches it. The wait stays inside the 1000 ms limit, and a strike that does not load never
  causes the plain-figure fallback.

## Checks

- Unit test: a cold `prepare()` shows the contact frame at contact time; the prefetch loads the frames up to contact.
- Cold captures, 153 cases (`cases3.json` captures), Chromium, 3 workers, local build, before and after,
  also with 4x CPU slowdown. See the PR body for the numbers.
