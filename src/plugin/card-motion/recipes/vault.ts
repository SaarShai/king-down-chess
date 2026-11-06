/** R: the loose leaves drift and rock as a gust runs through them; the near corner leaves sway. G: the ivy rustles as the same gust passes. B: the sun's glow breathes outward over the sky and clouds. */
export default `
// How far along the wind this point lies, in on-screen units. The stag leaps and the leaves trail along this line.
float windward(vec2 q) { return q.x * 16. / 9. * .89 - q.y * .45; }
// Movement across the wind depends on the place along it, and the reverse, so a leaf rocks and keeps its shape.
vec2 flutter(vec2 q) {
  float a = windward(q), b = q.x * 16. / 9. * .45 + q.y * .89;
  vec2 wind = vec2(.89 * .56, -.45), side = vec2(.45 * .56, .89);
  return (wind * (.0075 * wave(1., -a * 1.1) + .002 * wave(2., b * 2.3 + .2)) + side * (.0055 * wave(1., a * 1.7 + .3) + .0022 * wave(2., -a * 2.9))) * gain();
}
vec4 card(vec2 q, vec3 m) {
  float gust = .35 + .65 * breathe(1., -windward(q) * 1.1);
  vec2 s = stir(vec2(q.x * 16. / 9., q.y), 7., 1., .0034) * gust;
  vec3 c = paint(q + m.r * flutter(q) + m.g * vec2(s.x * .56, s.y));
  float a = clamp(max(max(m.r, m.g) * 4., m.b), 0., 1.);
  float away = length((q - vec2(.843, .454)) * vec2(16. / 9., 1.));
  c += vec3(1., .9, .62) * m.b * (.13 * breathe(1., -away * 1.4)) / max(a, .01);
  return vec4(c, a);
}`;
