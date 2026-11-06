/** R: slow ripples run out from the arm through the dark water. G: snow falls behind the figure. B: a band of light crosses the ice sleeve and its pale facets catch it. */
export default `
vec4 card(vec2 q, vec3 m) {
  vec3 c = vec3(0.);
  float a = max(m.r, m.b);
  if (a > .004) {
    // Rings seen at a low angle: wide on x, flat on y, centred where the arm enters the water.
    vec2 from = (q - vec2(.59, .80)) * vec2(1.78, 5.2);
    float r = max(length(from), .001), ring = wave(2., .1 - r * 2.2);
    vec2 d = m.r * normalize(from) * vec2(.56, .5) * (ring * .0075 + wave(3., .4 - r * 3.7) * .0025) * gain();
    c = paint(q + d);
    // The crests catch the sky a little.
    float crest = pow(.5 + .5 * ring, 5.) * smoothstep(1.9, .3, r);
    c += vec3(.62, .8, 1.) * m.r * crest * .07;
    float pale = smoothstep(.62, .92, dot(c, vec3(.3, .4, .3)));
    float band = glint(q, vec2(.55, .835), 1., .13, .12) * .15 + glint(q, vec2(-.3, .954), 1., .07, .62) * .08;
    c += vec3(.88, .96, 1.) * m.b * pale * band * mix(1., 1.5, (gain() - 1.) / 2.2);
  }
  vec2 air = vec2(q.x * 16. / 9. + .012 * wave(1., q.y * 1.7), q.y);
  float g = min(gain(), 1.8);
  float snow = m.g * max(flecks(air, 11., vec2(1., 3.), .075 * g, 3., .3) * .85, flecks(air + .31, 17., vec2(-1., 4.), .07 * g, 7., .3) * .55);
  float out_a = 1. - (1. - a) * (1. - snow);
  return vec4((c * a * (1. - snow) + vec3(.95, .97, 1.) * snow) / max(out_a, .001), out_a);
}`;
