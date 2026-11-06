/** R: each free rock sways as one rigid piece. G: the air, wind and clouds, flows round the whirl. B: each rock's own phase. */
export default `
// The way the painted strokes run, on a 13 x 8 grid; the length is the speed. Printed by tools/card-motion/masks/skylift.py.
const float AIR[208] = float[](-.07,.51,-.08,.59,-.22,.77,-.20,.79,-.27,.58,-.48,.34,-.80,-.03,-.75,-.46,-.45,-.71,-.09,-.79,.03,-.60,-.01,-.52,-.08,-.49,-.04,.51,-.05,.56,.03,.77,-.05,.79,-.23,.60,-.57,.44,-.66,.04,-.50,-.40,-.19,-.67,.22,-.70,.29,-.62,.01,-.51,-.04,-.50,-.00,.50,.03,.54,.07,.61,.01,.74,.02,.62,-.25,.56,-.23,.40,.19,-.18,.30,-.35,.37,-.45,.15,-.47,.09,-.51,-.01,-.50,.04,.50,.05,.51,.14,.56,.42,.62,.47,.65,.47,.60,.53,.48,.51,.35,.21,.07,.02,-.07,.39,-.46,.10,-.51,-.00,-.50,.08,.49,.10,.49,.21,.52,.49,.58,.66,.56,.74,.54,.80,.48,.70,.32,.37,.17,.45,-.36,.39,-.51,.16,-.51,.05,-.50,.12,.48,.14,.48,.21,.49,.31,.48,.44,.47,.66,.48,.74,.40,.68,.30,.63,-.21,.57,-.38,.33,-.47,.19,-.49,.12,-.48,.16,.47,.18,.47,.21,.45,.26,.43,.36,.41,.46,.34,.55,.24,.56,.06,.54,-.03,.47,-.26,.35,-.39,.23,-.44,.18,-.46,.18,.47,.20,.46,.23,.44,.28,.41,.34,.36,.42,.28,.48,.15,.50,.04,.49,-.01,.44,-.16,.36,-.33,.27,-.42,.22,-.45);
vec2 air(vec2 q) {
  vec2 g = clamp(q, 0., 1.) * vec2(12., 7.), f = fract(g);
  ivec2 i = ivec2(min(g, vec2(11., 6.)));
  if (g.x >= 12.) f.x = 1.;
  if (g.y >= 7.) f.y = 1.;
  int a = (i.y * 13 + i.x) * 2, b = a + 26;
  vec2 top = mix(vec2(AIR[a], AIR[a + 1]), vec2(AIR[a + 2], AIR[a + 3]), f.x);
  vec2 low = mix(vec2(AIR[b], AIR[b + 1]), vec2(AIR[b + 2], AIR[b + 3]), f.x);
  return mix(top, low, f.y);
}
// flow() with a shorter crossfade, so the painted strokes stay crisp for most of each cycle.
vec3 stream(vec2 q, vec2 by, float cycles) {
  float a = fract(cycles * t), b = fract(cycles * t + .5);
  return mix(paint(q - by * (a - .5)), paint(q - by * (b - .5)), smoothstep(.25, .75, abs(2. * a - 1.)));
}
vec4 card(vec2 q, vec3 m) {
  // A rock's offset is the same over all of it, so it does not bend. Big rocks (phase under .5) run once a loop and travel further.
  float big = step(m.b, .5), cycles = 2. - big, ph = m.b * 2.;
  vec2 sway = vec2(.56 * .55 * wave(cycles, ph + .25), wave(cycles, ph)) * mix(.0035, .0055, big) * min(gain(), 2.);
  vec2 at = q + m.r * sway;
  vec3 c = paint(at);
  if (m.g > .004) c = mix(c, stream(at, air(q) * vec2(.56, 1.) * .024 * min(gain(), 2.), 2.), m.g);
  return vec4(c, max(min(m.r * 6., 1.), m.g));
}`;
