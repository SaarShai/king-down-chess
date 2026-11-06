/** R: the violet wisps stir and pulse, and the cracks' light pulses in place. G: left of x = .645, lilac light breathes and sparks rise in the air round the knight; right of it, clouds drift and the sun's glow breathes. B: the hanging flowers sway from their tops. */
export default `
vec4 card(vec2 q, vec3 m) {
  vec2 w = vec2(q.x * 16. / 9., q.y);
  // Above .5, R is free paint; at .5 and below it is light on the still knight.
  float free = smoothstep(.55, .95, m.r);
  vec2 d = free * stir(w, 16., 1., .006) * vec2(.56, 1.);
  d.x += m.b * (.0065 * wave(1., q.x * 5. - q.y * .8) + .0022 * wave(2., q.x * 11. + q.y * 2.)) * gain();
  d.y += m.b * .0016 * wave(2., q.x * 7.) * gain();
  vec3 c = paint(q + d);
  float a = max(m.r > .02 ? min(m.r * 2., 1.) : 0., min(m.b * 3., 1.));

  // The light runs along the wisps and the cracks.
  float pulse = .55 * wave(1., q.x * 1.5 - q.y * 2.) + .45 * wave(2., q.y * 4. + q.x * 2.);
  c += vec3(.74, .56, .98) * m.r * (.08 + .07 * sqrt(gain()) * pulse);

  if (q.x < .645) {
    // The air: a soft breath, and two sizes of spark that rise.
    float big = sqrt(gain());
    c += vec3(.66, .46, .86) * m.g * (.03 + .05 * big * breathe(1., .12));
    float s1 = flecks(w, 26., vec2(1., -4.), min(.15 * big, .2), 3.1, .85);
    float s2 = flecks(w + vec2(.31, .17), 44., vec2(-1., -6.), min(.17 * big, .2), 8.7, .9);
    c = mix(c, vec3(.88, .74, 1.), m.g * s1 * .85);
    c = mix(c, vec3(1., .92, .74), m.g * s2 * .75);
    a = max(a, m.g * max(max(s1, s2), .75));
  } else if (m.g > .004) {
    // The sky: clouds drift a short way, away from the sun's disc, and the glow breathes round the sun.
    vec2 fromSun = vec2((q.x - .85) * 16. / 9., q.y - .245);
    float far = smoothstep(.05, .11, length(fromSun));
    vec3 sky = flow(q, vec2(.016 * far, 0.), 1.);
    float near = exp(-dot(fromSun, fromSun) / .09);
    sky += vec3(1., .66, .36) * near * (.03 + .1 * breathe(1., .45));
    c = sky;
    a = max(a, m.g);
  }
  return vec4(c, a);
}`;
