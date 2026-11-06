/** R: the flame licks upward, with light that climbs through it. G: the fire's reflection shimmers and breathes on the wet floor. B: embers rise through the dark near the fire. */
export default `
vec4 card(vec2 q, vec3 m) {
  vec2 w = vec2(q.x * 16. / 9., q.y);
  // Each stretch of the wall keeps its own beat, so the fire never slides as one sheet.
  float beat = .3 * sin(w.x * 6. + w.y * 3.) + .17 * sin(w.x * 13. - w.y * 5. + 1.);
  vec3 c = paint(q);
  if (m.r > .004) {
    vec2 f = q + m.r * stir(w, 15., 2., .0035) * vec2(.56, 1.);
    vec2 by = vec2(.002, -.022) * m.r * min(gain(), 2.);
    float a = fract(2. * t + beat), b = fract(a + .5);
    vec3 fire = mix(paint(f - by * (a - .5)), paint(f - by * (b - .5)), abs(2. * a - 1.));
    float lick = wave(2., w.y * 2.6 + .35 * sin(w.x * 9.) + beat) * .07 + wave(1., w.y * 1.2 + w.x * .9) * .05;
    lick *= min(gain(), 1.6);
    c = mix(c, fire * (1. + lick), step(.004, m.r));
  }
  if (m.g > .004) {
    float shim = .55 * wave(2., q.x * 11. + .4 * sin(q.y * 17.)) + .45 * wave(1., q.x * 2. + q.y * 2.);
    vec3 wet = paint(q + vec2(m.g * .0016 * gain() * wave(2., q.y * 24. + q.x * 3.), 0.));
    c = mix(c, wet * (1. + .15 * shim) + vec3(1., .55, .18) * .035 * shim, m.g);
  }
  float e = 0.;
  if (m.b > .004) {
    vec2 s = w + vec2(.012 * wave(2., q.y * 2.), 0.);
    e = max(flecks(s, 15., vec2(0., -4.), .1, 3., .5), flecks(s + .31, 27., vec2(0., -6.), .13, 8., .7) * .7);
    e *= m.b;
    c = mix(c, vec3(1., .62, .2), e);
  }
  return vec4(c, max(max(m.r, m.g), e));
}`;
