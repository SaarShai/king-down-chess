/** R: far banners and the mallets' ribbons stir. G: the army's dust billows slowly. B: the low sun's glow breathes, on the drum skin too. */
export default `
vec2 flutter(vec2 q, vec2 along, float waves, float amp) {
  float s = dot(q, along) * waves, a = wave(2., -s) * .7 + wave(3., .31 - s * 1.6) * .3;
  return vec2(-along.y, along.x) * a * amp * gain();
}
vec4 card(vec2 q, vec3 m) {
  bool far = q.y < .335;
  vec2 d = far ? flutter(q, vec2(q.x > .892 ? 1. : -1., 0.), 11., .0035) : flutter(q, q.x < .5 ? vec2(-.87, .5) : vec2(.8, .6), 4.5, .008);
  vec3 c = paint(q + m.r * d + m.g * (1. - m.r) * stir(q, 8., 1., .005));
  c += vec3(1., .78, .42) * m.b * .15 * breathe(1., .1);
  return vec4(c, max(smoothstep(0., .2, max(m.r, m.g)), m.b));
}`;
