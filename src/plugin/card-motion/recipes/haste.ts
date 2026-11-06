/** R: the pennant ripples from its pole out to its tails. G: the gold dust flows round the rook, with a slow band of light and thin motes that run with it. B: the wall banners sway at their hems, in a gust that crosses the card. */
export default `
// Where q lies on the swirl: x, y is the way the dust runs, in painting units; z is the turn round the loop (0 to TAU); w is the ring, 1 on the painted arc.
vec4 swirl(vec2 q) {
  bool left = q.x < .555;
  vec2 v = (q - (left ? vec2(.40, .60) : vec2(.69, .765))) * vec2(16. / 9., 1.);
  float tilt = left ? mix(-.03, .24, smoothstep(.5, .66, q.y)) : mix(.32, .02, smoothstep(.72, .82, q.y));
  vec2 size = left ? vec2(.42, .15) : vec2(.31, .07);
  float c = cos(tilt), s = sin(tilt);
  vec2 e = vec2(c * v.x + s * v.y, c * v.y - s * v.x) / size;
  // Seen on screen the loop turns one way round the rook: left along the top, right along the bottom.
  vec2 way = vec2(e.y * size.x, -e.x * size.y);
  way = normalize(vec2(c * way.x - s * way.y, s * way.x + c * way.y)) * vec2(9. / 16., 1.);
  return vec4(way, atan(e.y, e.x), length(e));
}
// Thin motes of dust that run round the loop. f.x is 20 cells per loop along the turn, f.y the ring. Few cells hold a mote, so no row shows.
float mote(vec2 f) {
  vec2 id = floor(f);
  id.x = mod(id.x, 20.);
  float h = hash(id + 4.), r = .28 + .14 * fract(h * 7.3);
  vec2 c = .3 + .4 * vec2(h, fract(h * 13.7));
  return smoothstep(r, r * .35, length(fract(f) - c)) * step(.85, fract(h * 3.1)) * breathe(1. + floor(h * 2.), h);
}
vec4 card(vec2 q, vec3 m) {
  float g = gain();
  vec2 d = m.r * cloth(q, vec2(-.98, .2), 4., 2., .0095) + m.b * cloth(q, vec2(.25, .97), 8., 1., .005);
  vec4 s = vec4(0.);
  if (m.g > .004) {
    s = swirl(q);
    // A soft pulse runs along the arc: the paint leans with it and returns, so no copy of it ghosts.
    float k = s.z * 3. / TAU;
    d += m.g * min(g, 1.6) * (s.xy * (.0065 * wave(1., k) + .003 * wave(2., k * 2. + .3)) + vec2(-s.y, s.x) * .0022 * wave(1., k + .25));
  }
  vec3 c = paint(q + d);
  // The fold's light shifts with the ripple, so the cloth still reads where its travel is too small to see.
  c *= 1. + m.r * .1 * wave(2., .15 + q.x * 4.) + m.b * .07 * wave(1., .15 - q.y * 8. - q.x * 2.);
  float motes = 0.;
  if (m.g > .004) {
    float band = breathe(1., s.z * 2. / TAU);
    c += (1. - c) * vec3(1., .72, .3) * (.17 + .04 * (g - 1.)) * band * band * band * m.g;
    motes = mote(vec2(-s.z * 120. / TAU - 20. * t, s.w * 9.)) * smoothstep(.05, .4, m.g);
    c = mix(c, vec3(1., .86, .52), motes * .8);
  }
  return vec4(c, max(max(smoothstep(0., .05, m.r), smoothstep(0., .05, m.b)), max(smoothstep(0., .05, m.g), motes)));
}`;
