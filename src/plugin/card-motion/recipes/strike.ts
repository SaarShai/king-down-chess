/** R: the cape and the plume stir. G: dust drifts behind the foot, with a few specks. B: one glint on the spear blade, and light that runs back along the strokes of the charge. */
export default `
// A speck lives in its own cell: it drifts a short way and fades in and out, so it wraps with no seam. "dir" is in cells.
float motes(vec2 q, float cells, vec2 dir, float radius, float seed) {
  vec2 g = q * cells, f = fract(g);
  float h = hash(floor(g) + seed), a = fract(t + h * 7.);
  vec2 c = .5 + (vec2(fract(h * 5.7), fract(h * 13.7)) - .5) * .25 + dir * (a - .5);
  return smoothstep(radius, radius * .4, length(f - c)) * sin(3.14159 * a) * step(.55, fract(h * 3.1));
}
vec4 card(vec2 q, vec3 m) {
  vec2 d = q.y < .16 ? cloth(q, vec2(-.95, .3), 3., 2., .008) : cloth(q, vec2(-.9, .35), 3.4, 2., .008);
  vec3 c = paint(q + m.r * d);
  c = mix(c, flow(q, vec2(-.02, -.005), 2.), m.g);
  c += vec3(.86, .66, .40) * m.g * motes(q, 26., vec2(-.5, -.3), .1, 5.) * .5;
  float blade = step(.6, q.x) * m.b, strokes = step(q.x, .6) * m.b;
  c += vec3(1., .93, .72) * blade * (glint(q, vec2(.815, .58), 1., .035, .32) * .26 + .04 * breathe(1., .1));
  c += vec3(1., .72, .34) * strokes * glint(1. - q, vec2(.8, .6), 2., .07, .0) * .2;
  return vec4(c, max(m.r, max(m.g, m.b)));
}`;
