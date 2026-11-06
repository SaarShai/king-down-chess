/** R: the free ribbon tails ripple outward, most at the tips, and a sheen follows the ripple. G: the wind's strokes slide up the two arcs of the swirl, with one soft gust of light on each arc. B: the leaves drift on the wind. */
export default `
const vec2 UPPER = vec2(1.0864, .2615), LOWER = vec2(1.1984, .584);
// On the swirl: xy is the direction of the wind in painting units; z is how far along its arc this point is (0 to 1). The arcs are ellipses fitted to the painted strokes.
vec3 swirl(vec2 q) {
  vec2 s = vec2(q.x * 16. / 9., q.y);
  if (q.x > .5 && q.y < .5) {
    vec2 r = s - UPPER, g = vec2(2. * r.x + .234 * r.y, .234 * r.x + 2.099 * r.y);
    return vec3(normalize(vec2(g.y, -g.x)) * vec2(.5625, 1.), (2.2 - atan(r.y, r.x)) / 4.4);
  }
  vec2 r = s - LOWER, g = vec2(2. * r.x - 1.124 * r.y, -1.124 * r.x + 27.68 * r.y);
  return vec3(normalize(vec2(-g.y, g.x)) * vec2(.5625, 1.), (1.29 - atan(r.y * 3.7, -r.x)) / 2.12);
}
vec4 card(vec2 q, vec3 m) {
  vec2 along = q.x < .5 ? vec2(-.8, -.6) : vec2(.72, .694);
  vec2 d = m.r * cloth(q, along, 4., 1., .012) + m.r * m.r * cloth(q, along, 9., 2., .004);
  d += m.b * stir(vec2(q.x * 16. / 9., q.y), 3.5, 1., .012);
  d.x *= .56;
  vec3 c = paint(q + d);
  float red = smoothstep(.2, .4, c.r - c.g);
  c *= 1. + red * m.r * .12 * wave(1., .2 - dot(q, along) * 4.);
  if (m.g > .004) {
    vec3 w = swirl(q);
    vec3 streak = flow(q, w.xy * .024 * sqrt(gain()), 2.);
    float f = fract(t - w.z);
    float gust = smoothstep(0., .1, f) * smoothstep(.55, .1, f);
    streak = streak * (.96 + .07 * gust) + vec3(1., .93, .76) * .08 * gust;
    c = mix(c, streak, m.g);
  }
  return vec4(c, max(min(max(m.r, m.b) * 6., 1.), m.g));
}`;
