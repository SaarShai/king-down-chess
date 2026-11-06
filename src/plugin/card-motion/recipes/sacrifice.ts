/** R: the banners ripple from the pole, with folds of shade. G: the clouds drift along their bands, the sun's light breathes on the sky and the water. B: warm light breathes in the broken shell (1) and ivory dust gathers toward the rook through the air (.45). */
export default `
vec4 card(vec2 q, vec3 m) {
  // The ripple runs down the cloth, long and slow. It stops at the painting's border, where no paint lies beyond.
  vec2 along = vec2(.18, .98);
  float border = smoothstep(0., .012, q.x) * smoothstep(1., .988, q.x);
  vec3 c = paint(q + m.r * border * cloth(q, along, 4., 1., .0048));
  c *= 1. + m.r * .08 * wave(1., .2 - dot(q, along) * 4.);

  if (m.g > .004 && q.y < .47) {
    // Higher clouds drift faster. Each band of sky has its own pace, and the sky fades out above the ridge.
    float pace = (1.15 - q.y * 1.5) * (.8 + .2 * wave(1., q.y * 7.));
    float keep = smoothstep(.43, .34, q.y) * smoothstep(0., .03, q.x);
    c = mix(c, flow(q, vec2(.03 * pace, 0.), 1.), m.g * keep);
  }
  float r = length(vec2((q.x - .303) * 16. / 9., (q.y - .42) * (q.y > .5 ? .5 : 1.)));
  c += vec3(1., .62, .24) * m.g * exp(-r * r / .03) * (.15 + .02 * (gain() - 1.)) * breathe(1., .1);

  // The light: gold inside the shell.
  float inner = smoothstep(.5, .95, m.b), air = smoothstep(0., .42, m.b);
  c += vec3(1., .66, .26) * inner * (.15 + .03 * (gain() - 1.)) * breathe(1., .35);
  if (air > .004) {
    // The dust: each fleck runs in along a spoke, on a log-polar grid round the rook, so it shrinks as it gathers.
    vec2 v = vec2((q.x - .515) * 16. / 9., q.y - .47);
    vec2 lp = vec2(atan(v.y, v.x), -log(length(v) + .001)) / TAU;
    float dust = flecks(lp, 36., vec2(0., 4.), .14, 3., .6) + flecks(lp + .013, 28., vec2(0., 3.), .11, 11., .8);
    c = mix(c, vec3(1., .84, .55), clamp(dust, 0., 1.) * air * .6);
    // The painted specks twinkle where they lie: they stand brighter than a blur of the paint round them.
    vec3 blur = texture(art, (q - window.xy) * window.zw, 3.).rgb;
    float speck = smoothstep(.05, .2, c.g - blur.g) * air * (1. - inner);
    float id = hash(floor(q * vec2(220., 124.)));
    c += vec3(1., .8, .5) * speck * .24 * (breathe(2. + floor(id * 2.), id) - .5);
  }
  return vec4(c, max(max(smoothstep(0., .05, m.r), m.g), air));
}`;
