# 03 · Game feel in a small webview

Research for ticket [03 · Game feel in a widget](../../specs/plugin-submission/issues/03-research-game-feel.md), and input to ticket [22 · A thematic look](../../specs/chatgpt-mvp/issues/22-thematic-redesign.md) and ticket [07 · Taste options](../../specs/plugin-submission/issues/07-taste-options.md). Written 2026-10-15. Repo state: branch `claude/plugin-ui-iphone` at `a7edf54a`. I read every source below on **2026-10-15**.

The earlier research ([chatgpt-plugin-environment.md](../chatgpt-plugin-environment.md), [f-host.md](../../specs/chatgpt-mvp/notes/f-host.md), [multiplayer-2026-10-10](../multiplayer-2026-10-10/README.md)) has almost nothing on motion, sound or haptics. This note fills that gap. Section 7 corrects old statements.

Labels:

- **[S1]**…**[S40]** a source in the [Sources](#sources) table (S36 is not used).
- **[Repo]** a fact from this repository, with a file path.
- **[Observed]** how a shipped game behaves. No publisher document gives it. Treat it as inference.
- **[2nd]** a secondary source (press, guide site).
- **[Inference]** my conclusion. It is not in any source.
- **(old)** the source is older than 2026.

---

## 1. Short answer

1. **OpenAI gives no rule for motion, sound or haptics.** The full Apps SDK text has no match for "haptic", "vibrat", "animation", "animate", "reduced motion" or "sound" [S2]. The visual rules are: system fonts only; brand colour on primary buttons, accents and badges; and "Avoid custom gradients or patterns that break ChatGPT's minimal look" [S1]. *Textured brick buttons and chest menus in the chrome are a review risk. Keep textures in the game surface (board, cards, kings) and on one primary action.* [Inference]
2. **Haptics are not available in practice.** MCP Apps has no haptics call [S3]. Chrome on Android and Android WebView block `navigator.vibrate` in cross-origin iframes (corrected in check: the data gives this for Android only), and Safari has no Vibration API [S5]. The ChatGPT widget is a cross-origin iframe ([f-host](../../specs/chatgpt-mvp/notes/f-host.md) §2, `domain`). The iOS 18 switch haptic is non-standard and needs a user tap [S6]. Plan for no haptics. Use sound (off by default) and a small visual impact.
3. **Safari runs `requestAnimationFrame` at 30 fps** in a cross-origin iframe until the first tap in it, and always in Low Power Mode [S7][S8] (old). Every loop must look right at 30 fps.
4. **Animate only `transform` and `opacity` on HTML elements** [S9][S10] (old). Blur and shadows repaint slowly [S9]. The plugin's scrims use `backdrop-filter: blur()` over a canvas that redraws about 30 times a second. Remove the blur.
5. **Timing scale:** press 60–90 ms; small state 120–200 ms; sheet 240–320 ms in and 150–200 ms out; one moment 300–700 ms; a win ceremony at most 1.5 s, skippable. This matches Material 3 tokens [S23], OpenAI's own UI kit [S4] and Lichess (120/250/500 ms) [S25]. Section 3.
6. **Card selection:** lift 8 px and scale 1.06 in 120–150 ms; glow by opacity of a pre-drawn layer; tilt only on large cards and only during a press; deal with 50–70 ms stagger; flip in 300–400 ms with `backface-visibility`. All compositor-only. Section 4.1.
7. **Live king emblems already exist** in the web game (`src/power-motion.ts`, `emblemArt`). The plugin's king sheet uses the same class names. Import it, add a 500–700 ms choice moment, and stop the loop after 5 s (WCAG 2.2.2 [S12]). Section 4.2.
8. **Brick buttons:** a static edge and a face that moves with `transform` only; down in 60–80 ms, up in 150–200 ms. Drive the press from pointer events, because iOS `:active` needs a touch handler [S11]. Section 4.3.
9. **Chest menus:** a lid (sheet header) that hinges open in 240–300 ms and contents that rise with a 30–40 ms stagger; a nested chest grows from the row that opened it. Section 4.4.
10. **Moves and captures:** the painted canvas already has gaits, strikes, impact shake, marker ripples and a king topple. Cheap gaps in the plugin: the lift tell is never used, the topple never animates, and there is no sound. Section 4.5.
11. **Win moment:** topple 650 ms, then "King Down" settles in 480 ms, then the end card rises in 320 ms. Tap skips. Keep a loss quiet. At most 3 flashes a second [S19]. Section 4.6.
12. **Reduced-motion gaps today:** captures and screen shake still play under the OS Reduce Motion setting; the global CSS rule removes fades too; and the plugin has no Animations setting, while the board's kings and pawns loop without end. Section 5.

---

## 2. Limits that shape every pattern

### 2.1 Host rules (OpenAI)

| Topic | Rule | Source |
|---|---|---|
| Motion, sound, haptics | No rule. Zero matches in the full Apps SDK text. | [S2] |
| Fonts | "Don't use custom fonts, even in full screen modes." | [S1] |
| Colour | "Use brand accent colors on primary buttons inside app display modes." "Use brand colors on accents and badges. Don't change text colors or other core component styles." | [S1] |
| Texture | "Avoid custom gradients or patterns that break ChatGPT's minimal look." | [S1] |
| Accessibility | WCAG AA contrast, alt text, text resizing. | [S1] |
| OpenAI's own UI kit | Apps SDK UI buttons: a `150ms` `ease` transition for hover and press (the loading swap fades 150 ms after a 100 ms delay, and out in 300 ms (corrected in check)); the press scales the background layer (`transform: scale(var(--scale))`). Easing tokens: enter `cubic-bezier(0.19, 1, 0.22, 1)`, exit `cubic-bezier(0.8, 0, 0.4, 1)`, snappy exit `cubic-bezier(0.65, 0, 0.4, 1)`, move `cubic-bezier(0.65, 0, 0.35, 1)`. | [S4] (old) |

*The host look is quiet: 150 ms changes and small scale presses. A game can be livelier inside its own surface. The review risk grows when headers, menus and secondary buttons get textures or gradients. The current plugin buttons already use a vellum gradient (`src/style.css:167`).* [Inference]

### 2.2 Platform limits inside the ChatGPT iframe

| Limit | Fact | Effect on King Down |
|---|---|---|
| Frame rate before the first tap | WebKit throttles rAF to 30 fps "on cross-origin iframes whose documents have never seen a user interaction"; it is "cleared as soon as an interaction on this frame or a child frame is detected" [S7] (old, 2017). | A welcome loop on iPhone runs at 30 fps until the first tap. *Do big one-shot moments after a tap.* [Inference] |
| Low Power Mode | rAF at 30 fps is "intentional" [S8] (old, 2020). (confirmed in check: current WebKit `main`, `Source/WebCore/platform/graphics/AnimationFrameRate.cpp`, still halves the frame rate for `LowPowerMode`, `NonInteractedCrossOriginFrame` and `AggressiveThermalMitigation`. So a hot phone also drops to 30 fps.) | Loops must look right at 30 fps. The board's idle loop already targets ~30 fps (`scene.mjs:854`). |
| Compositor | Only `transform` and `opacity` stay on the compositor [S9][S10]. "anything that involves a blur (like a shadow, for example) takes longer to paint" [S9]. Each layer "requires memory and management" [S10]. Use `will-change` "sparingly" [S9]. (old) | No animated `box-shadow`, `filter` or blur. Few layers. |
| `:active` on iOS | "the :active pseudo state is triggered only when there is a touch event set on the HTML element" [S11] (old, 2014, still open). | Press states must come from pointer events. |
| Haptics | No call in MCP Apps 2.0.3 [S3]. `navigator.vibrate`: Chrome Android and Android WebView "not supported in cross-origin iframes" since 55, and need a user gesture since 60; Safari: no support; Firefox Android: "Vibration is disabled" [S5]. iOS Safari 18 plays a haptic on `<input type=checkbox switch>`; a later fix requires user activation [S6] (old). | See section 4.7. |
| Audio unlock | An `AudioContext` made before a gesture starts "suspended"; call `resume()` after the gesture [S13] (old). | Unlock audio on the tap that turns Sound on. |
| iOS audio category | The native ambient category: audio "mixes" with other apps, and "the Silent switch … silence[s] your audio" [S14]. Web `navigator.audioSession` exists in Safari 16.4+, not in Chrome [S15]; its `ambient` type is "mixable with other types of audio" [S16] (old). | *Set `navigator.audioSession.type = 'ambient'` where it exists, so sounds mix with music and obey the Silent switch. Test it in the iOS app.* [Inference] |
| Reduced motion | MCP Apps host context has no motion field [S3]. | The widget reads `prefers-reduced-motion` itself (the board does: `PaintedView.ts:68`). |
| 3D flattening | `overflow` other than visible/clip, `opacity` < 1, `filter`, `clip-path`, `mask-image`, `isolation`, `mix-blend-mode` and paint containment force `transform-style: flat` [S18]. | A flip or tilt container must not have these. `button.emblem` has `overflow: hidden` (`power-motion.css:345`). |

CSS support [S17] (first version with support):

| Feature | Chrome | Safari | Firefox | Use |
|---|---|---|---|---|
| `linear()` easing | 113 | 17.2 | 112 | Spring curves without JS |
| `@starting-style` | 117 | 17.5 | 129 | Entry motion for `<dialog>` sheets |
| `transition-behavior` | 117 | 17.4 | 129 (partial) | Exit motion for `display: none` needs the `display` transition with `allow-discrete`: Chrome 117, Safari **18**, Firefox **no** (bug 1882408). The `<dialog>` `overlay` property is Chrome only. *(corrected in check: the 17.4 and 129 versions are for the property alone, not for the `display` transition)* |
| `document.startViewTransition` | 111 | 18 | 144 | Screen-to-screen change (optional) |
| `backface-visibility` | 36 | 15.4 (5.1 with `-webkit-`) | 16 | Card flip |
| `interpolate-size` | 129 | no | no | Do not use; height animation is layout work anyway |

### 2.3 Accessibility rules for motion

- **WCAG 2.2.2 Pause, Stop, Hide (Level A):** moving content that starts automatically, lasts more than five seconds and shows in parallel with other content needs "a mechanism for the user to pause, stop, or hide it" [S12]. This covers the live emblem loops and the board's idle kings and pawns.
- **WCAG 2.3.1 (Level A):** nothing "flashes more than three times in any one second period" [S19].
- **WCAG 2.3.3 (Level AAA):** "Motion animation triggered by interaction can be disabled"; `prefers-reduced-motion` is a sufficient technique [S20].
- **Apple HIG, Accessibility** (changed 2025-06-09, old): with Reduce Motion on, reduce "automatic and repetitive animations, including zooming, scaling, and peripheral motion"; tighten springs; track gestures directly; avoid animating depth; replace x, y and z transitions "with fades"; avoid animating blurs [S21].
- **Apple HIG, Motion** (changed 2025-09-09, old): "Aim for brevity and precision in feedback animations"; "generally avoid adding motion to UI interactions that occur frequently"; "Let people cancel motion"; games: "a consistent frame rate of 30 to 60 fps" [S22].

---

## 3. Timing scale

Reference values:

| Source | Values |
|---|---|
| Material 3 durations [S23] | short1–4: 50/100/150/200 ms; medium1–4: 250/300/350/400; long1–4: 450/500/550/600; extra-long1–4: 700–1000 |
| Material 3 easings [S23] | standard `(0.2, 0, 0, 1)`; emphasized decelerate `(0.05, 0.7, 0.1, 1)`; emphasized accelerate `(0.3, 0, 0.8, 0.15)` |
| Material 3 springs [S23][S24] | spatial (shape and bounds): damping 0.9, stiffness 1400/700/300 (fast/default/slow); effects (colour and alpha): damping 1, stiffness 3800/1600/800. *Settle within 2 %: about 126/178/271 ms and 95/146/206 ms; overshoot 0.15 %.* [Inference: my calculation, mass 1] |
| Apps SDK UI [S4] | 150 ms `ease` for button hover and press; the loading swap uses 150 ms with a 100 ms delay, and 300 ms (corrected in check) |
| Lichess web [S25] | None 0, Fast 120, Normal 250 (default), Slow 500 ms; puzzle storm 70 ms |
| chessground [S26] | default 200 ms; cubic ease-in-out (`t < 0.5 ? 4t³ : …`) |
| Lichess mobile [S27] | 150 ms piece animation |
| chess.com [S28][S29] | Slow, Medium (default), Fast, Natural, Arcade. "The Arcade animation style uses additional graphical resources and may reduce performance on some devices." No piece animation in the iOS app. |
| Repo tokens (`src/style.css:102-109`) | `--dur-1..4` = 120/200/320/480 ms; `--ease-out (0.2, 0.8, 0.2, 1)`; `--ease-spring (0.34, 1.4, 0.64, 1)`. *The spring overshoots by 5.3 % at 63 % of the time.* [Inference: my calculation] |

Recommended King Down scale [Inference]:

| Use | Duration | Easing |
|---|---|---|
| Press (button, square, card) | 60–90 ms down; 150–200 ms up | `--ease-out` down; standard or a short spring up |
| Small state (glow, chip, marker) | 120–200 ms | no overshoot |
| Sheet, panel, card travel | 240–320 ms in; 150–200 ms out | emphasized decelerate in; emphasized accelerate out |
| One moment (king choice, deal, flip) | 300–700 ms | spatial spring, at most ~5 % overshoot |
| Ceremony (win) | at most 1.5 s, tap skips | a sequence of the rows above |

Rules: frequent effects stay under ~400 ms and never block input (ticket 22, Apple [S22]). A loop that the player did not start stops within 5 s [S12]. Exits are shorter than entries. Keep the repo's four durations and three easings; add one token for emphasized decelerate. Do not add a motion library. [Inference]

---

## 4. Patterns

Each pattern gives: references, timings, technique, reduced motion, phone cost, and what the repo has now.

Phone cost scale [Inference from S9, S10, S39]:

- **Low:** `transform`/`opacity` on a few HTML elements.
- **Small paint:** a filter, shadow or SVG animation on a small area (under ~100 × 100 px).
- **Medium:** a full-board canvas redraw for a short time (under 1.5 s).
- **High:** a full-board canvas redraw that never stops, or a blur over a moving canvas.

### 4.1 Card selection: lift, glow, tilt, deal, flip

**References.**

- Hearthstone: the cards in hand fan; a touched card rises and grows; playable cards glow green. [Observed] The art director: "From the very beginning, we wanted Hearthstone to feel very physical" [S32] (old, 2nd).
- Marvel Snap: card upgrades add effects in steps: art breaks out of the frame, 3D art, animated art, a shiny logo, an animated border, then "Flares" that "add 3D effects on or around the card" [S33] (old, 2nd). The effects are layers over flat art.
- Balatro: selected cards rise out of the hand; cards sway and tilt; foil cards shimmer. [Observed] No first-party timing source exists.

**Timings and easing.**

| Effect | Value |
|---|---|
| Lift on select | `translateY(-8px) scale(1.06)` on cards 120 px or larger; `translateY(-3px) scale(1.08)` on the 34–44 px card coins. 120–150 ms, emphasized decelerate. Drop back in 150–200 ms. |
| Glow | Opacity 0 → 1 of a pre-drawn glow layer in 120–150 ms, no overshoot. An armed or chosen card may pulse 2 times (1.2 s each), then stay still [S12]. |
| Tilt | Only on cards 120 px or larger, only while a finger or pointer is down. Follow the pointer, at most 8–10°, `perspective` 600–800 px. Return in 250–300 ms with a spring. |
| Deal | Per card 280–320 ms, emphasized decelerate, stagger 50–70 ms. Start at the deck point with `scale(.85) rotate(±6deg)`; opacity reaches 1 in the first 30 %. Four cards take about 0.5 s, once per game. |
| Flip | 300–400 ms `rotateY(0 → 180deg)`, standard easing. Optional `scale(1.05)` at the midpoint, so the card lifts, then turns. |

**Technique.** Each card is an `<img>` in a `<button>`. Lift and tilt change `transform` only; the pointer handler writes two CSS variables in one `requestAnimationFrame`. The glow is an `::after` layer with a static `box-shadow` or radial image; only its `opacity` moves. A flip uses two faces with `backface-visibility: hidden` (add `-webkit-` for Safari below 15.4) under a parent with `transform-style: preserve-3d`, and no flattening property on the parent [S18]. The deal can use `element.animate()` with a delay per card.

**Reduced motion.** No lift travel, tilt or deal travel. A chosen card shows a static ring and a check mark. A flip becomes a 150 ms crossfade [S21].

**Phone cost.** Low. Four to ten small layers. Do not animate `box-shadow` or `filter`.

**Repo now.** [Repo]

- Card art: 10 faces and a back, 512 × 512 WebP, 380 KB in all, served as files (`public/ui/cards/`, `src/plugin/art.ts:1`).
- New game, Cards sheet: a checkbox list with 52 × 56 px thumbnails (`src/plugin/screens/setup.css:19`, `setup.ts:85-100`). No motion.
- Board: four card coins of 34 px (`board.css:11-12`). Tap opens a sheet with the card face and a "Use" button (`board.ts:166-178`). Armed state: an inset gold ring (`style.css:510`). No motion.
- Cheap now: lift and glow on a checked thumbnail; a deal and flip of the four coins from `back.webp` when a game starts; a lift on the armed coin; tilt on the large face in the card sheet.

### 4.2 Live king emblem: idle loop and choice moment

**References.**

- Marvel Snap: "Animated art" is an upgrade tier [S33] (old, 2nd). Hearthstone hero portraits react and speak. [Observed] Chess sites have no live emblems.
- Repo, web game: `emblemArt(king, img)` puts an SVG effect layer behind and in front of each emblem: Frost snow and stars, Flame embers and heat, Stratus gusts, Mud leaves, Spirit and Shadow motes (`src/power-motion.ts:276-284`). The loops last 1.5–3.4 s (`power-motion.css:366-393`). They run only while the emblem's button is pressed (`power-motion.css:350`); Animations Off and reduced motion show a still frame (`power-motion.css:35`, `style.css:681-683`). `powerArt(power)` adds a looping board vignette per power.
- Repo, heavier: `title-kings.mjs` draws the six live kings on canvases with their board effects; the board's king effects loop every 4–8 s (`king-effects.mjs`, `PERIOD`).

**Choice moment** (one tap; input never waits) [Inference]:

| Time | What moves |
|---|---|
| 0–80 ms | The tapped emblem presses: `scale(.94)`. |
| 80–380 ms | It pops to `scale(1.12)` and settles to 1 with `--ease-spring` (5 % overshoot). A ring grows `scale(.6 → 1.8)` and fades out over 400 ms. The other emblems fade to opacity .55 in 150 ms. |
| 150–470 ms | The king's figure (`public/ui/kings/<king>.webp`, 222 × 320) rises behind the panel: `translateY(16px → 0)` and opacity, 320 ms, emphasized decelerate. |
| 300–600 ms | The power buttons rise in, 40 ms stagger. |
| 600 ms + | The element effect loops for at most 5 s, then rests on its still frame with the rim light. A tap or focus starts it again. |

Sound, when on: one short chime at 80 ms.

**Technique.** HTML transforms and opacity for the pop, ring and figure. The effect layer stays SVG with CSS animation, as on the web.

**Reduced motion.** No pop, ring or rise. The figure crossfades in 150 ms. The emblem shows its still frame and rim light; the power-motion design makes the still frame a clear picture of the king.

**Phone cost.** Pop, ring and figure: low. The SVG effect layer: small paint (a 64 px box). *No source says whether Chrome or Safari composite CSS animations on SVG child elements; measure on the iPhone.* [Inference] Do not use the canvas title kings in a sheet: six canvases at ~30 fps is medium-to-high cost.

**Repo now.** The plugin's king sheet already renders `#king-picker`, `.king-pick`, `button.emblem` and `.power-choice` with the web's class names and `style.css` rules (`setup.ts:101-114`). It shows plain `<img>` emblems with no effect. Importing `emblemArt` and `powerArt` gives live emblems and power vignettes with little new code. Size: `power-motion.ts` 21 KB and `power-motion.css` 30 KB of source before minification; the page is 652,564 bytes against a 1,000,000-byte payload limit (section 7).

### 4.3 Tactile "brick" buttons

**References.**

- Hearthstone and Clash Royale: large primary buttons with a thick lower edge that sink when pressed. [Observed]
- OpenAI Apps SDK UI: the press scales the background layer, 150 ms `ease` [S4] (old).
- Apple: feedback must be brief and precise; avoid extra motion on frequent interactions [S22].

**Timings and easing.** Down: 60–80 ms, `--ease-out`. Up: 150–200 ms, standard easing; a 5 % overshoot only on the primary action. Keep the pressed state on screen for at least ~90 ms, so a quick tap still shows it. [Inference]

**Shape.** Primary action: a 5–6 px edge; secondary: 3–4 px; the face moves down by the edge depth minus 1 px. The face can carry a stone tile cut from the board art (a light tile of `public/ui/stone-board.webp`, about 80 px) as a 9-slice `border-image`, so its bevel does not stretch. Label in the system font [S1]. A disabled button is flat, with no edge (as now, `style.css:184-187`).

**Technique.** The edge is a static layer (the button's background or `::before`). The face is an inner element that moves with `transform` only. A soft shadow under the button is an `::after` whose `opacity` changes. Set a `data-down` attribute on `pointerdown` and clear it on `pointerup`, `pointercancel` and `pointerleave`; do not rely on `:active` alone [S11]. Space and Enter key-down press too.

**Sound.** Off by default. When on: a short knock (the `move` sound in `src/render/sfx.ts`, at lower gain, 50 ms).

**Reduced motion.** Keep the press: it tracks the finger, which Apple allows [S21]. Remove the overshoot.

**Phone cost.** Low. Today the press is `translateY(2px)` plus a `box-shadow` change in 80 ms (`style.css:171`, `:176`): a small paint per press, also acceptable.

**Review risk.** Stone texture on every button is a "custom pattern" [S1]. *Option: stone only on the one primary game action per screen (Play, Start, Use) and on in-board controls; host-like flat buttons elsewhere.* [Inference] This is a taste call for the owner (section 6).

### 4.4 Menus as chests

**References.**

- Clash Royale: chests are the reward container. Supercell replaced Lucky Drops with Lucky Chests on 2025-09-25: "Were you lowkey missing chests? Us too!" [S35] (old).
- Hearthstone: the UI is a physical object; it "is not just a window to the game, but the game itself in a way" [S32] (old, 2nd); GDC 2015 talk on its immersive UI [S31] (old).

**Pattern.** Opening a menu lifts a lid and raises the contents. A submenu is a smaller chest that opens out of the row you tapped. Closing is the reverse, and faster.

**Timings and easing** [Inference]:

| Step | Value |
|---|---|
| Lid (sheet header) | From `perspective(700px) rotateX(-70deg)` with `transform-origin: top` to none, 240–300 ms, emphasized decelerate. |
| Contents | Each row `translateY(12px → 0)` and opacity, 200–240 ms, 30–40 ms stagger, at most 6 rows staggered. |
| Nested chest | The child grows `scale(.92 → 1)` from the tapped row (`transform-origin` at the row centre), 240 ms. The parent goes to `scale(.97)` and opacity .6. |
| Close | 150–200 ms, emphasized accelerate. |

**Technique.** The sheets are `<dialog>` elements with a `.scrim` (`setup.ts:73-86`, `board.ts:39`). Use `element.animate()` on open and close. `@starting-style` gives the entry (Safari 17.5) [S17], but a CSS exit to `display: none` needs Safari 18 and does not work in Firefox, so the close stays on `element.animate()` (corrected in check). Do not animate height. A view transition between screens is optional (Safari 18) [S17].

**Reduced motion.** A 150 ms crossfade. No rotation and no scale: Apple says avoid animating depth and use fades [S21].

**Phone cost.** Low for the sheet. **High today for the scrim:** `.scrim` has `backdrop-filter: blur(2px)` (`app.css:34`) and the board veil has `blur(3px)` (`app.css:102`). A blur over a canvas that redraws ~30 times a second must re-blur each frame, and fading the scrim animates the blur [S9]. Use a plain translucent scrim. [Inference]

**Risk.** In games a chest means a random reward. The plugin must not sell digital goods and must suit ages 13–17 ([f-host](../../specs/chatgpt-mvp/notes/f-host.md) §11). *Use the chest as a container only: no spins, no rarity reveal, no locks with a price.* [Inference]

### 4.5 Piece move and capture feedback

**References.**

- Lichess: move animation 0/120/250/500 ms, default 250 [S25]; chessground default 200 ms, cubic ease-in-out [S26]; Lichess mobile 150 ms, a light haptic on a move or capture and a medium haptic on check, haptics on by default [S27].
- chess.com: an "Arcade" style with extra graphics, as an option, with a performance warning [S28][S29].
- "Juice It or Lose It" (GDC Europe 2012) showed small tweens and squash that make a game feel alive [S37] (old, 2nd). "Don't Juice It or Lose It" (2014) warns that too much "eye candy" costs immersion [S38] (old, 2nd).

**What the canvas has now** [Repo]:

| Feature | Value | Where |
|---|---|---|
| Quiet-move gaits | walk 440 ms, glide 350–480 ms, hop 420 ms | `gait.mjs:55-57` |
| Piece strikes | 900–1400 ms per piece type, each king's own death for the victim | `scene.mjs:53`, `king-captures.mjs` |
| Impact shake | 7 board units (of 960) for 240 ms; about 3 px on a 390 px board | `scene.mjs:605` |
| Marker pop | 300 ms, 38 ms ripple per step | `marks.ts:79-80` |
| Lift tell | 3 px lift and glow on a chosen piece; a still glow under reduced motion | `PaintedView.ts:157`, `scene.mjs:619` |
| King topple | 650 ms | `scene.mjs:53` |
| Plugin pace | `fast` (half duration); `off` only with symbols-only | `board-view.ts:8`, `:19` |

**Recommendations** [Inference]:

- Own move at `fast` (a gait takes about 210–240 ms, near Lichess Normal). The opponent's move: keep `fast`, or play it at normal speed so the player sees it. This is a taste call.
- Turn on the lift tell when the player picks a piece (`board.setLifted(square)`); the plugin never calls it.
- Keep the shake at most 240 ms and 3 px on a phone.
- When Sound is on, play the `move`, `capture`, `check`, `shove`, `shot`, `chain` and `swap` sounds; `animateMove` already has an `onContact` callback for the strike.
- Never block input: `skip()` ends a running move.

**Reduced motion.** A short slide still shows where a piece went; that is information. Strikes and the shake are decoration: under reduced motion, play a capture as the slide plus a 150 ms fade of the victim, with no shake. Today `applyLively` keeps `moves` and `captures` on under reduced motion (`PaintedView.ts:168-172`), and the shake is not gated (`scene.mjs:605`).

**Phone cost.** Medium for each move (full-board canvas for under 1.5 s). High while idle: the kings' effects and the resting pawns redraw the full board about every 33 ms while the board shows (`scene.mjs:854`), at up to 2× backing resolution (`PaintedView.ts:102`). MDN's canvas advice applies: pre-render repeated parts and keep static parts on a separate layer [S39].

### 4.6 Win and lose moment

**References.**

- Hearthstone: the beaten hero's portrait cracks and breaks; a large victory or defeat banner. Marvel Snap: cubes fly to the winner. Clash Royale: the king tower falls and crowns fill. Chess sites: a quiet result panel. [Observed]
- Balatro: a friend suggested "a flaming effect on your score", and the developer kept it [S34].
- Repo, web game: `ceremony.ts` settles the "King Down" words in 480 ms (`scale(1.08 → 1)`, opacity) and raises result tiles in 300 ms with a 150 ms stagger (`ceremony.css:14-29`). The plugin does not use it.
- Repo, plugin: the end card shows both kings, "King Down" and the result, with no motion (`end.ts:53-61`). The board shows the fallen king without the topple: `setFallen(…, false)` (`board.ts:243`).

**Win sequence** (at most 1.5 s; a tap skips to the end state) [Inference]:

| Time | What happens |
|---|---|
| 0 | The last move plays. |
| 0–650 ms | The beaten king topples (`setFallen(square, true)`), only when the end arrives live, not on reload. |
| 650–1130 ms | "King Down" settles (the web's 480 ms keyframes). A short sound if Sound is on. |
| 800–1120 ms | The end card rises: `translateY(24px → 0)` and opacity, 320 ms, emphasized decelerate. The winner's king image rises 12 px. |
| 1100 ms + | Rating and badge rows rise, 300 ms, 150 ms stagger. |

**Lose.** The same order, quieter: no ring, no overshoot, the loser's image at opacity .6 (not an animated grayscale filter). *No mocking words or effects; earlier research cites "no punishing states" for onboarding* ([appendix A, ux-guidelines:F27](../multiplayer-2026-10-10/appendix-a-user-journey-findings.md)).

**Rules.** At most 3 flashes in any second [S19]; no full-screen flash. The card's buttons work at once.

**Reduced motion.** The king shows fallen at once (as today). The card fades in over 150 ms.

**Phone cost.** The topple: medium for 650 ms. The card: low.

### 4.7 Haptics and sound

**Haptics: the facts.**

| Platform in the ChatGPT app | Result |
|---|---|
| Android (WebView, cross-origin iframe) | `navigator.vibrate` not supported in cross-origin iframes since version 55 [S5]. |
| iOS and iPadOS | No Vibration API in Safari [S5]. A `<input type=checkbox switch>` plays a haptic on iOS 18 Safari, with user activation [S6]. *Unknown inside the ChatGPT app's web view and inside a nested cross-origin iframe; test it.* [Inference] |
| Web and desktop | No haptics. |
| Host API | None in MCP Apps [S3] or the Apps SDK [S2]. |

Apple's haptic rules still apply to any haptic: use them consistently, pair them with visual and sound feedback, avoid overuse, "Make haptics optional" [S30] (old).

**Recommendation** [Inference]: no haptics in the MVP. Do not use a hidden switch to make vibrations: it is not a standard, it needs a tap anyway, and WebKit already closed one misuse [S6]. If the owner wants haptics, test one honest case: a visible Sound/Haptics toggle built as a real `switch` input, which gives the system's own haptic when the player flips it. If a platform ever offers haptics, copy Lichess mobile: light for a move or capture, medium for check [S27].

**Sound.** `src/render/sfx.ts` makes all sounds with Web Audio, no files (4 KB of source): move 50–70 ms, capture 220 ms, check 700 ms. The plugin does not use it. Recommendation: a Sound setting, off by default (owner's brief); the tap that turns it on calls `resume()` [S13]; set `navigator.audioSession.type = 'ambient'` where it exists [S15][S16]; no sound in reduced-motion logic (they are separate settings).

---

## 5. What the repo can do cheaply now

Ranked by value for cost [Inference]. "Taste" means the owner picks from options (ticket 07).

| # | Change | Existing code | New work | Cost on phone | Taste? |
|---|---|---|---|---|---|
| 1 | Animate the topple when a game ends live | `scene.setFallen` (`scene.mjs:53`); call at `board.ts:243` passes `false` | Pass `true` for a live end only | Medium, 650 ms once | No |
| 2 | Lift tell on the chosen piece | `PaintedView.setLifted` (`PaintedView.ts:157`) | Call it on select and clear it on move | Low | No |
| 3 | Plain scrims, no blur | `.scrim`, `.veil` (`app.css:34`, `:102`); also `dialog::backdrop` blur(2px) in `style.css:288`, which the plugin loads and which applies to its `showModal()` dialogs (`wait.ts:129`) (corrected in check) | Remove `backdrop-filter` | Lowers cost | No |
| 4 | Reduced motion: no shake or strikes; fades kept | `applyLively` (`PaintedView.ts:168`); global rule (`style.css:681-683`) | Gate captures and shake; allow ≤ 150 ms opacity fades | Lowers cost | No |
| 5 | A way to stop loops (WCAG 2.2.2) | Web has Animations normal/fast/off; plugin settings have only `symbols_only`, `show_threats` (`settings.ts:12`) | An Animations setting, or idle effects that rest after ~20 s without input and wake on a tap | Lowers cost | Wording only |
| 6 | Live emblems and power vignettes in the king sheet | `emblemArt`, `powerArt` (`power-motion.ts:171`, `:280`); same class names in `setup.ts:101-114` | Import; cap loops at 5 s | Small paint | Partly |
| 7 | King choice moment (pop, ring, figure rise) | `--ease-spring`, king figures in `public/ui/kings/` | ~40 lines of CSS and one class toggle | Low | Yes |
| 8 | Card deal and flip of the four coins; lift on the armed coin | `back.webp`, faces, coin markup (`board.ts:166-196`) | CSS keyframes and a delay per coin | Low | Yes |
| 9 | Sound, off by default | `snd` in `sfx.ts`; `onContact` in `animateMove` | A setting and five calls | None (CPU only while a sound plays) | Default only |
| 10 | Chest open and close for sheets | `sheet()` (`setup.ts:73`), `boardSheet` (`board.ts:39`) | `element.animate()` on open and close | Low | Yes |
| 11 | Brick buttons | `button` rules (`style.css:163-188`) | Plugin CSS for the edge and face; pointer-driven press | Low | Yes; review risk |

---

## 6. Taste options for the owner (input to ticket 07)

Three levels per item. Each option stays compositor-only and keeps the reduced-motion rules [Inference].

| Item | Quiet (host-like) | Lively (recommended start) | Bold (game-like) |
|---|---|---|---|
| Buttons | Today's vellum press, 2 px | Stone face on the primary action only, 5 px edge | Stone on all buttons, 6 px edge, knock sound |
| Menus | Sheet slides up, 240 ms | Lid hinge plus rising rows | Lid hinge, nested chest from the row, parent recedes |
| King choice | Static emblems, rim light | Live emblem for 5 s, pop and ring | Plus the king figure rising and a chime |
| Cards | Static ring on a chosen card | Lift and glow; deal of the four coins | Plus flip from the back, tilt on the large face, foil sheen |
| Moves | Fast pace, no sound | Fast pace, lift tell, sound option | Normal pace for the opponent's move, sound on |
| Win | End card fades in | Topple, words, card rises | Plus the king's own death on the board and a short fanfare |

---

## 7. Corrections to earlier notes

| Earlier note | What it says | What is true on 2026-10-15 |
|---|---|---|
| [f-host.md](../../specs/chatgpt-mvp/notes/f-host.md) §0 fact 1, §8 | The page inlines all art; 4,293,039 bytes; build fails above 4,400,000; about 100 KB headroom. | Art is served as files (ticket 09). The build fails above **1,000,000** payload bytes and on any inlined raster image (`tools/plugin-ui-build.mjs:49-51`). The built page is **652,564 bytes** (`plugin-server-dist/board.html`, built 2026-10-15 11:28). New motion code fits. [Repo] |
| [notes/a-plugin.md](../../specs/chatgpt-mvp/notes/a-plugin.md) lines 84, 91, 231 | `board.setPace('off')`: no move animation; no animation of opponent moves. | The plugin uses `fast` (`board-view.ts:8`) and `off` only with symbols-only (`:19`). Replayed moves animate (`board.ts:122`, `:288`). Still true: no sound, no lift tell. [Repo] |
| [chatgpt-plugin-environment.md](../chatgpt-plugin-environment.md) P2 | Test whether sound is useful and supported. | Still untested in the host. New facts: OpenAI has no sound rule [S2]; audio needs a gesture [S13]; on iOS the ambient category obeys the Silent switch [S14]. |
| [chatgpt-plugin-feasibility-2026-10-07.md](../chatgpt-plugin-feasibility-2026-10-07.md) line 139 | Test motion preferences. | The host passes no motion field [S3]; the iframe reads `prefers-reduced-motion`. Gaps listed in section 5, rows 4–5. |

---

## 8. Open questions and tests for ticket 06

1. On an iPhone in the ChatGPT app: does the board's idle loop hold ~30 fps, and how warm does the phone get in 10 minutes? Read `scene.frames` per second and use the Safari Web Inspector timeline.
2. Is the first screen at 30 fps before the first tap [S7]? Check a loop on the home card.
3. Does a `switch` input give a haptic inside the ChatGPT iOS app's widget?
4. Does Web Audio play after the "Sound on" tap in the iOS and Android apps, and does `navigator.audioSession.type = 'ambient'` obey the Silent switch there?
5. Are the SVG emblem effects smooth on a mid-range Android phone?
6. Does a reviewer see stone-textured chrome as a "custom pattern"? Ask through the submission notes or test with one textured primary action only (ticket 01).

---

## Sources

All read on 2026-10-15. "Date" is the page's own date, or the last commit to the file, where one exists.

| Key | Source | Date | Notes |
|---|---|---|---|
| S1 | [OpenAI UI guidelines](https://developers.openai.com/apps-sdk/concepts/ui-guidelines) (same text at [/plugins/concepts/ui-guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines)) | none shown | Fonts, colour, gradients, accessibility |
| S2 | [Apps SDK full text](https://developers.openai.com/apps-sdk/llms-full.txt) | none shown | Searched for motion, sound and haptic words |
| S3 | [MCP Apps, `@modelcontextprotocol/ext-apps`](https://github.com/modelcontextprotocol/ext-apps) 2.0.3 (npm, modified 2026-09-28); repo code search for "haptic", "vibrate", "reduced-motion" | 2026-09-28 | No haptics, no motion field |
| S4 | [OpenAI Apps SDK UI](https://github.com/openai/apps-sdk-ui): `src/styles/variables-semantic.css`, `src/components/Button/Button.module.css` | 2025-11-21 (old) | Motion tokens, press style |
| S5 | [MDN `Navigator.vibrate`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate) and [browser-compat-data `api/Navigator.json`](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json) | 2025-11-30 (old) | Sticky activation; iframe and browser support |
| S6 | [WebKit bug 285120](https://bugs.webkit.org/show_bug.cgi?id=285120) | 2024-12-23, fixed 2025-01-03 (old) | Switch haptic since iOS Safari 18.0; needs user activation |
| S7 | [WebKit r215070](https://trac.webkit.org/r215070) | 2017-04-06 (old) | rAF 30 fps in non-interacted cross-origin iframes |
| S8 | [WebKit bug 215745](https://bugs.webkit.org/show_bug.cgi?id=215745) | 2020-08-21 (old) | rAF 30 fps in Low Power Mode is intentional |
| S9 | [web.dev: How to create high-performance CSS animations](https://web.dev/articles/animations-guide) | 2020-10-06 (old) | transform/opacity; blur paint cost; `will-change` |
| S10 | [web.dev: Stick to compositor-only properties](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count) | 2015-03-20 (old) | Layer memory cost |
| S11 | [WebKit bug 138816](https://bugs.webkit.org/show_bug.cgi?id=138816) | 2014-11-17, status NEW (old) | `:active` needs a touch handler |
| S12 | [WCAG 2.2 Understanding 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | — | Level A; 5-second rule |
| S13 | [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay) | 2017-09-13 (old) | Suspended AudioContext; `resume()` after a gesture |
| S14 | [Apple: `AVAudioSession.Category.ambient`](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/ambient) | none shown | Mixes; Silent switch silences |
| S15 | [browser-compat-data `Navigator.audioSession`](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json) | — | Safari 16.4; no Chrome |
| S16 | [W3C Audio Session, Editor's Draft](https://w3c.github.io/audio-session/) | 2024-11-13 (old) | `ambient` type |
| S17 | [browser-compat-data](https://github.com/mdn/browser-compat-data): `css/at-rules/starting-style.json`, `css/properties/transition-behavior.json`, `css/types/easing-function.json`, `css/properties/backface-visibility.json`, `api/Document.json`, `css/properties/interpolate-size.json` | — | Support versions in section 2.2 |
| S18 | [MDN `transform-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-style) | 2026-07-26 | Grouping properties force flat |
| S19 | [WCAG 2.2 Understanding 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) | — | Level A; 3 flashes |
| S20 | [WCAG 2.2 Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | — | Level AAA; C39 technique |
| S21 | [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | 2025-06-09 (old) | Reduce Motion practices |
| S22 | [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | 2025-09-09 (old) | Brevity, cancel, 30–60 fps |
| S23 | [Material 3 motion tokens, `material-web`](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-motion.scss) | 2026-04-06 | Durations, easings, springs |
| S24 | [Compose Material 3 `MotionScheme.kt`](https://github.com/androidx/androidx/blob/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt) | — | Spatial vs effects specs |
| S25 | [Lichess `Pref.scala`](https://github.com/lichess-org/lila/blob/master/modules/pref/src/main/Pref.scala) | 2026-10-14 | `animationMillis` |
| S26 | [chessground `state.ts`](https://github.com/lichess-org/chessground/blob/master/src/state.ts), [`anim.ts`](https://github.com/lichess-org/chessground/blob/master/src/anim.ts) | 2026-09-13, 2026-07-03 | 200 ms; easing |
| S27 | [Lichess mobile `move_feedback.dart`](https://github.com/lichess-org/mobile/blob/main/lib/src/service/move_feedback.dart), [`board_preferences.dart`](https://github.com/lichess-org/mobile/blob/main/lib/src/model/settings/board_preferences.dart) | 2026-10-04, 2026-09-14 | Haptics and 150 ms |
| S28 | [chess.com: Live Chess settings](https://support.chess.com/en/articles/8614003-live-chess-settings) | 2025-12-19 (old) | Animation styles |
| S29 | [chess.com: change piece animation](https://support.chess.com/en/articles/15880023-how-do-i-change-piece-animation) | 2026-07-09 | Arcade performance; no iOS animation |
| S30 | [Apple HIG: Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics) | 2024-05-07 (old) | Haptic rules |
| S31 | [GDC Vault: Hearthstone: How to Create an Immersive User Interface](https://gdcvault.com/play/1022036/Hearthstone-How-to-Create-an) | 2015 (old) | Talk overview only |
| S32 | [Inven Global: Ben Thompson interview](https://www.invenglobal.com/articles/1554/how-hearthstones-art-director-ben-thompson-breathed-life-into-hearthstone) | 2017-04-11 (old, 2nd) | Physical feel; UI is the game |
| S33 | [Marvel Snap Zone: Infinity Splits](https://marvelsnapzone.com/infinity-splits/) | 2025-05-15 (old, 2nd) | Card upgrade effects |
| S34 | [LocalThunk: The Balatro Timeline](https://www.localthunk.com/blog/balatro-timeline-3aarh) | "Mar 6", no year (old) | Flaming score |
| S35 | [Supercell: Clash Royale October update 2025](https://supercell.com/en/games/clashroyale/blog/release-notes/october-update-2025) | 2025-09-25 (old) | Chests back |
| S37 | [Game Developer: GDC Europe 2012 top sessions](https://www.gamedeveloper.com/business/gdc-europe-2012-details-the-top-sessions-for-next-week-s-show) | 2012-08-08 (old, 2nd) | "Juice It or Lose It" |
| S38 | [Game Developer: Don't Juice It or Lose It](https://gamedeveloper.com/design/video-indies-resist-the-urge-to-juice-it-or-lose-it-) | 2014-10-17 (old, 2nd) | Counterpoint |
| S39 | [MDN: Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) | 2026-08-25 | Pre-render; layered canvases; no `shadowBlur` |
| S40 | [web.dev: prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion) | 2019-03-11 (old) | "reducing animations is a medical necessity" for vestibular disorders |

Not verified: whether Chrome or Safari composite CSS animations on SVG child elements; how WebKit maps the web `ambient` audio type to the native category; whether the ChatGPT iOS app's web view gives switch haptics. One third-party tester page claims a change to programmatic iOS haptics in iOS 26.5; I found no Apple or WebKit note to confirm it.
