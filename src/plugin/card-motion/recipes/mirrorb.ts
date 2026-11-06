/** R: the blue magic sways along its swirl, and a pulse of its own light runs outward. G: the candle flame and its reflection flicker, with their light. B: one sheen crosses the glass. */
export default `
vec4 card(vec2 q, vec3 m) {
  // The swirl turns about the hand in the glass, and about its own eye in the spill past the frame.
  vec2 a = vec2(q.x * 16. / 9., q.y);
  vec2 r = a - (q.x > .75 && q.y > .36 ? vec2(1.42, .55) : vec2(1.2, .40));
  float R = max(length(r), .03), ph = R * 2.6 - atan(r.y, r.x) / TAU;
  vec2 spin = vec2(-r.y * .5625, r.x) / R;
  vec2 d = m.r * spin * (wave(1., ph) * .7 + wave(2., ph * 1.7 + .3) * .3) * .007 * gain();

  float flick = wave(3., .1) * .45 + wave(2., .37) * .35 + wave(1., .7) * .2;
  float tip = smoothstep(.35, 1., m.g);
  d += tip * vec2(flick * .0026, (wave(2., .6) * .6 + wave(3., .2) * .4) * .006) * (q.x > .3 ? .5 : 1.) * gain();

  vec3 c = paint(q + d);
  float wisp = smoothstep(.3, .8, dot(c, vec3(.3, .5, .2)));
  float pulse = breathe(1., ph * 1.4);
  c += vec3(.55, .72, 1.) * m.r * wisp * pulse * pulse * .14;
  c *= 1. + m.g * (.5 + .5 * flick) * .16;

  float band = glint(q, vec2(.82, .57), 1., .1, .15) * .75 + glint(q, vec2(.82, .57), 1., .03, .19) * .25;
  c += vec3(.72, .84, 1.) * band * .15;
  return vec4(c, max(max(m.r, m.g), m.b * min(band * 3., 1.)));
}`;
