/** R: a slow wave runs along the strand in the air, from rook to knight. G: the teal light breathes, and one pulse runs along it to the knight. B: the storm clouds lean and billow on a slow wave. */
export default `
vec4 card(vec2 q, vec3 m) {
  vec3 c;
  vec2 d = vec2(0.);
  if (m.b > .004) {
    d = m.b * (vec2(.0085, -.0015) * wave(1., -q.x * 1.6 - q.y * .7) * gain() + stir(q, 7., 1., .0028));
    c = paint(q + d);
  } else if (m.r > .004) {
    d = m.r * (cloth(q, vec2(.95, .3), 6., 1., .0065) + stir(vec2(q.x * 16. / 9., q.y), 11., 2., .0016));
    c = paint(q + d);
  } else c = paint(q);
  float cover = max(max(m.r, m.g), m.b);
  float g = texture(map, q + d).g;
  float light = .06 * breathe(1., .1) + .09 * glint(q, normalize(vec2(.85, .5)), 1., .07, .05);
  c += vec3(.45, 1., .85) * light * g / max(cover, .004);
  return vec4(c, cover);
}`;
