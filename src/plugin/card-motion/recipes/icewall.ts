// Snow that wraps exactly: each slanted column falls by "rows" cells per loop and repeats every "rows" cells, with its own start, so no grid shows.
const snowfall = `
float snowfall(vec2 q, float cells, float rows, float radius, float seed) {
  float x = (q.x - q.y * .3) * cells, col = floor(x);
  float y = q.y * cells - rows * t + hash(vec2(col, seed)) * rows, row = mod(floor(y), rows);
  float h = hash(vec2(col, row) + seed);
  vec2 at = vec2(.5 + .22 * wave(1., h) , .25 + .5 * fract(h * 13.7));
  return smoothstep(radius, radius * .35, length(vec2(fract(x), fract(y)) - at)) * step(fract(h * 3.1), .36);
}`;
/** R: the torn banner stirs from its knot at the pole. G: one slow glint crosses the ice. B: snow drifts with the wind. */
export default `${snowfall}
vec4 card(vec2 q, vec3 m) {
  float s = dot(q, vec2(-.93, .37)) * 7.;
  vec2 d = m.r * vec2(.37, .93) * (wave(2., -s) * .72 + wave(3., .31 - s * 1.3) * .28) * .008 * gain();
  vec3 c = paint(q + d);
  vec2 axis = vec2(.9, .44);
  float light = m.g * (glint(q, axis, 1., .11, .1) * .09 + glint(q, axis, 1., .03, .1) * .10);
  float snow = m.b * (snowfall(q, 19., 3., .10, 2.) + snowfall(q, 31., 4., .12, 5.) * .7);
  c += vec3(.72, .94, 1.) * light + vec3(.93, .97, 1.) * snow * .6;
  return vec4(c, max(smoothstep(0., .1, m.r), max(smoothstep(0., .02, light), snow)));
}`;
