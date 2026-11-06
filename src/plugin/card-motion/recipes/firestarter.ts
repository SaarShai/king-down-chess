/** R: the molten fire runs on along the wake toward the fortress and rises at the rook, with a slow wave of light. G: the three banners stir in the wind. B: small embers rise through the air. */
export default `
// Which way the fire runs here: along the wake on the floor, up at the blaze and the braziers. In painting units, so x counts less.
vec2 way(vec2 q) {
  vec2 wake = mix(vec2(.50, -.42), vec2(.39, -.70), smoothstep(.30, .46, q.x));
  return mix(wake, vec2(.05, -1.), smoothstep(.52, .38, q.y));
}
vec4 card(vec2 q, vec3 m) {
  vec2 iso = vec2(q.x * 16. / 9., q.y);
  vec3 c = paint(q);
  float cover = 0.;
  if (m.r > .004) {
    vec2 w = way(q);
    float g = min(gain(), 2.);
    vec2 wob = stir(iso, 9., 1., .0035) * m.r;
    vec2 by = w * .02 * g * m.r;
    float a = fract(2. * t), b = fract(2. * t + .5);
    vec3 fire = mix(paint(q + wob - by * (a - .5)), paint(q + wob - by * (b - .5)), smoothstep(.15, .85, abs(2. * a - 1.)));
    // A slow wave of light runs with the fire; bright paint takes it, dark paint does not.
    float s = dot(iso, normalize(vec2(w.x * 16. / 9., w.y))) * 5.;
    float pulse = .62 * wave(1., s) + .38 * wave(2., s * 1.7 + .2);
    fire *= 1. + .11 * (.7 + .3 * gain()) * pulse * m.r;
    c = fire;
    cover = min(m.r * 4., 1.);
  }
  if (m.g > .004) {
    vec2 along = q.x < .4 ? vec2(.1, .995) : vec2(.72, .69);
    vec2 d = cloth(q, along, q.x < .4 ? 6. : 4.5, 1., .009) * vec2(.56, 1.) * m.g;
    float f = texture(map, q + d).g;
    c = paint(q + d);
    float r = dot(q, along) * 6.;
    c *= 1. + .09 * f * wave(1., .25 - r);
    cover = max(cover, min(m.g * 6., 1.));
  }
  if (m.b > .004) {
    vec2 air = iso + stir(iso, 6., 1., .012);
    float e = flecks(air, 15., vec2(0., -4.), .1 * min(gain(), 1.8), 3., .6) + .75 * flecks(air + .31, 23., vec2(0., -7.), .1 * min(gain(), 1.8), 11., 1.);
    e = clamp(e, 0., 1.) * m.b * (1. - clamp(m.g * 6., 0., 1.));
    c = mix(c, vec3(1., .66, .24), e * .85);
    cover = max(cover, e);
  }
  return vec4(c, cover);
}`;
