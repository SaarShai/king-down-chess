/** R: one slow glint crosses the gold scrolls, frame and stars. G: the same glint crosses the crown, then one breath of light swells on it. No paint moves. */
export default `
vec4 card(vec2 q, vec3 m) {
  vec3 c = paint(q);
  // Light falls only on gold paint, so the dark blue between the strokes stays still at full resolution.
  float gold = smoothstep(.12, .42, c.r - c.b);
  float sweep = glint(q, vec2(.72, .32), 1., .085, 0.);
  // The breath peaks just after the glint leaves the crown.
  float breath = breathe(1., -.5);
  float boost = mix(1., 1.6, (gain() - 1.) / 2.2);
  float light = (m.r + m.g) * sweep * .14 + m.g * breath * breath * .09;
  c += vec3(1., .86, .5) * light * gold * boost;
  return vec4(c, max(m.r, m.g));
}`;
