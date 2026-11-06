/** R: the torn banner ripples from the pole out to its torn ends. G: cold light travels through the ice, facet by facet. B: snow drifts on the wind that holds the banner out. */
export default `
// Snow in lanes along the wind. Each lane has its own start and its own whole number of rows per loop, so no grid shows and the loop wraps exactly.
float snowfall(vec2 q, float cells, float radius, float seed, float density) {
  vec2 s = vec2(q.x * 16. / 9., q.y), wind = vec2(-.82, .57);
  float lane = dot(s, vec2(wind.y, -wind.x)) * cells, id = floor(lane);
  float h0 = hash(vec2(id, seed)), rows = 3. + floor(h0 * 3.);
  float y = dot(s, wind) * cells - rows * t + h0 * 17., row = mod(floor(y), rows);
  float h = hash(vec2(id, row) + seed);
  vec2 at = vec2(.5 + .2 * wave(1., h), .25 + .5 * fract(h * 13.7));
  float r = radius * (.6 + .4 * fract(h * 7.3));
  return smoothstep(r, r * .35, length(vec2(fract(lane), fract(y)) - at)) * step(fract(h * 3.1), density);
}
vec4 card(vec2 q, vec3 m) {
  vec2 s = vec2(q.x * 16. / 9., q.y), along = vec2(-.9, .44);
  float phase = dot(s, along) * 6.;
  float a = wave(2., -phase) * .72 + wave(3., .31 - phase * 1.4) * .28;
  vec2 d = m.r * vec2(-along.y * .5625, along.x) * a * .009 * gain();
  vec3 c = paint(q + d);
  // The folds turn to the light as the ripple passes. Only the cloth takes this, not the sky behind it.
  float top = max(c.r, max(c.g, c.b)), sat = (top - min(c.r, min(c.g, c.b))) / max(top, .01);
  c *= 1. + m.r * smoothstep(.55, .68, sat) * .13 * wave(2., .25 - phase);
  // The band arrives at each facet at its own time, because lighter paint shifts it. So it reads as light inside the ice, not a wipe over it.
  float lum = dot(c, vec3(.3, .5, .2)), at = dot(q, vec2(.86, -.36)) + lum * .16;
  vec2 here = vec2(at, 0.), axis = vec2(1., 0.);
  float band = glint(here, axis, 1., .14, .1) * .65 + glint(here, axis, 1., .045, .1) * .35;
  float light = m.g * band * smoothstep(.28, .45, top) * (.45 + .55 * (1. - c.r)) * (.15 + .012 * gain());
  c += vec3(.66, .9, 1.) * light;
  float snow = m.b * smoothstep(50., 110., size) * max(snowfall(q, 15., .115, 2., .11), .6 * snowfall(q, 26., .15, 5., .08));
  c = mix(c, vec3(.93, .97, 1.), snow * .85);
  return vec4(c, max(min(m.r * 5., 1.), max(smoothstep(0., .015, light), snow)));
}`;
