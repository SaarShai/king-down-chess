/** R: the fire on the blade licks along it and flickers. G: the air round the blade breathes light and holds the embers. B: the bands of cloud creep. */
export default `
// One ember per column of cells: it leaves the blade's line and rises, and it is dark at the instant its life wraps. The shader's flecks() does not wrap.
float ember(vec2 q, float cells, float seed) {
  float id = floor(q.x * cells), h = hash(vec2(id, seed));
  float life = fract((1. + floor(fract(h * 5.3) * 2.)) * t + h);
  float x = (id + .3 + .4 * fract(h * 9.1)) / cells;
  vec2 at = vec2(x + wave(1., h + life * .7) * .004, .37 + (x - .21) * .699 - (.05 + .07 * fract(h * 17.3)) * life);
  float r = (.0030 + .0016 * fract(h * 23.1)) * sqrt(gain());
  return smoothstep(r, r * .3, length(q - at)) * sin(3.14159 * life) * step(.4, fract(h * 3.1));
}
vec4 card(vec2 q, vec3 m) {
  const vec2 AX = vec2(.82, .573), N = vec2(-.573, .82);
  vec2 b = q - vec2(.21, .37);
  float s = dot(b, AX), n = dot(b, N) - .006;
  // The fire slides along the blade, so the blade's own edges never shift. Off the steel, its outer side draws in toward the blade.
  float lick = wave(2., -s * 5.) * .68 + wave(3., .3 - s * 9.) * .32;
  vec2 d = m.r * (AX * lick * .008 + N * sign(n) * smoothstep(.02, .03, abs(n)) * breathe(3., .2 - s * 6.) * .004) * gain();
  // Each band slides on its own slow phase. The slide stops at the painting's border, where no paint lies beyond.
  float border = smoothstep(0., .04, q.x) * smoothstep(1., .96, q.y) * smoothstep(0., .04, q.y);
  d += border * m.b * vec2(wave(1., q.y * 2.3) * .011 + wave(2., .4 + q.y * 3.1 + q.x) * .003, wave(1., .3 + q.x * 1.4) * .003) * gain();
  vec3 c = paint(q + d);
  float flick = .55 * breathe(2., .1) + .45 * breathe(3., .37 - s * 3.);
  c += vec3(1., .72, .3) * (m.r * .16 * flick + m.g * .05 * breathe(1., .1));
  c += vec3(1., .86, .55) * m.g * (ember(q, 24., 3.) + ember(q, 37., 11.)) * .55;
  return vec4(c, max(m.r, max(m.g, m.b)));
}`;
