/** R: the banner's cloth ripples down to its fringe, with light on the folds. G: the dust of the two wakes drifts out from each piece's foot, with a few pale grains. B: the two streamers wave along their run. */
export default `
vec4 card(vec2 q, vec3 m) {
  vec2 d = m.r * cloth(q, normalize(vec2(.34, .94)), 2.6, 1., .011) * vec2(.56, 1.);
  float run = dot(q, vec2(.98, .2)) * 7.;
  d.y += m.b * (wave(2., -run) * .72 + wave(3., .31 - run * 1.4) * .28) * .012 * gain();
  vec3 c = paint(q + d);
  float s = dot(q, vec2(.34, .94)) * 2.6;
  c *= 1. + m.r * (.07 * wave(1., .25 - s) + .03 * wave(2., .56 - s * 1.73));
  float a = max(min(m.r * 6., 1.), min(m.b * 6., 1.));
  if (m.g > .004) {
    bool left = q.x < .5;
    vec2 r = (q - (left ? vec2(.33, .8) : vec2(.785, .79))) * vec2(1.78, 1.);
    vec2 by = normalize(r) * .012 * vec2(.56, 1.);
    vec3 dust = flow(q, by, 2.);
    float pulse = breathe(1., left ? .1 : .6);
    float f = flecks(vec2(q.x * 16. / 9., q.y), 46., vec2(left ? -3. : 3., -3.), .2, left ? 3. : 9., .6);
    dust += vec3(1., .9, .72) * f * .4;
    c = mix(c, dust, m.g * (.55 + .45 * pulse));
    a = max(a, m.g * (.55 + .45 * pulse));
  }
  return vec4(c, a);
}`;
