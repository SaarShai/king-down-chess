/** R: the spirit mist's soft body flows up toward the rook. G: light climbs through every turquoise wisp, on the rook's skin too, with no paint moved. B: soft wisps of pale light drift through the chasm's mist, with no paint moved, so ruins cannot swim. */
export default `
// Slow bands that climb the painting. The bent phase stops them reading as straight lines.
float climb(vec2 q, float cycles, float scale, float phase) {
  float bend = .09 * sin(q.x * 37. + q.y * 11.) + .05 * sin(q.x * 83. - q.y * 29.);
  return breathe(cycles, q.y * scale + bend + phase);
}
float cloud(vec2 q) {
  vec2 i = floor(q), f = fract(q); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), f.x), f.y);
}
// Wide soft wisps. The shear hides the noise's square grid.
float wisps(vec2 q) {
  vec2 s = vec2(q.x * 11. + q.y * 3., q.y * 17. - q.x * 5.);
  return cloud(s) * .62 + cloud(s.yx * vec2(1.4, 2.1) + 7.3) * .38;
}
vec4 card(vec2 q, vec3 m) {
  vec3 c = m.r > .004 ? mix(paint(q), flow(q + stir(q, 16., 1., .0018), vec2(-.004, -.03), 2.), m.r) : paint(q);
  if (m.b > .004) {
    vec2 by = vec2(.15, -.02);
    float a = fract(t), b = fract(t + .5);
    float n = mix(wisps(q - by * (a - .5)), wisps(q - by * (b - .5)), abs(2. * a - 1.));
    c += vec3(.62, .84, .92) * m.b * smoothstep(.38, .72, n) * .18 * min(gain(), 1.6);
  }
  float up = climb(q, 2., 3.6, 0.), up2 = climb(q, 3., 5.7, .37);
  float rise = up * up * up * .8 + up2 * up2 * up2 * .3;
  // Near-white paint takes less, so the painted strands keep their detail.
  float room = 1. - .7 * dot(c, vec3(.2, .5, .3));
  c += vec3(.3, .95, .88) * m.g * (.02 + .135 * rise) * room * sqrt(gain());
  return vec4(c, max(max(m.r, m.b), smoothstep(0., .08, m.g)));
}`;
