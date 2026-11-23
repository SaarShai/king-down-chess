# Board marks read on both stone tones

Status: ready-for-human (the owner approves the rendered sample)

The legal-move mark was almost invisible on light stone. Each plain mark now has one umber keyline (`#4e3815` at 85%) and a crisp light edge inside it (`src/render/plain-marks.ts`). The shape, size and meaning of each mark stay.

Stone tones: the median of an empty a5 and b5 in the 1280x800 build, light `#dfd6b9` and dark `#a3a397` (`capture.mjs marks`).

| Mark | Before, light : dark | After (keyline), light : dark |
| --- | --- | --- |
| move `#f3deb0` | 1.10 : 1.93 | 5.30 : 3.43 |
| capture `#c8382a` | 3.57 : 2.03 | 5.30 : 3.43 |
| selected `#e9b44c` | 1.30 : 1.35 | 5.30 : 3.43 |
| staged (route, step) `#f3deb0` | 1.10 : 1.93 | 5.30 : 3.43 |
| shelter `#ebcb80` | 1.08 : 1.62 | 5.30 : 3.43 |
| Freeze rim `#7fb7d9` | 1.49 : 1.17 | 5.30 : 3.43 |
| card target ice / ember / shadow / friend | 1.13 : 1.55, 2.95 : 1.68, 3.74 : 2.13, 3.97 : 2.26 | 5.30 : 3.43 |

The darkest tenth of the dark stone gives 3.39. WCAG contrast uses luminance only, so the values also hold in greyscale. `plain-marks.test.ts` checks each kind against both tones.
