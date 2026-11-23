# Daylight effects

Import from `src/interface/play/fx`. Time is in milliseconds. Points are CSS pixels from the top left of the viewport. Each effect uses the same clock. Supply an end callback for a frame effect that changes the page.

| API | Use | Example |
| --- | --- | --- |
| `startFx(player)` | Set the sound player and bind shared controls at page start. | `startFx(playDaylightSound)` |
| `setFxMotion(pace, reduce)` | Set Motion and the system preference. Off or Reduce ends active effects. | `setFxMotion('off', false)` |
| `reducedMotion()` | Read whether effects go to their end state at once. | `if (reducedMotion()) showResult()` |
| `onFrame(step, end?)` | Run on each clock frame. Return false to stop and run the end callback. | `onFrame((dt, now) => drawBreath(now), clearBreath)` |
| `tween(ms, draw, options?)` | Give the eased and raw fractions to a draw callback, then call `done`. | `tween(180, drawPanel, { curve: ease.EASE, done: showPanel })` |
| `later(ms, run)` | Run a cue on the effect clock. | `later(60, () => sound('pass'))` |
| `Effect.cancel()` | Stop an effect without applying its end state. | `cue.cancel()` |
| `Effect.finish()` | Stop an effect and apply its end state one time. | `cue.finish()` |
| `hold(ms)` | Stop the clock and scene for the given time. | `hold(55)` |
| `setPauseHook(hook?)` | Set the scene's pause and resume callback. | `setPauseHook(paused => scene.pause(paused))` |
| `ease` | Select EASE, OVER, out3, out2, in2, in3, io3, back or lin. | `ease.out3(.5)` |
| `new Spring(x, k, d)` | Start a spring at x. Set `to` to move it and change `v` to give it a kick. | `const lift = new Spring(0, 420, 26); lift.to = 21` |
| `Spring.step(deltaMs)` | Step the spring and read its position. | `onFrame(dt => { draw(lift.step(dt)); if (lift.still) return false }, () => draw(lift.to))` |
| `Spring.snap(x)` | Set the position and target at once. | `lift.snap(21)` |
| `at(element, x?, y?)` | Get a point at a fraction of an element's width and height. | `at(seat, .5, .8)` |
| `streak(from, to, options?)` | Send a curved line of light between two points and call `onArrive` at the end. | `streak(at(button), at(seat), { width: 6, ms: 340, onArrive: showTurn })` |
| `edgeLight(element, options?)` | Send a line of light round an element. | `edgeLight(undo, { width: 2.2, reverse: true })` |
| `burst(kind, point, options?)` | Draw a burst of sparks or dust. | `burst('dust', at(piece, .5, .8), { count: 4 })` |
| `strike(tile, options?)` | Draw the capture beat on a struck tile: rim light, brush slash and stone chips; `ranged` drops the slash. `beatAt(ms)` gives its schedule. | `strike(cell.getBoundingClientRect(), { from: at(attacker), height: 64 })` |
| `closeIn(tile)` | Draw the checkmate beat on the mated king's tile: a wax ring closes on its foot and a brass glint leaves it (480 ms). `closeAt(ms)` gives its schedule. | `closeIn(cell.getBoundingClientRect())` |
| `castIn(family, tiles, text)` | Draw a card's finale at the tiles it changed, one beat for each card family (`CAST_FAMILY` in `play/cast.ts`): brass studs (shift, trade), a riveted brass ring (ward; thin rings on each Firewall piece), gilt vellum flecks (change), a limestone crack (quake), a gilt lozenge at the first turn text of `text()` (rule). 440 ms; `castAt(ms)` gives its schedule. | `castIn('ward', [cells[sq]], () => [title])` |
| `shake(element, options?)` | Shake an element, then restore its position. | `shake(board, { amplitude: 2, ms: 220 })` |
| `sound(name, options?)` | Play a sound. Give the piece kind and, for a king, its name for recorded cues. | `sound('mark', { piece: N })` |
| `pulse(kind)` | Send a named vibration pattern when the switch is on. | `pulse('light')` |
| `setVibration(on)` | Set the Vibration switch. | `setVibration(false)` |

In reduced motion, drawing primitives end at once. Place an end-state sound in `done`, `onArrive` or the end callback of `onFrame`. Call `sound` for a cue that must play at the start.
