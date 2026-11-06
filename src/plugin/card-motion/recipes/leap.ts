/** R: pines, bushes and grass sway in a wind that runs right to left, the way the stag leaps. G: the sun's glow and its reflection breathe. B: the clouds drift left. */
export default `
vec4 card(vec2 q, vec3 m) {
  vec2 r = vec2(q.x * 16. / 9., q.y);
  // The gust: a slow swell that passes right to left once per loop, and carries a faster sway.
  float gust = .35 + .65 * breathe(1., q.x * 1.3 + q.y * .3);
  vec2 sway = vec2(.0075 * .56 * wave(2., q.x * 2.4 + q.y * .5), .0012 * wave(2., q.x * 2.4 + .2)) * gust * gain();
  vec3 c = paint(q + m.r * (sway + stir(r, 26., 2., .0009)));
  if (m.b > .004) {
    // High clouds run a little faster than those on the horizon.
    vec3 sky = flow(q, vec2(-.021 * (1.2 - q.y * 1.2) * min(gain(), 1.6), 0.), 1.);
    // The sun's breath runs out over the clouds, late with distance, so the coin's sky shows it too.
    sky += vec3(1., .72, .5) * .065 * (1. + .35 * (gain() - 1.)) * breathe(1., .08 + (q.x - .907) * .5);
    c = mix(c, sky, m.b);
  }
  c += vec3(1., .78, .46) * m.g * .13 * breathe(1., .08);
  return vec4(c, max(smoothstep(0., .05, m.r), max(smoothstep(0., .02, m.g), smoothstep(0., .02, m.b))));
}`;
