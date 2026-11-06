/** R: a slow glint crosses the gold scrollwork. G: the same glint and one breath of light on the crown. */
export default `
vec4 card(vec2 q, vec3 m) {
  vec3 c = paint(q);
  float gold = smoothstep(.3, .62, dot(c, vec3(.3, .59, .11)));
  float sweep = glint(q, vec2(.62, .48), 1., .09, 0.), breath = breathe(1., -.28);
  float boost = mix(1., 1.7, (gain() - 1.) / 2.2);
  float light = (m.r + m.g) * sweep * .17 + m.g * breath * breath * .08;
  c += vec3(1., .88, .55) * light * gold * boost;
  return vec4(c, max(m.r, m.g));
}`;
