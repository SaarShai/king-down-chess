/** R: the free ribbon stirs, most at its tips, and the leaves bob. G: the wind's strokes rise along their two arcs, with a gust of light. B: a sheen runs along all the ribbon. */
export default `
// The wind's direction and how far along its arc this point is. The arcs meet only behind the bishop, where the mask is 0.
vec3 arc(vec2 q) {
  bool upper = q.x > .5 && q.y < .5;
  vec2 r = q - (upper ? vec2(.63, .28) : vec2(.45, .56));
  vec2 along = normalize(upper ? vec2(r.y, -r.x) : vec2(-r.y, r.x));
  float a = atan(r.y, r.x) / TAU;
  return vec3(along, upper ? -a : a);
}
vec4 card(vec2 q, vec3 m) {
  vec2 d = m.r * cloth(q, vec2(.8, .6), 3.4, 1., .01);
  vec3 c = paint(q + d);
  float ribbon = texture(map, q + d).b;
  float s = q.x * 3. + q.y;
  c *= 1. + ribbon * (.08 * wave(1., .25 - s) + .04 * wave(2., .6 - s * 1.7));
  if (m.g > .004) {
    vec3 w = arc(q);
    vec3 streak = flow(q, w.xy * .028, 2.);
    float gust = breathe(1., w.z * 2.);
    streak += vec3(1., .93, .76) * .09 * gust * gust * gust;
    c = mix(c, streak, m.g);
  }
  return vec4(c, max(min(m.r * 6., 1.), max(m.g, m.b)));
}`;
