# King Down Chess — trailer plan, v2 (2026-09-27)

Owner brief (revised): the trailer must show beautiful, captivating animation with as little text as possible. The only words are the piece names, introduced the way a film or fighting game introduces a character, plus the title and a closing line. The power cards get a new, digital design: tilt, shine, holographic kings, living artwork.

Concept frames and a motion test are rendered by `docs/trailer/concepts/` (serve `docs/`, open `trailer/concepts/?scene=intro|board|cards`). The concepts load original art from the git-ignored `docs/trailer/assets/`, because the rights to the card illustrations are unconfirmed.

## Look

- **Cinema frame:** 2.39:1 letterbox, film grain, vignette, warm torchlight against cool shadow, slow camera pushes.
- **Characters:** the painted game figures, large and rim-lit against a painted diagonal banner in each piece's colour.
- **Names:** gilded Cinzel capitals that punch in and settle, a light sweep across the gilding, an ornamental rule drawing out from the centre, and a giant ghost of the name drifting behind the scene. No taglines.
- **Board shots:** the real game animations, rendered at double resolution, with depth of field, motion trails, slow motion and impact sparks.

## Script (~72 s)

| # | Time | Picture and motion | Words |
|---|---|---|---|
| **I. The board wakes** | | | |
| 1 | 0:00–0:05 | Black. A drop of light lands on a stone tile. Torchlight ripples out across the board and reveals the carved tiles; dust hangs in the air; the camera slowly cranes in. | — |
| 2 | 0:05–0:09 | The two armies wait in silhouette on opposite ranks. Glints ignite one by one: a spear tip, a visor slit, a row of teeth. | — |
| 3 | 0:09–0:12 | The first clash: a Pawn's lance thrust in slow motion. On contact: a hard cut to black and a deep boom; the music drops in. | — |
| **II. The court** — each piece gets one character intro (6–7 s): its real move in slow motion → freeze at the peak (colour drains from everything but the hero, the painted banner sweeps in, the figure slides in huge and rim-lit) → **the name** → time resumes and the move lands. | | | |
| 4 | 0:12–0:19 | The Archer aims; her bolt freezes mid-air as a white-hot streak across the frame. Time resumes: the victim is knocked back and topples. | **ARCHER** |
| 5 | 0:19–0:26 | The Beast bites through a chain of three; the freeze holds the second bite mid-snap with sparks hanging in the air. | **BEAST** |
| 6 | 0:26–0:33 | The Maester swaps places with a friend, then sights through his goggles. The freeze holds the scanning beam. Time resumes: the enemy comes apart in strips and gears. | **MAESTER** |
| 7 | 0:33–0:40 | The Ogre's shove, frozen at contact inside a ring of dust. Time resumes: the enemy slides off its square. | **OGRE** |
| 8 | 0:40–0:47 | A Queen's hurricane charges the Guard. The freeze comes just before impact. Time resumes: the storm breaks harmlessly on the Guard (showing, not saying, that it cannot be captured). | **GUARD** |
| **III. Everything at once** | | | |
| 9 | 0:47–0:55 | A montage on the beat, 0.5–0.8 s per cut, with whip-pan motion-blur transitions: the Rook's ground-pound shockwave, the Bishop's dagger slash, the Paladin's hammer, a Knight's leap across the torchlight, the Frost King's freeze-and-shatter. The back rank spins like a slot reel and lands; a new army drops onto the board. | — |
| **IV. The kings** | | | |
| 10 | 0:55–1:05 | Darkness. Four element emblems ignite in a ring. Four cards slide in and lie flat, and each projects its king as a hologram: Ember, Frost, Gaya, Celestial. The power cards fan out around them, tilting and shining. One card (Strike) flips toward the camera; its meteor bursts out of the frame and across the screen; impact; white flash. | card names only |
| **V. Title** | | | |
| 11 | 1:05–1:12 | Out of the flash, the King Down logo forms: the sword drops into the crown, embers rise. A small line underneath: *Play free* and the URL. A music sting. | **KING DOWN** · *Play free* |

**Vertical cut (30 s):** 3 → three intros (Archer, Beast, Maester) → 10 → 11.

## The new card design (trailer now, the game later)

- **Body:** obsidian glass, 5:7 ratio, rounded corners; a metallic rim coloured by element (fire copper, water ice-silver, earth green-bronze, air pale gold), with a fine inner hairline.
- **Art:** the original illustration, full-width in an inset window with a soft vignette. It is *alive*: slow push-in, and element particles (embers, frost motes, gold dust) drifting across it.
- **Medallion:** the element emblem in a dark gem that bridges the art and the name.
- **Name:** gilded Cinzel capitals with an ornamental rule. There is no rules text on the card face.
- **Digital effects:**
  - 3D tilt with a specular glare that follows the tilt.
  - A subtle holographic foil (rainbow and sparkle) that shifts with the angle.
  - A flip reveal.
  - King cards: the king rises out of the card as a flickering, scan-lined hologram inside a projector beam, with rings pulsing on the card face.

## How it is made

1. **One web page draws every shot from a time value.** The script above becomes data (shots, layers, keyframes), so any timing or move is a small edit. The concept page already works this way.
2. **Board shots use the game's own painted scene.** It is driven with scripted positions and moves, rendered at double resolution, then finished with a camera, depth of field, grade and effects.
3. **Deterministic rendering.** Playwright renders each frame at 30 fps; `ffmpeg` encodes the 1080p MP4, the vertical cut and a GIF. The motion test in `concepts/` was made exactly this way.
4. **Sound:** a music track, plus sound design cued from the same timeline (the game's synthesized hits, whooshes, card flips, a hologram hum), mixed with `ffmpeg`.
5. **Review steps:**
   - the concept frames (now);
   - a full-length **animatic**, with every shot in motion but rough effects;
   - the **final render**.

## New art (Images 2.5 through Codex, prompts and hashes saved beside each image)

1. **Five painted intro backdrops**, 16:9, one per piece, with no characters: the Archer's forest canopy at dusk, the Beast's cave mouth, the Maester's workshop, the Ogre's quarry, the Guard's fortress gate. They replace the procedural banner texture in the concept.
2. **Five dynamic hero poses** in the game's painted style, keeping each piece's identity: the Beast lunging mid-roar, the Ogre mid-shove, the Guard braced, the Maester sighting through his goggles, and the Archer (her current pose already works). This is recommended: the in-game figures stand neutrally, and a hero pose is what makes an intro land.
3. **The King Down capital** at night: the establishing backdrop for the title.
4. **A card back** in the new style.

## Still open (owner)

1. **Music:** license a track (recommended), your own, or a placeholder for the animatic.
2. **End card:** a public URL, or *Coming soon*.
3. **Hero poses:** generate new ones (recommended), or use the in-game figures.
4. **Rights:** confirm the card illustrations and the 2014 film footage may be published; the card art may be by a second artist.
