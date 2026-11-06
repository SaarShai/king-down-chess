/** R: the green leaves stir. G: the disc's glow swells outward from its middle and passes a faint halo past the rim. B: a soft glint runs out along the antlers from the head. */
export default `
vec4 card(vec2 q, vec3 m) {
  vec2 d = m.r * cloth(q, vec2(.5, .86), 5., 2., .005);
  vec3 c = paint(q + d);
  c += vec3(1., .88, .68) * m.g * (.03 + .10 * breathe(1., .15 - length(q - vec2(.5445, .4255)) * .6));
  float s = length(q - vec2(.36, .34)), run = smoothstep(.05, 0., abs(s - (fract(t + .62) * 1.3 - .3))) * smoothstep(.04, .14, s);
  c += vec3(1., .93, .72) * m.b * run * .22;
  return vec4(c, max(m.r, max(m.g, m.b)));
}`;
