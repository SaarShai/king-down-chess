/** R: the curse smoke drifts along its own waves and curls a little. G: its glow breathes beside the mane and on the wet floor. B: the night clouds drift past the moon. */
export default `
// As flow(), with a phase that changes over the smoke, so the whole cloud never fades at one moment. Two short fades per loop keep the smoke sharper than one long fade.
vec3 drift(vec2 q, vec2 by, float phase) {
  float a = fract(2. * t + phase), b = fract(2. * t + phase + .5);
  return mix(paint(q - by * (a - .5)), paint(q - by * (b - .5)), smoothstep(.15, .85, abs(2. * a - 1.)));
}
vec4 card(vec2 q, vec3 m) {
  vec3 c = paint(q);
  float cover = m.g;
  if (m.r > .004) {
    vec2 s = vec2(q.x * 16. / 9., q.y);
    vec2 d = m.r * stir(s, 7., 1., .006) * vec2(.56, 1.);
    // The wisps leave the knight, to the left. The travel rises and falls along the smoke's long waves.
    vec2 by = m.r * vec2(-.0085, .003 * sin(TAU * q.x * 5.)) * min(gain(), 2.);
    c = mix(c, drift(q + d, by, .55 * q.x + .3 * q.y), smoothstep(0., .12, m.r));
    cover = max(cover, smoothstep(0., .12, m.r));
  }
  if (m.b > .004) {
    c = mix(c, drift(q, vec2(.009, .001) * min(gain(), 2.), .4 * q.y), m.b);
    cover = max(cover, m.b);
  }
  float breath = .72 * breathe(1., .1) + .28 * breathe(2., .35);
  c += (c * .5 + vec3(.3, .1, .42)) * m.g * .24 * breath;
  return vec4(c, cover);
}`;
