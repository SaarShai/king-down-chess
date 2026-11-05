// Shared by frozen states, ice-wall cards and the Frost King ground. Keep their material identical.
const TAU = Math.PI * 2;
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => {
  n = clamp(n);
  return n * n * (3 - 2 * n);
};
const hash = (n) => {
  const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
function materialState(progress) {
  const grow = smooth(progress / 0.3), melt = smooth((progress - 0.72) / 0.28);
  return { grow, melt, life: grow * (1 - melt) };
}
function polygon(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}
function crack(ctx, points, width = 1.5) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = "#215a8070";
  ctx.lineWidth = width + 1.7;
  ctx.stroke();
  ctx.strokeStyle = "#e9ffffd9";
  ctx.lineWidth = width;
  ctx.stroke();
}
function frostGround(ctx, life, seed) {
  ctx.save();
  ctx.globalAlpha = life;
  const wash = ctx.createRadialGradient(0, 0, 4, 0, 0, 68);
  wash.addColorStop(0, "#c8f5ff55");
  wash.addColorStop(0.75, "#91d4ec55");
  wash.addColorStop(1, "#efffff00");
  ctx.save();
  ctx.scale(1, 0.32);
  ctx.fillStyle = wash;
  ctx.fillRect(-72, -72, 144, 144);
  ctx.restore();
  for (let i = 0; i < 32; i++) {
    const angle = i / 32 * TAU, r = 43 + hash(i + seed) * 19, width = 2 + hash(i * 3 + seed) * 5;
    const x = Math.cos(angle) * r, y = Math.sin(angle) * r * 0.3;
    ctx.fillStyle = i % 3 === 0 ? "#dffaffd9" : "#a8ddedc9";
    polygon(ctx, [[x - width, y], [x + Math.cos(angle) * 9, y + Math.sin(angle) * 3], [x + width, y + 2], [x, y + 4]]);
    ctx.fill();
  }
  ctx.restore();
}
const ICE_BACK = [[-50, 12], [-59, -13], [-51, -54], [-38, -79], [-18, -104], [2, -96], [20, -111], [43, -81], [55, -39], [57, -9], [43, 16], [8, 23], [-23, 21]];
const ICE_FRONT = [[-51, 8], [-47, -20], [-31, -38], [-12, -46], [7, -32], [22, -61], [42, -44], [53, -9], [45, 16], [14, 27], [-20, 23]];
function drawFreeze(ctx, frame) {
  const { grow, melt, life } = materialState(frame.progress);
  if (life <= 0) return;
  ctx.save();
  ctx.translate(frame.x, frame.y);
  if (!frame.front) frostGround(ctx, Math.min(1, life * 2), frame.seed ?? 5);
  ctx.save();
  const height = (frame.front ? 84 : 139) * grow * (1 - melt * 0.88);
  ctx.beginPath();
  ctx.rect(-75, 30 - height, 150, height + 4);
  ctx.clip();
  const outline = frame.front ? ICE_FRONT : ICE_BACK;
  const fill = ctx.createLinearGradient(-58, 16, 48, -108);
  fill.addColorStop(0, frame.front ? "#195f8a99" : "#347faaa6");
  fill.addColorStop(0.35, frame.front ? "#69c7e46b" : "#98e7f3c9");
  fill.addColorStop(0.64, frame.front ? "#d4ffff4a" : "#d5ffffd9");
  fill.addColorStop(1, "#8ed4e5b8");
  ctx.globalAlpha = 1 - melt * 0.55;
  polygon(ctx, outline);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "#e6ffffd9";
  ctx.lineWidth = 2.3;
  ctx.lineJoin = "bevel";
  ctx.stroke();
  const facets = frame.front ? [
    [[-51, 8], [-31, -38], [-18, -9], [-20, 23]],
    [[-31, -38], [-12, -46], [5, -10], [-18, -9]],
    [[-18, -9], [5, -10], [14, 27], [-20, 23]],
    [[5, -10], [22, -61], [30, -16], [14, 27]],
    [[22, -61], [42, -44], [30, -16]],
    [[30, -16], [53, -9], [45, 16], [14, 27]]
  ] : [
    [[-59, -13], [-38, -79], [-18, -104], [-25, -34]],
    [[-18, -104], [2, -96], [-4, -32], [-25, -34]],
    [[2, -96], [20, -111], [43, -81], [27, -31]],
    [[43, -81], [55, -39], [57, -9], [27, -31]]
  ];
  facets.forEach((facet, i) => {
    polygon(ctx, facet);
    ctx.fillStyle = ["#14588624", "#edffff59", "#73c8ed1a", "#f4ffff61", "#2e719d49", "#c9faff40"][i % 6];
    ctx.fill();
  });
  if (frame.front) {
    crack(ctx, [[-40, -24], [-24, -19], [-19, -7], [-5, 0], [1, 17]], 1.3);
    crack(ctx, [[-19, -7], [-32, 3], [-35, 15]], 0.8);
    crack(ctx, [[23, -49], [18, -31], [28, -22], [24, -7], [36, 4]], 1.2);
    crack(ctx, [[24, -7], [9, -2], [1, 8]], 0.8);
    crack(ctx, [[-4, -34], [5, -21], [2, -10]], 0.8);
    for (let i = 0; i < 22; i++) {
      const x = (hash(i + 18) - 0.5) * 79, y = -hash(i + 62) * 40 + 12;
      ctx.globalAlpha = (0.18 + hash(i) * 0.45) * (1 - melt);
      ctx.fillStyle = "#f1ffff";
      ctx.beginPath();
      ctx.ellipse(x, y, 0.8 + hash(i + 4) * 1.4, 2 + hash(i + 8) * 2, -0.3, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1 - melt * 0.5;
    crack(ctx, [[-44, 12], [-18, 19], [13, 22], [40, 12]], 2);
  } else {
    crack(ctx, [[-38, -72], [-30, -48], [-38, -23]], 1.2);
    crack(ctx, [[31, -88], [26, -62], [43, -42]], 1);
  }
  ctx.restore();
  if (frame.front && melt > 0) {
    for (let i = 0; i < 9; i++) {
      const t = clamp((melt - hash(i + 4) * 0.2) / 0.8), x = (hash(i + 21) - 0.5) * 89, y = -18 + hash(i + 8) * 26 + t * t * 23;
      ctx.globalAlpha = Math.sin(t * Math.PI) * 0.8;
      polygon(ctx, [[x, y - 4], [x + 5, y - 2], [x + 2, y + 3], [x - 3, y + 1]]);
      ctx.fillStyle = "#c7f5ff";
      ctx.fill();
    }
  }
  ctx.restore();
}
function drawIceWall(ctx, frame) {
  const { grow, melt, life } = materialState(frame.progress);
  if (life <= 0) return;
  ctx.save();
  ctx.translate(frame.x, frame.y);
  if (!frame.front) frostGround(ctx, life, 31);
  const start = frame.front ? 0 : Math.PI, segments = 8, radius = 62, depth = 22;
  ctx.globalAlpha = Math.min(1, life * 3) * (1 - melt * 0.45);
  for (let i = 0; i < segments; i++) {
    const a = start + i * Math.PI / segments, b = start + (i + 1) * Math.PI / segments;
    const x0 = Math.cos(a) * radius, y0 = Math.sin(a) * depth, x1 = Math.cos(b) * radius, y1 = Math.sin(b) * depth;
    const variation = [0, 9, 4, 13, 7, 0, 11, 5, 0];
    const h0 = ((frame.front ? 45 : 77) + variation[i]) * grow * (1 - melt), h1 = ((frame.front ? 45 : 77) + variation[i + 1]) * grow * (1 - melt);
    const body = [[x0, y0], [x0, y0 - h0], [x1, y1 - h1], [x1, y1]];
    const g = ctx.createLinearGradient(x0, y0 - h0, x1, y1);
    g.addColorStop(0, frame.front ? "#b7f7ffb0" : "#c2fbffed");
    g.addColorStop(0.23, frame.front ? "#66cce1a6" : "#72cce4e6");
    g.addColorStop(0.67, frame.front ? "#2776a18c" : "#3c8eb8dd");
    g.addColorStop(1, "#194f7bd9");
    polygon(ctx, body);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "#b9f5ff9c";
    ctx.lineWidth = 1;
    ctx.stroke();
    polygon(ctx, [[x0, y0 - h0], [x1, y1 - h1], [x1 * 0.87, y1 * 0.87 - h1 + 6], [x0 * 0.87, y0 * 0.87 - h0 + 6]]);
    ctx.fillStyle = i % 2 ? "#d5ffffed" : "#8cdaeff2";
    ctx.fill();
    ctx.strokeStyle = "#efffff";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    const midX = (x0 + x1) / 2, midY = (y0 + y1) / 2, midH = (h0 + h1) / 2;
    polygon(ctx, [[x0, y0 - h0], [midX, midY - midH * 0.45], [x1, y1]]);
    ctx.fillStyle = i % 2 ? "#e9ffff22" : "#083d7028";
    ctx.fill();
    if (i === 2 || i === 5) crack(ctx, [[midX, midY - midH * 0.9], [midX - 4, midY - midH * 0.6], [midX + 3, midY - midH * 0.42], [midX + 1, midY - 6]], 0.85);
  }
  for (const side of [-1, 1]) {
    polygon(ctx, [[side * 62, 0], [side * 62, -(frame.front ? 45 : 77) * grow * (1 - melt)], [side * 54, -(frame.front ? 45 : 77) * grow * (1 - melt) + 7], [side * 54, 3]]);
    ctx.fillStyle = frame.front ? "#85dbedc9" : "#387fa6";
    ctx.fill();
  }
  ctx.restore();
}
export {
  drawFreeze,
  drawIceWall,
  materialState
};
