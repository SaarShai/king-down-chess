/** The helpers each card's recipe may use. Every time term is an integer number of cycles per loop, so the loop has no seam. */
export const VERTEX = `#version 300 es
uniform vec4 box;
out vec2 p;
void main() {
  vec2 c = vec2(gl_VertexID == 1 ? 3. : -1., gl_VertexID == 2 ? 3. : -1.);
  gl_Position = vec4(c, 0., 1.);
  p = box.xy + vec2(c.x * .5 + .5, .5 - c.y * .5) * box.zw;
}`;

export const fragment = (recipe: string) => `#version 300 es
precision highp float;
uniform sampler2D art, map;
uniform vec4 window;
uniform float t, size;
in vec2 p;
out vec4 o;
const float TAU = 6.2831853;
// Motion that reads at 360 px would vanish on a 36 px coin, so travel grows as the card shrinks.
float gain() { return clamp(170. / size, 1., 3.2); }
vec3 paint(vec2 q) { return texture(art, (q - window.xy) * window.zw, -.5).rgb; }
float wave(float cycles, float phase) { return sin(TAU * (cycles * t + phase)); }
float breathe(float cycles, float phase) { return .5 + .5 * wave(cycles, phase); }
// Travel of cloth: a wave runs along the unit vector "along" and pushes across it. "waves" counts wave lengths per card width.
vec2 cloth(vec2 q, vec2 along, float waves, float cycles, float amp) {
  float s = dot(q, along) * waves, a = wave(cycles, -s) * .68 + wave(cycles * 2., .31 - s * 1.73) * .32;
  return vec2(-along.y, along.x) * a * amp * gain();
}
// Smooth wander with no direction, for soft paint and flames.
vec2 stir(vec2 q, float scale, float cycles, float amp) {
  vec2 s = q * scale;
  return vec2(wave(cycles, s.y + .2 * s.x) + .5 * wave(cycles * 2., s.x * 1.3 + .4), wave(cycles, s.x - .3 * s.y + .37) + .5 * wave(cycles * 2., s.y * 1.1 + .7)) * amp * gain() / 1.5;
}
// Paint that moves one way for ever: smoke, mist, water, wind. "by" is the travel in one cycle; keep it short or the crossfade shows.
vec3 flow(vec2 q, vec2 by, float cycles) {
  float a = fract(cycles * t), b = fract(cycles * t + .5);
  return mix(paint(q - by * (a - .5)), paint(q - by * (b - .5)), abs(2. * a - 1.));
}
// One soft band of light that crosses once per cycle along "axis", in painting units.
float glint(vec2 q, vec2 axis, float cycles, float width, float phase) {
  float span = 1.6 + 2. * width, at = fract(cycles * t + phase) * span - width - .3;
  return smoothstep(width, 0., abs(dot(q, axis) - at));
}
float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
// Round flecks on a grid. "move" is a whole number of cells per loop (at least 3 on an axis that moves, or the pattern shows), so snow, sparks and dust wrap exactly. Twinkle is optional (0 to 1).
float flecks(vec2 q, float cells, vec2 move, float radius, float seed, float twinkle) {
  vec2 g = q * cells - move * t, id = floor(g), f = fract(g);
  // A fleck that travels "move" cells in a loop lands on another cell, so both cells must hash alike, or the loop jumps.
  if (move.y != 0.) id -= move * floor(id.y / move.y); else if (move.x != 0.) id -= move * floor(id.x / move.x);
  float h = hash(id + seed), r = radius * (.55 + .45 * fract(h * 7.3));
  vec2 c = .25 + .5 * vec2(h, fract(h * 13.7));
  float d = smoothstep(r, r * .35, length(f - c));
  return d * step(.45, fract(h * 3.1)) * mix(1., breathe(max(1., floor(1. + h * 3.)), h), twinkle);
}
${recipe}
void main() {
  vec3 m = texture(map, p).rgb;
  // Paint outside the masks stays the still picture under this canvas.
  if (m.r + m.g + m.b < .004) { o = vec4(0.); return; }
  vec4 c = card(p, m);
  float a = clamp(c.a, 0., 1.);
  o = vec4(clamp(c.rgb, 0., 1.) * a, a);
}`;
