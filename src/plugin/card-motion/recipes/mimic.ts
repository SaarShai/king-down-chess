/** R: the cape's torn wing and hem stir in the wind. G: the moon's glow breathes on the sky and the lit plain. B: the clouds drift and billow. */
export default `
vec4 card(vec2 q, vec3 m) {
  float g = min(gain(), 1.8);
  vec2 iso = vec2(q.x * 16. / 9., q.y);
  // Wind from the right: the sky sways as one mass, the phase runs across it, and each lobe swells on its own.
  vec2 drift = vec2(.008 * wave(1., q.x * .7 + q.y * 1.1), .003 * wave(1., q.x * 1.3 + .3)) + stir(iso, 15., 1., .0018) / gain();
  vec2 sway = cloth(q, vec2(-.97, .2), 3.2, 2., .0065) * mix(1., .7, smoothstep(.5, .6, q.y));
  vec2 d = m.b * drift * g + m.r * sway;
  vec3 c = paint(q + d);
  // The breath of light: the sky takes the magenta it already holds, and the pale disc lifts toward its own warm white, so its colour stays.
  float glow = breathe(1., .1), pale = smoothstep(.62, .85, dot(c, vec3(.34, .33, .33)));
  c = mix(c + (c * .3 + vec3(.5, .28, .62)) * m.g * (.12 + .03 * (g - 1.)) * glow, mix(c, vec3(1., .96, .87), m.g * .3 * glow), pale);
  return vec4(c, max(max(smoothstep(0., .05, m.r), smoothstep(0., .05, m.b)), m.g));
}`;
