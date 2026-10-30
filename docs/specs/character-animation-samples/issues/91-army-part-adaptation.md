# Army part colour adaptation

Status: review samples. The owner must approve the look before bank changes.

## Plan and checks

- Use source colour and broad body-relative zones for each part.
- Make review copies of rest, idle, turns and attacks where available.
- Check each frame for exact alpha. Record sampled L* and Delta E.
- Mark numeric misses on the sheet. Check the look at game size and 2x.
- Run focused tests and open a PR. Do not change the catalog or selection.

## Round 5 plan and checks

- Remove red edges from Rook skin and colour the full Stratus cape and skin.
- Rebuild the three review banks and sheet. Check alpha and sampled colours.
- Inspect the rest and motion samples. Run focused tests and PR checks.

## Method and limits

Part ranges use the source master, not target-image differences. The first
part has priority where ranges overlap. A mask cannot tell apart two parts
with the same colour in the same zone. The owner permits shared-colour
parts to change together. The listed specs are review samples, not approval
for a game bank. Fixed sample boxes can miss a moving part. Low-alpha edges
stay as they were in the source; inspect them for seams.

## Review result

The review sheet covers eight picks and 718 motion frames. Alpha stays exact
in each measured frame. The copies are in the run folder. They are not game
banks. The rest samples include these misses:

- Paladin shoulder L* 59.6 against 88; the hammer has speckles and the
  tabard shifts.
- Rook stone arm moves Delta E 11.0. Ogre tooth moves Delta E 30.0.
- Frost skin stays fixed in its rest sample. The sword reaches L* 20.2.
  The ice reaches L* 28.9 against 23.2.
- Mud mask reaches L* 28.3. Shoulder bone is L* 36.9 against 30.
- White Stratus cape is L* 56.8 against 80. Gold moves Delta E 1.2.

The sheet marks sampled numeric misses. Its motion boxes use the rest pose,
so they can sample another part after motion. The Beast turn bank has no
recorded pivot. Its review uses the 768-pixel canvas anchor as an estimate.
The latest selected Beast idle is included. The other army in each motion
row is a rest reference. Frost, Mud and Stratus have no selected attack.
The owner must judge the look before any bank or selection change.
