/** R: the loose leaves bob and sway in the air. G: the streaks of light breathe and a soft band of light runs back along them. B: the ivy stirs. */
export default `
// Each axis takes its phase mostly from the other axis, so a leaf shifts and rocks a little but keeps its shape and area.
vec2 flutter(vec2 q) {
  vec2 s = vec2(1.7 * q.y + .6 * q.x, 1.7 * q.x - .6 * q.y);
  return (vec2(wave(1., s.x), wave(1., s.y + .23)) * vec2(.008, .006) + vec2(wave(2., s.x * 1.4 + .4), wave(2., s.y * 1.4 + .1)) * .002) * gain();
}
vec4 card(vec2 q, vec3 m) {
  vec3 c = paint(q + m.r * flutter(q) + m.b * stir(q, 14., 2., .004));
  float run = glint(q, vec2(-.93, .36), 1., .16, .1);
  c += vec3(1., .93, .66) * m.g * (.16 * (breathe(1., .1) - .35) + .08 * run);
  return vec4(c, max(m.r, max(m.g, m.b)));
}`;
