/** R: the mist at the nostril swells out and breathes. G: a slow glint crosses the ice facets. B: snow drifts through the open sky. */
export default `
const vec2 NOSTRIL = vec2(.785, .345);
// One slanted flake per grid cell. "move" is a whole number of cells per loop. Cells one "move" apart share a key, so frame 0 and the last frame match.
float snow(vec2 q, float cells, vec2 move, float radius, float seed) {
  vec2 g = q * cells - move * t, id = floor(g);
  float h = hash(vec2(id.x * move.y - id.y * move.x, seed)), r = radius * (.6 + .4 * fract(h * 7.3)) * cells * min(gain(), 1.5);
  vec2 f = fract(g) - .28 - .44 * vec2(fract(h * 5.9), fract(h * 13.7)) - vec2(.06 * wave(1., h), 0.), a = normalize(move);
  return step(.42, fract(h * 3.1)) * smoothstep(1., .3, length(vec2(dot(f, a) / 1.7, dot(f, vec2(-a.y, a.x))) / r));
}
// The puff scaled about the nostril: two crossfaded copies, so it swells for ever and never travels far.
vec3 swell(vec2 q, float cycles, float k) {
  vec2 d = q - NOSTRIL;
  float a = fract(cycles * t), b = fract(cycles * t + .5);
  return mix(paint(NOSTRIL + d * (1. - k * (a - .5))), paint(NOSTRIL + d * (1. - k * (b - .5))), abs(2. * a - 1.));
}
vec4 card(vec2 q, vec3 m) {
  vec3 c = paint(q);
  // Each facet is one flat colour, so an offset from its light gives the band a broken, faceted edge.
  float l = dot(c, vec3(.3, .6, .1)), w = dot(q, vec2(.6, .8)) + (l - .7) * .3;
  vec2 u = vec2(w, 0.);
  float g = min(gain(), 1.6), shine = max(glint(u, vec2(1., 0.), 1., .09 * g, .0), .6 * glint(u, vec2(1., 0.), 1., .07 * g, .5));
  c += vec3(.62, .86, 1.) * shine * .16 * g;
  if (m.r > .004) {
    float out_ = length(q - NOSTRIL) / .17, pulse = smoothstep(.45, 0., abs(out_ - fract(2. * t) * 1.5));
    c = mix(c, swell(q + stir(q, 9., 1., .002), 2., .24), m.r);
    c = mix(c, vec3(.93, .96, 1.), m.r * .28 * pulse * breathe(2., .5));
  }
  float near = snow(q, 13., vec2(-1., 3.), .0052, 1.), far = snow(q, 24., vec2(-1., 4.), .0026, 5.);
  float s = m.b * max(near * .85, far * .6), a = max(max(m.r, m.g), s);
  return vec4(mix(c, vec3(.93, .97, 1.), s / max(a, .001)), a);
}`;
