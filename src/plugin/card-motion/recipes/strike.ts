/** R: the red plume and free cape parts stir. G: soft pulses run through the dust away from the foot, with fine specks that drift out. B: one glint runs along the spear blade. */
export default `
vec4 card(vec2 q, vec3 m) {
  bool high = q.y < .3;
  vec2 d = high ? cloth(q, vec2(-.93, .36), 5., 1., .011) : cloth(q, vec2(-.9, .42), 4.2, 1., .010);
  d = m.r * (d + stir(q, 7., 1., .0025));
  float side = step(q.x, .49) * 2. - 1., pulse = 0.;
  if (m.g > .004) {
    // The dust pushes out from the foot and sinks back, so its flecks stay sharp; flow() would ghost them.
    vec2 a = vec2(q.x * 16. / 9., q.y), r = a - vec2(.87, .85);
    pulse = wave(2., -length(r) * 2.6);
    d += m.g * (normalize(r) * vec2(.56, 1.) * pulse * .0055 * gain() + stir(q, 16., 1., .002));
  }
  vec3 c = paint(q + d);
  if (m.g > .004) {
    vec2 a = vec2(q.x * 16. / 9., q.y);
    float f = flecks(a, 26., vec2(-side * 3., -3.), .17, 3., .6);
    c += vec3(1., .82, .52) * m.g * (f * .26 + .035 * (pulse + 1.));
  }
  if (m.b > .004) {
    float g = glint(q, vec2(.54, .84), 1., .03, .36);
    c += vec3(1., .94, .76) * m.b * (g * .2 + .035 * breathe(1., .36));
  }
  return vec4(c, max(smoothstep(0., .06, m.r), max(m.g, m.b)));
}`;
