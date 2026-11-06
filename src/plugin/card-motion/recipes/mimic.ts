/** R: the cape stirs at its torn wing and hem. G: the moon's light breathes on sky and plain. B: above y .5 the clouds sway; below it the horse shadow's mane ripples with the cape and its barrel breathes. */
export default `
vec4 card(vec2 q, vec3 m) {
  float g = gain();
  vec2 d = m.r * mix(cloth(q, vec2(-.93, .36), 3., 2., .009), cloth(q, vec2(.25, .97), 5.5, 2., .005), smoothstep(.46, .56, q.y));
  if (q.y < .5) {
    d += m.b * (vec2(.011 * wave(1., q.x * .8 + q.y * 1.5), .0025 * wave(1., q.x * 1.7 + .3)) * min(g, 1.5) + stir(q, 9., 1., .0025) * min(g, 1.5) / g);
  } else {
    float side = q.y - .66 + .7 * (q.x - .7), mane = smoothstep(0., -.05, side);
    vec2 strand = cloth(q, vec2(-.82, .57), 7., 2., .0055), breath = (q - vec2(.7, .67)) * .035 * breathe(1., .1) * g;
    d += m.b * mix(breath, strand, mane);
  }
  vec3 c = paint(q + d);
  c += (c * .45 + vec3(.46, .3, .55)) * m.g * (.16 + .02 * (g - 1.)) * breathe(1., .1);
  return vec4(c, max(max(smoothstep(0., .06, m.r), smoothstep(0., .06, m.b)), m.g));
}`;
