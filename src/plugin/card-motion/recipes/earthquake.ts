/** R: the dust plumes roll up and outward with a slow warm breath, and fine grit rises in them. G: the chips in the air bob as rigid stones. B: the far banners ripple. */
export default `
// Like flecks, but "keep" sets how many cells hold a fleck, so grit stays sparse.
float grit(vec2 q, float cells, float rise, float radius, float seed, float keep) {
  vec2 g = q * cells + vec2(0., rise * t), id = floor(g), f = fract(g);
  id.y += rise * floor(-id.y / rise);
  float h = hash(id + seed), r = radius * (.6 + .4 * fract(h * 7.3));
  vec2 c = .25 + .5 * vec2(h, fract(h * 13.7));
  // A fleck that wraps in a loop repeats up its column; still patches of no grit hide the repeat.
  float area = sin(q.x * 11. + 1.7 * sin(q.y * 8.)) * sin(q.y * 14. + q.x * 4. + seed);
  return smoothstep(r, r * .35, length(f - c)) * step(1. - keep, fract(h * 3.1)) * breathe(1. + floor(h * 2.), h) * smoothstep(.05, .45, area);
}
vec4 card(vec2 q, vec3 m) {
  float g = gain();
  vec2 bob = m.g * vec2(.0026 * wave(1., q.x * 5.3 + q.y * 3.7), .0055 * wave(1., q.x * 4.1 - q.y * 2.9 + .2)) * min(g, 1.6);
  vec2 ban = m.b * cloth(q, vec2(0., 1.), 6., 1., .0026);
  vec2 p0 = q + bob + ban;
  vec3 c = paint(p0);
  c *= 1. + m.b * .09 * wave(1., .25 - q.y * 6.);
  if (m.r > .004) {
    vec2 r = q - vec2(.5, .62);
    vec2 out_ = normalize(vec2(r.x * .56, r.y * .25 - .22));
    vec3 d = flow(q + m.r * stir(q, 11., 1., .0022), out_ * vec2(.56, 1.) * .021, 2.);
    float at = length(r * vec2(1.25, 1.)) * 4.;
    d += vec3(1., .72, .38) * .1 * min(g, 1.5) * breathe(1., .1 - at) * (.6 + .4 * breathe(2., q.x * 2.1));
    vec2 a = vec2(q.x * 16. / 9., q.y);
    d = mix(d, vec3(.17, .1, .06), .85 * grit(a, 30., 3., .11, 2., .5));
    d += vec3(1., .82, .55) * .28 * grit(a, 24., 3., .1, 7., .45);
    c = mix(c, d, m.r * (1. - m.g));
  }
  return vec4(c, max(max(m.r, smoothstep(0., .05, m.g)), smoothstep(0., .05, m.b)));
}`;
