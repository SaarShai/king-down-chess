# Trailer sound

The trailer soundtrack is code. A browser renders it offline with Web Audio, and ffmpeg masters it. It has three parts:

- **Score** (`engine/audio/score.mjs`): a hybrid-orchestral temp score, 120 BPM, D minor. A small sampler plays free orchestral samples (VSCO 2 CE, CC0).
- **Sound design** (`engine/audio/sfx.mjs`): 66 synthesized sounds (oscillators, seeded noise, FM, saturation). There are no sound files.
- **Cue sheet** (`engine/audio/cues.mjs`): 176 cues in shot-local time. Each cue starts one sound.

`engine/audio/mix.mjs` mixes the parts. `tools/render-trailer.mjs` renders and masters. Nobody has listened to this mix yet. All checks below are measurements.

## Render, listen, mux

```sh
tools/fetch-trailer-samples.sh                                  # once: the 156 samples the score plays (177 MB download)
node tools/render-trailer.mjs audio soundtrack.wav              # the mastered mix: 59.0 s, 48 kHz, 24-bit
node tools/render-trailer.mjs audio music.wav --only music      # a stem: 32-bit float, mix level, not mastered
node tools/render-trailer.mjs audio sfx.wav --only sfx
node tools/render-trailer.mjs master raw.wav soundtrack.wav     # master a raw render again
node tools/render-trailer.mjs video trailer.mp4 --audio soundtrack.wav   # mux under the picture
```

To listen in a browser, open `engine/audio.html?play` (`&only=music` or `&only=sfx` for a stem). This preview is not mastered, so it plays about 5 dB quieter than the master.

Every render is deterministic: seeded noise, no `Math.random`. Two renders differ by less than 2e-7 (−134 dBFS), because Chromium sums node inputs in a changing order.

## Signal flow

```
score.mjs ──▶ music bus (MIX.music, ducked) ─┐
sfx.mjs   ──▶ sfx bus (MIX.sfx)             ─┼──▶ glue compressor ──▶ master gain (hush, fade-out) ──▶ raw float WAV
both sends ─▶ shared hall (convolver)       ─┘
raw WAV ──▶ ffmpeg: gain to −14 LUFS ──▶ 4× oversampled limiter (−1.3 dBFS) ──▶ 48 kHz 24-bit WAV
```

- **Bus contract.** A sound or a note connects its dry signal to `bus.out` and a send to `bus.verb`.
- **Ducks.** A cue with `duck` dips the music bus by that depth (true = `MIX.duck`). The dip starts on the cue and releases with a 0.35 s time constant.
- **Hall.** The impulse is mid/side. It is wide above 200 Hz and mono below 200 Hz, so low reverb tails cannot cancel in mono. Its tail gets darker as it decays.
- **Glue.** A Chromium DynamicsCompressor. It adds its own makeup gain (about +3 LU on quiet passages) and delays the whole mix by 6 ms, which is less than one frame.
- **Master gain.** It holds each `HUSH` window at true silence, reverb tails included, and fades the whole mix to silence over the last second with the picture.
- **Mastering.** One linear gain brings the mix to −14 LUFS. A lookahead limiter at 192 kHz then keeps the true peaks under −1 dBTP. There is no dynamic loudness processing. The tool measures the result and exits with code 1 if it misses the target.

## Knobs

| Where | Knob | Now | What it does |
|---|---|---|---|
| `mix.mjs` MIX | `music`, `sfx` | 0.8, 1 | Bus levels: the music / sound-design balance. |
| | `shotSfx` | montage 1.4 | Sound-design level for one shot (× every cue's gain). |
| | `duck`, `duckRelease` | 0.5, 0.35 s | Default duck depth and release. |
| | `verb` | 3.4 s, decay 2.6, level 0.9, mono below 200 Hz | The shared hall. |
| | `glue` | −16 dB, 2.5:1, 12 ms / 250 ms, knee 8 | The bus compressor. |
| | `fadeOut` | 1 s | Final fade. It ends at the timeline's `DURATION`. |
| `cues.mjs` | a cue's `gain`, `pan`, `pitch`, `duck` | | One sound's level, place, tuning and duck. |
| | `HUSH` | wake: black (8.58) → 9.0 | Shot-local windows of true silence. |
| `score.mjs` | `LEVEL`, `LEVELS` | −3 dB; per shot | The whole score, and each section's level. |
| | `SYNC` | | Picture times the score follows. |
| `sfx.mjs` | `TRIM` | −18 dB | The whole sound palette's level. |
| `render-trailer.mjs` | `LUFS`, `CEILING`, `LIMIT` | −14, −1 dBTP, −1.3 dBFS | Mastering target. The limiter uses a 2 ms attack and a 40 ms release. |

**Retiming.** Cue times are shot-local, and shot starts come from `timeline.mjs`. A shot that moves carries its sounds with it. Inside a shot, the montage cues come from `shots/montage.mjs` `CUES`. The wake and the intros export their timing (`wake.mjs` `DROP_T`, `CLASH`, `CONTACT`, `BLACK`, `GLINTS`…; `intro.mjs` `PIECES`, `TIME`), and `cues.mjs` and `score.mjs` read it, so retiming those shots moves their sound too (`cues.mjs` needs one `GLINT_SOUNDS` entry per wake glint and throws otherwise). The kings and title still mirror their values in `cues.mjs` (named in each block) and `score.mjs` `SYNC`: re-read them after retiming those shots.

## Sources and licences

- **Samples:** VS Chamber Orchestra 2: Community Edition (VSCO 2 CE) by Versilian Studios (Sam Gossner, Simon Dalzell), licence **CC0-1.0**. Source: https://github.com/sgossner/VSCO-2-CE, commit `440300901dfe9275fd84e0b7763af1f8443ae62e`. `tools/fetch-trailer-samples.sh` fetches only the files that `score.mjs` plays into the git-ignored `docs/trailer/assets/audio/vsco/`. CC0 needs no credit. Versilian Studios asks for this credit: *Versilian Studios / Sam Gossner*, http://vis.versilstudios.net/vsco-community.html.
- **Sound design:** synthesized in `sfx.mjs`. It contains no third-party audio.
- **Tools:** Web Audio in headless Chromium (Playwright) and ffmpeg (`ebur128`, `alimiter`, `aresample`).

## Mix pass, 2026-09-27 (measured on the first-pass timing)

What changed:

| File | Change | Why |
|---|---|---|
| `mix.mjs` | Master stage: `HUSH` windows and a 1 s fade-out. The render is `DURATION` long (no 1.5 s tail). | The black was at −47 dBFS RMS (hall tails). The end was cut at −35 dBFS. |
| `mix.mjs` | Hall impulse built mid/side, mono below 200 Hz. The tail now gets darker, as the old comment said (the old filter got brighter). | Worst L/R correlation in the mix went from −0.22 to −0.07. |
| `mix.mjs` | `shotSfx.montage` 1.4 (+2.9 dB). | The montage hits sat 1–7 dB under the score's tutti. |
| `render-trailer.mjs` | Linear gain + 4× oversampled true-peak limiter, instead of two-pass loudnorm. Stems are written unmastered. A `master` mode. | loudnorm fell back to dynamic mode (the peak-to-loudness ratio was 18 dB): it missed −1 dBTP and flattened the dynamics. A stem mastered alone does not match the mix. |
| `cues.mjs` | Beast bite reveal gain 0.8 → 1.4. | BEAST read 2 LU over the music. Now 6 LU. |
| `cues.mjs` | Hologram hum gain 0.7 → 0.25. | The hum bed covered the harp in the card section. |
| `cues.mjs` | Montage gale storm 0.8 → 0.6; meteor 0.7; kings impact gain 0.85, duck 0.75. | At the limiter, dense sounds win. These made the gale and the kings impact louder than the title. |
| `cues.mjs` | Boom duck 1 → 0.25; the title sword hit has no duck and gain 1.25. | The score hits on the same frame. A full duck cut the score's own hit. |
| `score.mjs` | `LEVELS`: montage 0.7 → −0.3, kings 0 → +5, title 0 → +3. The title's brass hit ff → fff. | The music carries the card section. The title is the biggest hit. |

Master, `soundtrack.wav`: **−14.0 LUFS integrated, −1.0 dBTP, LRA 10.7 LU** (the raw mix: −18.8 LUFS, −0.6 dBTP, gain +5.3 dB). The limiter takes more than 2 dB for 1.4 % of the time. Most of that is on transients of 20–40 ms (the most: 5.9 dB on the boom's crack). The title hit's body gets up to 5.3 dB for 0.8 s.

| Act (v2 retime, 59 s) | Integrated | True peak | Max momentary (400 ms) |
|---|---|---|---|
| I wake (0–9) | −21.4 LUFS | −4.4 dBTP | −15.7, the light landing |
| II court (9–34) | −15.3 | −1.1 | −10.1, the boom |
| III montage (34–42) | −11.0 | −1.1 | −8.7, the tutti into the stop |
| IV kings (42–52) | −13.6 | −1.2 | −8.5, **the kings impact** |
| V title (52–59) | −13.2 | −1.3 | **−7.4, the sword hit: the biggest of the trailer** |

The boom (9.0) is the loudest moment of Acts I and II.

- **Silence:** the black (8.58–9.0) is digital silence. The last 0.1 s is under −72 dBFS.
- **Sync:** no cue sounds before its time. 169 of 176 cues start within 33 ms. The other 7 are designed swells (the torch bed's 2.5 s fade-in, two reverse swells, the Ogre's push, the ram run-up, one whip, the tail wind). In the master, 83 of 90 percussive cues show an onset within 21 ms. The other 7 are under louder sound design by design (scan ticks under the scan sweep, the Guard's storm break under the resume, the first deal under its emblem). None fail.
- **Name reveals over the music:** ARCHER +13.4 LU, BEAST +6.2, MAESTER +6.5, OGRE +3.6 (the ram hit is −7 dBFS), GUARD +6.4.
- **Hygiene:** no clipping (float mix peak −1.3 dBFS), no clicks, no sample steps, DC under 1e-5. Energy below 25 Hz is 34 dB under the total. Worst L/R correlation −0.07; the mono sum is never under −3.3 dB (−3 dB = uncorrelated).
- **AAC:** the preview (AAC 256 kb/s) measures −14.1 LUFS and −0.8 dBTP.

## Open decisions for the owner

1. **Listen.** Every check here is a measurement. Watch `animatic-pass1-sound.mp4` (the first-pass animatic, so some cues miss the retimed picture) and say what to change.
2. **Music.** Keep the VSCO temp score, or license a track (PLAN.md recommends a licensed track). A licensed track replaces `score.mjs`, and the hits then move to the track's beats.
3. **Loudness target.** −14 LUFS / −1 dBTP suits YouTube and social video. For a web page embed, −16 LUFS limits less. Change `LUFS` and `CEILING`.
4. **Limiting on the title hit.** The title hit's body is limited by up to 5.3 dB. If it sounds squashed, lower `LEVELS.title` or the loudness target. The title then leads by less than its 0.8 dB now.
5. **The white before the title (65.5–66.4)** is not silent. The white ring fades, and the sword's glint, draw-back and drop lead into the hit (about −27 dBFS RMS). For a harder contrast, add `title: [[0.5, 1.28]]` to `HUSH`: silence from 65.5 s until the sword drops, then the drop whoosh into the hit.
6. **Act I** is led by sound design. The score is a soft drone until the boom, where the music drops in (PLAN.md row 3).
7. **VSCO credit.** It is not required. Add the requested credit to the video description if you want.
