/** R: the pennant and far banners stir. G: the dust swirl flows along its curve, with a slow lift of gold running through it. B: loose grit drifts along the curve in the air around it. */
export default `
vec2 ellipse(vec2 v, float a, float k) {
  float c = cos(a), s = sin(a);
  vec2 e = vec2(c * v.x + s * v.y, -s * v.x + c * v.y);
  return vec2(c * k * k * e.y + s * e.x, s * k * k * e.y - c * e.x);
}
// The way the swirl runs at q: two tilted ellipses, one on each side of the rook.
vec2 along(vec2 q) {
  return normalize(mix(ellipse(q - vec2(.36, .56), 0., 1.7), ellipse(q - vec2(.73, .71), .33, 3.5), smoothstep(.44, .6, q.x)));
}
// Grit: each grain lives in its own cell and fades in and out on its own clock, so the loop has no seam.
float grit(vec2 q, float cells, float seed) {
  vec2 id = floor(q * cells);
  float h = hash(id + seed), life = fract(t * (1. + floor(h * 2.)) + h * 5.3);
  vec2 c = .25 + .3 * vec2(fract(h * 13.7), fract(h * 29.1));
  vec2 at = c + along((id + .5) / cells) * .22 * (life + life - .5);
  float d = smoothstep(.13 + .09 * fract(h * 7.3), .04, length(q * cells - id - at));
  return d * step(.35, fract(h * 3.1)) * sin(3.14159 * life);
}
vec4 card(vec2 q, vec3 m) {
  bool pennant = q.x > .1 && q.x < .53 && (q.x < .24 || q.y < .2);
  vec2 d = m.r * (pennant ? cloth(q, vec2(.92, .38), 5., 2., .009) : cloth(q, vec2(0., 1.), 11., 2., .0045));
  vec3 c = paint(q + d);
  vec2 way = along(q);
  c = mix(c, flow(q, way * .026, 1.), m.g);
  // The lift runs along the arc; it fades under the rook, where the two ellipses meet.
  vec2 v = q.x < .52 ? q - vec2(.36, .56) : (q - vec2(.73, .71)) * mat2(.946, .324, -.324, .946);
  float turn = atan(v.y * (q.x < .52 ? 1.7 : 3.5), v.x);
  float lift = pow(breathe(2., turn * 2. / TAU), 2.) * smoothstep(.06, .12, abs(q.x - .52));
  c += vec3(.11, .07, .015) * lift * m.g;
  float g = grit(q, 28., 3.) * m.b;
  c = mix(c, vec3(1., .8, .42), g * .85);
  return vec4(c, max(max(m.r, m.g), g));
}`;
