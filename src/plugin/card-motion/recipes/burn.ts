/** R: the flame trail's paint runs out from the impact and its light licks along it. G: the embers on the knight pulse in place, light only. B: outside x .45 to .88 the banners stir from the hem; inside it sparks rise. */
export default `
// Short flow outward from the impact. The phase varies across the trail, so the crossfade never pulses as one sheet.
vec3 lick(vec2 q, vec2 by, float cycles, float phase) {
  float a = fract(cycles * t + phase), b = fract(cycles * t + phase + .5);
  return mix(paint(q - by * (a - .5)), paint(q - by * (b - .5)), abs(2. * a - 1.));
}
vec4 card(vec2 q, vec3 m) {
  float g = gain(), air = step(.45, q.x) * step(q.x, .88), hem = m.b * (1. - air), rise = m.b * air;
  vec2 from = q - vec2(.56, .76);
  vec2 dir = normalize(from);
  float s = length(from);
  vec2 d = hem * cloth(q, vec2(.0, 1.), 5., 1., .006) * vec2(.6, 1.);
  vec3 c = paint(q + d);
  float cover = smoothstep(0., .06, hem);
  if (m.r > .004) {
    float phase = .16 * sin(q.x * 17. + q.y * 9.) + .1 * sin(q.y * 31. - q.x * 7.);
    vec3 fire = lick(q, dir * .016 * vec2(.6, 1.) * m.r * min(g, 2.), 3., phase);
    float tongue = breathe(2., s * 3.2 + phase);
    fire *= 1. + .16 * m.r * (tongue - .5);
    c = mix(c, fire, m.r);
    cover = max(cover, m.r);
  }
  if (m.g > .004) {
    float pulse = .6 * breathe(2., q.x * 11. + q.y * 7.) + .4 * breathe(3., q.y * 19. - q.x * 13. + .3);
    c *= 1. + m.g * .3 * (pulse - .5);
    c += vec3(1., .5, .14) * .1 * m.g * pulse;
    cover = max(cover, m.g);
  }
  if (rise > .004) {
    vec2 r = vec2(q.x * 16. / 9., q.y);
    float spark = flecks(r, 16., vec2(1., -3.), .11, 3., .8) * rise;
    c += vec3(1., .62, .22) * spark * .9;
    cover = max(cover, spark);
  }
  return vec4(c, cover);
}`;
