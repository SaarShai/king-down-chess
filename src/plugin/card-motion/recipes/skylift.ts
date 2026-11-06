/** R: each free rock shifts as one rigid piece by one small orbit; B holds that rock's phase. G: the wind streaks flow along the whirl. Towers stay still. */
export default `
// The way the painted streaks run. A degree 4 fit to the painting: masks/skylift.py prints these numbers. Near a still point of the whirl the travel fades.
vec2 whirl(vec2 q) {
  float x = q.x - .5, y = q.y - .5;
  vec2 a0 = vec2(.118, -.073) + y * (vec2(6.169, 1.852) + y * (vec2(1.701, 6.029) + y * (vec2(-39.907, 4.531) + y * vec2(-55.45, -1.2))));
  vec2 a1 = vec2(-3.605, -3.363) + y * (vec2(-11.896, -2.681) + y * (vec2(30.243, -2.103) + y * vec2(90.239, 8.397)));
  vec2 a2 = vec2(5.543, 7.149) + y * (vec2(10.428, -38.586) + y * vec2(49.991, -131.133));
  vec2 a3 = vec2(12.674, 14.544) + y * vec2(47.342, -35.061);
  vec2 d = a0 + x * (a1 + x * (a2 + x * (a3 + x * vec2(-21.359, -40.367))));
  float l = length(d);
  return d / (l + .001) * smoothstep(0., .3, l);
}
// Blue is high in sky, streak and cloud, and low in rock and tower. So the wind never carries rock paint.
float soft(vec3 c) { return smoothstep(.5, .68, c.b); }
vec3 wind(vec2 q, vec2 by, float cycles, vec3 still) {
  float a = fract(cycles * t), b = fract(cycles * t + .5);
  vec3 u = paint(q - by * (a - .5)), v = paint(q - by * (b - .5));
  return mix(still, mix(mix(still, u, soft(u)), mix(still, v, soft(v)), abs(2. * a - 1.)), soft(still));
}
vec4 card(vec2 q, vec3 m) {
  if (m.r + m.g < .004) return vec4(0.);
  float small = step(.5, m.b), n = 1. + small, o = fract(m.b * 7.);
  vec2 rock = vec2(wave(n, o + .25) * .55, -wave(n, o)) * mix(.0055, .0075, small) * gain();
  vec3 c = paint(q);
  if (m.g > .004) c = mix(c, wind(q, whirl(q) * .024 * gain(), 2., c), m.g);
  c = mix(c, paint(q + m.r * rock), m.r);
  return vec4(c, max(m.r, m.g));
}`;
