/** R: ripples run out from the arm through the water. G: snow falls behind the figure. B: a slow glint and breath cross the ice sleeve. */
export default `
// Flakes fall in fixed columns, a whole number of rows per loop, so the same flake returns to the same place. shader.ts flecks() changes its pattern at the wrap.
float fall(vec2 q, float cols, float rows, float radius, float seed) {
  float x = q.x * cols + .22 * wave(1., q.y * 1.4 + seed), col = floor(x), h = hash(vec2(col, seed));
  float y = fract(q.y * rows - (1. + step(.6, fract(h * 5.7))) * t + h);
  vec2 at = vec2((fract(x) - .3 - .4 * fract(h * 3.3)) / cols, (y - .5) / rows);
  float r = radius * (.7 + .5 * fract(h * 7.3)) * gain();
  return smoothstep(r, r * .35, length(at)) * step(.22, fract(h * 9.1));
}
vec4 card(vec2 q, vec3 m) {
  vec2 from = (q - vec2(.6, .82)) * vec2(1., 3.6);
  float r = max(length(from), .001);
  vec2 d = m.r * from / r / vec2(1., 3.6) * wave(2., -r * 4.) * .007 * gain();
  vec3 c = paint(q + d);
  float ring = pow(breathe(2., -r * 4.), 6.) * smoothstep(.8, .12, r);
  c += vec3(.5, .72, .95) * m.r * ring * .11;
  c += vec3(.85, .95, 1.) * m.b * (glint(q, vec2(.5, .6), 1., .1, .1) * .09 + breathe(1., .35) * .03) * mix(1., 1.5, (gain() - 1.) / 2.2);
  float snow = m.g * max(fall(q, 19., 3., .0065, 2.) * .8, fall(q, 27., 4., .004, 5.) * .5);
  float a = max(max(m.r, m.b), snow);
  c = mix(c, vec3(.93, .96, 1.), snow / max(a, .001));
  return vec4(c, a);
}`;
