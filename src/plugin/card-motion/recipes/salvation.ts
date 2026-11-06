/** R: ground mist drifts between the stones. G: the light from the right breathes. Neither one moves paint, so stones and crosses cannot swim. */
export default `
float cloud(vec2 q) {
  vec2 i = floor(q), f = fract(q); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), f.x), f.y);
}
// Wide soft wisps along the ground. The shear hides the noise's square grid.
float wisps(vec2 q) {
  vec2 s = vec2(q.x * 5. + q.y * 2., q.y * 12. - q.x * 3.);
  return cloud(s) * .62 + cloud(s.yx * vec2(1.4, 2.1) + 7.3) * .38;
}
vec4 card(vec2 q, vec3 m) {
  vec2 by = vec2(.07, -.008);
  float a = fract(t * 2.), b = fract(t * 2. + .5);
  float n = mix(wisps(q - by * (a - .5)), wisps(q - by * (b - .5)), abs(2. * a - 1.));
  // Blended over the exact still art, in a near white the painting's glow already holds.
  float mist = m.r * smoothstep(.4, .7, n) * .4;
  float light = m.g * (.04 + .4 * breathe(1., .1)) * sqrt(gain());
  return vec4(.93, 1., 1., 1. - (1. - mist) * (1. - light));
}`;
