const WIDTH = 512;
const HEIGHT = 288;
const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const wrap = value => value - Math.floor(value);

export const ids = ['icewall', 'skylift', 'mimic', 'salvation', 'curse', 'rescue', 'mirrorb'];

function surface(width = WIDTH, height = HEIGHT) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function inside(points, x, y) {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}

function edge(x, y, width, height, feather = 10) {
  return smooth(Math.min(x, width - 1 - x, y, height - 1 - y) / feather);
}

function texture(pixels, box, select, feather = 0) {
  const [left, top, width, height] = box;
  const canvas = surface(width, height), ctx = canvas.getContext('2d');
  const data = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const from = ((top + y) * WIDTH + left + x) * 4, at = (y * width + x) * 4;
    const r = pixels[from], g = pixels[from + 1], b = pixels[from + 2];
    const alpha = clamp(select(left + x, top + y, r, g, b, from)) * (feather ? edge(x, y, width, height, feather) : 1);
    data.data[at] = r;
    data.data[at + 1] = g;
    data.data[at + 2] = b;
    data.data[at + 3] = Math.round(pixels[from + 3] * alpha);
  }
  ctx.putImageData(data, 0, 0);
  return { canvas, x: left, y: top, width, height };
}

function paint(ctx, layer, dx = 0, dy = 0) {
  ctx.drawImage(layer.canvas, layer.x + dx, layer.y + dy);
}

// Each travelling shape is a soft crop of the painting, not a drawn smoke shape.
function flow(ctx, layers, phase, strength, boost = 1) {
  for (const layer of layers) {
    const life = wrap(phase * (layer.cycles || 1) + layer.phase);
    const fade = Math.sin(Math.PI * life) ** 2;
    ctx.globalAlpha = clamp(strength * layer.alpha * fade * boost);
    const travel = smooth(life) - .5;
    paint(ctx, layer, layer.dx * travel, layer.dy * travel);
  }
}

function material(pixels, boxes, select, motion) {
  return boxes.map((box, i) => ({ ...texture(pixels, box, select, 9), ...motion[i] }));
}

function iceWall(pixels) {
  const ice = (x, y, r, g, b) => smooth((g - r - 9) / 34) * smooth((b - r - 15) / 48)
    * smooth((Math.min(g, b) - 146) / 69);
  const glints = Array.from({ length: 10 }, (_, band) => texture(pixels, [55, 0, 457, 255],
    (x, y, r, g, b) => ice(x, y, r, g, b) * smooth(1 - Math.abs((x * .59 - y * .44) / 38 - band + 1) / 1.3), 5));
  const mist = material(pixels, [[46, 209, 188, 37], [233, 220, 204, 41], [377, 201, 133, 51]],
    (x, y, r, g, b) => smooth((Math.min(r, g, b) - 135) / 65) * smooth((b - r + 12) / 40), [
      { dx: 55, dy: -8, phase: .13, alpha: .6 },
      { dx: -58, dy: -10, phase: .54, alpha: .54 },
      { dx: 28, dy: -10, phase: .8, alpha: .43 },
    ]);
  const snow = texture(pixels, [38, 2, 10, 10],
    (x, y, r, g, b) => smooth((Math.min(r, g, b) - 127) / 65), 1);
  const flakes = Array.from({ length: 45 }, (_, i) => ({
    x: wrap(i * .61803398875) * 566 - 20,
    y: wrap(i * .41421356237) * 277 - 18,
    phase: wrap(i * .754877666),
    scale: i < 10 ? 1.15 + wrap(i * .317) * .4 : .6 + wrap(i * .317) * .65,
    texture: snow,
    depth: 1 + i % 2,
  }));
  return (ctx, phase, strength, wake) => {
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < glints.length; i++) {
      const light = (1 + Math.cos(TAU * (phase - i / glints.length))) / 2;
      ctx.globalAlpha = strength * (.02 + .24 * light ** 7) * (wake ? 1.5 : 1);
      paint(ctx, glints[i]);
    }
    ctx.globalCompositeOperation = 'source-over';
    flow(ctx, mist, phase * 2, strength, wake ? 1.3 : 1);
    for (const flake of flakes) {
      const life = wrap(phase * flake.depth + flake.phase);
      ctx.globalAlpha = strength * .64 * smooth(life / .14) * smooth((1 - life) / .18);
      const size = flake.scale * (wake ? 1.3 : 1);
      ctx.drawImage(flake.texture.canvas, flake.x - life * (65 + flake.depth * 22),
        flake.y + life * 49, flake.texture.width * size, flake.texture.height * size);
    }
  };
}

function rock(pixels, box, seed, motion, outline) {
  const [left, top, width, height] = box;
  const mask = new Uint8Array(width * height), visited = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  let head = 0, end = 1;
  queue[0] = seed[1] * width + seed[0];
  visited[queue[0]] = 1;
  while (head < end) {
    const at = queue[head++], x = at % width, y = Math.floor(at / width);
    if (!inside(outline, left + x, top + y)) continue;
    const p = ((top + y) * WIDTH + left + x) * 4;
    const r = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
    if (b - r > 41 || b - g > 33 || (Math.min(r, g, b) > 211 && r - b < 20)) continue;
    mask[at] = 1;
    for (const next of [x ? at - 1 : -1, x < width - 1 ? at + 1 : -1, at - width, at + width]) {
      if (next < 0 || next >= mask.length || visited[next]) continue;
      visited[next] = 1;
      queue[end++] = next;
    }
  }
  // A one-pixel paint edge travels with the rock; nearby sky paint fills the exposed shape.
  const cover = new Float32Array(mask.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!mask[y * width + x]) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || xx >= width || yy < 0 || yy >= height) continue;
      const at = yy * width + xx;
      cover[at] = Math.max(cover[at], dx || dy ? .62 : 1);
    }
  }
  const layer = texture(pixels, box, (x, y) => cover[(y - top) * width + x - left]);
  const gutter = 4, w = width + gutter * 2, h = height + gutter * 2;
  const plate = surface(w, h), ctx = plate.getContext('2d'), data = ctx.createImageData(w, h);
  const hole = new Uint8Array(w*h), ring = [];
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    let alpha=0;
    for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++) {
      const xx=x-gutter+dx, yy=y-gutter+dy;
      if (xx>=0 && xx<width && yy>=0 && yy<height && cover[yy*width+xx])
        alpha=Math.max(alpha,Math.abs(dx)<2 && Math.abs(dy)<2 ? 1 : .28);
    }
    data.data[(y*w+x)*4+3]=Math.round(alpha*255);
    hole[y*w+x]=alpha>0 ? 1 : 0;
  }
  for (let y=1;y<h-1;y++) for (let x=1;x<w-1;x++) {
    const at=y*w+x;
    if (!hole[at] && (hole[at-1] || hole[at+1] || hole[at-w] || hole[at+w])) ring.push(at);
  }
  // Match intact sky at the boundary, then retain its brush gradients in a seamless fill.
  let best=Infinity, offset=[38,0];
  for (let dy=-64;dy<=64;dy+=4) for (let dx=-64;dx<=64;dx+=4) {
    if (Math.abs(dx)<w && Math.abs(dy)<h) continue;
    const xx=left-gutter+dx, yy=top-gutter+dy;
    if (xx<0 || yy<0 || xx+w>=WIDTH || yy+h>=HEIGHT) continue;
    let cost=0, valid=true;
    for (let y=2;y<h-2 && valid;y+=3) for (let x=2;x<w-2;x+=3) {
      if (!hole[y*w+x]) continue;
      const at=((yy+y)*WIDTH+xx+x)*4;
      if (pixels[at+2]<pixels[at]+8 && pixels[at]<155) { valid=false; break; }
    }
    if (!valid) continue;
    for (const at of ring) {
      const x=at%w,y=Math.floor(at/w);
      const original=((top-gutter+y)*WIDTH+left-gutter+x)*4;
      const candidate=((yy+y)*WIDTH+xx+x)*4;
      for (let c=0;c<3;c++) cost+=(pixels[original+c]-pixels[candidate+c])**2;
    }
    if (cost<best) { best=cost; offset=[dx,dy]; }
  }
  const fill=new Float32Array(w*h*3), patch=new Float32Array(fill.length);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    const at=y*w+x, original=((top-gutter+y)*WIDTH+left-gutter+x)*4;
    const sample=((top-gutter+y+offset[1])*WIDTH+left-gutter+x+offset[0])*4;
    for (let c=0;c<3;c++) {
      patch[at*3+c]=pixels[sample+c];
      fill[at*3+c]=hole[at] ? pixels[sample+c] : pixels[original+c];
    }
  }
  for (let pass=0;pass<240;pass++) for (let y=1;y<h-1;y++) for (let x=1;x<w-1;x++) {
    const at=y*w+x;
    if (!hole[at]) continue;
    for (let c=0;c<3;c++) {
      const gradient=4*patch[at*3+c]-patch[(at-1)*3+c]-patch[(at+1)*3+c]-patch[(at-w)*3+c]-patch[(at+w)*3+c];
      fill[at*3+c]=(fill[(at-1)*3+c]+fill[(at+1)*3+c]+fill[(at-w)*3+c]+fill[(at+w)*3+c]+gradient)/4;
    }
  }
  for (let at=0;at<w*h;at++) for (let c=0;c<3;c++) data.data[at*4+c]=fill[at*3+c];
  ctx.putImageData(data, 0, 0);
  return { ...layer, plate: { canvas: plate, x: left - gutter, y: top - gutter }, ...motion };
}

function skyLift(pixels) {
  const wind = (x, y, r, g, b) => smooth((Math.min(r, g, b) - 159) / 64)
    * smooth((b - r + 23) / 31);
  const winds = material(pixels, [[37, 25, 111, 88], [116, 44, 130, 88], [154, 110, 167, 53],
    [236, 87, 169, 52], [324, 139, 111, 68], [77, 123, 115, 69], [242, 0, 157, 90]], wind, [
    { dx: 22, dy: -11, phase: .04, alpha: .65 }, { dx: 23, dy: -8, phase: .27, alpha: .76 },
    { dx: 31, dy: 8, phase: .49, alpha: .8 }, { dx: 29, dy: 11, phase: .68, alpha: .75 },
    { dx: -13, dy: 18, phase: .87, alpha: .76 }, { dx: 19, dy: -11, phase: .36, alpha: .59 },
    { dx: -15, dy: 9, phase: .6, alpha: .47 },
  ]);
  const clouds = material(pixels, [[0, 10, 86, 139], [360, 22, 152, 82], [22, 148, 163, 70]],
    (x, y, r, g, b) => smooth((Math.min(r, g) - 164) / 63) * smooth((r - b + 14) / 37), [
      { dx: 10, dy: -6, phase: .1, alpha: .45 }, { dx: -13, dy: 5, phase: .46, alpha: .49 },
      { dx: 13, dy: -6, phase: .76, alpha: .4 },
    ]);
  const towerLeft = [[117, 14], [159, 6], [180, 40], [180, 64], [198, 82], [176, 103], [164, 127], [141, 119], [126, 99], [131, 73]];
  const towerRight = [[330, 86], [365, 85], [387, 101], [372, 124], [360, 161], [365, 174], [341, 197], [312, 185], [295, 161], [302, 144], [317, 126]];
  const towers = texture(pixels, [110, 4, 283, 199], (x, y, r, g, b) => {
    if (!inside(towerLeft, x, y) && !inside(towerRight, x, y)) return 0;
    return Math.max(smooth((187 - Math.max(r, g, b)) / 35),
      smooth((r - b - 10) / 29) * smooth((g - b - 3) / 22));
  });
  const rocks = [
    rock(pixels, [112, 131, 32, 31], [17, 13], { dx: -3, rise: 30, phase: .12 },
      [[115,141],[122,132],[131,133],[138,137],[142,146],[138,155],[136,159],[122,152],[116,147]]),
    rock(pixels, [196, 104, 32, 32], [16, 16], { dx: 5, rise: 35, phase: .43 },
      [[199,120],[201,113],[210,107],[220,110],[225,116],[224,127],[220,134],[211,132],[206,127]]),
    rock(pixels, [385, 181, 32, 35], [16, 17], { dx: 4, rise: 33, phase: .72 },
      [[387,202],[392,190],[403,182],[414,188],[412,201],[405,212],[393,213]]),
    rock(pixels, [85, 98, 24, 31], [12, 15], { dx: -4, rise: 27, phase: .61 },
      [[91,106],[97,99],[102,102],[107,114],[106,125],[102,128],[94,121],[91,113]]),
  ];
  return (ctx, phase, strength, wake) => {
    flow(ctx, clouds, phase, strength);
    for (const part of rocks) { ctx.globalAlpha = 1; paint(ctx, part.plate); }
    flow(ctx, winds, phase * 2, strength, wake ? 1.15 : 1);
    ctx.globalAlpha = 1;
    paint(ctx, towers);
    for (const part of rocks) {
      const life = wrap(phase + part.phase);
      const travel = wake ? Math.sin(Math.PI * clamp(phase * 5.6 / 3.2)) : smooth(life);
      const visible = wake ? 1 : smooth(life / .13) * smooth((1 - life) / .24);
      ctx.globalAlpha = visible;
      paint(ctx, part, part.dx * travel, -part.rise * travel);
    }
  };
}

function mimic(pixels) {
  const skyline = [[0,64],[35,58],[60,30],[86,62],[126,20],[157,64],[184,57],
    [199,53],[221,87],[243,85],[275,107],[310,112],[340,110],[374,110],[406,100],
    [438,72],[463,63],[482,31],[511,55]];
  const sky = texture(pixels, [0,0,512,120], (x,y) => {
    let bottom = 0;
    for (let i = 1; i < skyline.length; i++) if (x >= skyline[i-1][0] && x <= skyline[i][0]) {
      const a = skyline[i-1], b = skyline[i];
      bottom = a[1] + (b[1]-a[1]) * (x-a[0]) / (b[0]-a[0]); break;
    }
    return smooth((bottom-y)/12) * smooth(Math.min(x,511-x)/22)
      * smooth((Math.hypot(x-374,y-44)-49)/14);
  });
  const movingSky = surface(), movingCtx = movingSky.getContext('2d');
  const groundLight = Array.from({ length: 6 }, (_, i) => texture(pixels, [231, 140, 263, 111],
    (x, y, r, g, b) => smooth((r - 102) / 65) * smooth((b - g - 15) / 46)
      * smooth(1 - Math.abs(y - 151 - i * 15) / 22), 12));
  const shadow = texture(pixels, [209, 166, 258, 96], (x, y, r, g, b) =>
    smooth((68 - r) / 23) * smooth((b - r - 12) / 29), 10);
  return (ctx, phase, strength, wake) => {
    movingCtx.clearRect(0,0,WIDTH,HEIGHT);
    for (let row = 0; row < 120; row++) {
      const drift = 16 * Math.sin(TAU * phase * 2 + row * .018) * strength;
      movingCtx.drawImage(sky.canvas,0,row,WIDTH,1,drift,row,WIDTH,1);
    }
    movingCtx.globalCompositeOperation = 'destination-in';
    movingCtx.drawImage(sky.canvas,0,0);
    movingCtx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = strength;
    ctx.drawImage(movingSky,0,0);
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < groundLight.length; i++) {
      ctx.globalAlpha = strength * .095 * ((1 + Math.cos(TAU * (phase - i * .12))) / 2) ** 3;
      paint(ctx, groundLight[i]);
    }
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = strength * (.035 + .07 * (1 + Math.cos(phase * TAU)) / 2);
    paint(ctx, shadow);
    ctx.globalCompositeOperation = 'source-over';
  };
}

function salvation(pixels) {
  const cyan = (x, y, r, g, b) => smooth((g - r - 17) / 53) * smooth((b - r - 15) / 52)
    * smooth((g - 102) / 86);
  const vapour = material(pixels, [[188, 155, 104, 73], [215, 184, 108, 88], [122, 218, 103, 65], [268, 209, 83, 72]], cyan, [
    { dx: -9, dy: -46, phase: .04, alpha: .83 }, { dx: 11, dy: -50, phase: .37, alpha: .77 },
    { dx: 8, dy: -35, phase: .62, alpha: .55 }, { dx: -9, dy: -38, phase: .84, alpha: .61 },
  ]);
  const edges = Array.from({ length: 8 }, (_, i) => texture(pixels, [176, 41, 130, 228],
    (x, y, r, g, b) => cyan(x, y, r, g, b) * smooth(1 - Math.abs(y - 247 + i * 25) / 35), 7));
  // The light can travel along the source edge; the complete rook stays still.
  const rook = texture(pixels, [218, 42, 76, 122], (x, y, r, g, b) =>
    smooth((r - b - 3) / 25) * smooth((r - 114) / 69));
  return (ctx, phase, strength, wake) => {
    flow(ctx, vapour, phase * 2, strength, wake ? 1.22 : 1);
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < edges.length; i++) {
      const travel = (1 + Math.cos(TAU * (phase * 2 - i * .105))) / 2;
      ctx.globalAlpha = strength * (.025 + .48 * travel ** 4);
      paint(ctx, edges[i]);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    paint(ctx, rook);
  };
}

function curse(pixels) {
  const purple = (x, y, r, g, b) => smooth((b - g - 19) / 49) * smooth((r - g - 9) / 41)
    * smooth((r - 51) / 55);
  const wisps = material(pixels, [[88, 63, 104, 78], [129, 93, 126, 85], [169, 126, 100, 64],
    [211, 139, 85, 58], [302, 127, 72, 82]], purple, [
      { dx: 19, dy: -6, phase: .04, alpha: .8 }, { dx: 27, dy: -7, phase: .27, alpha: .88 },
      { dx: 24, dy: -5, phase: .52, alpha: .88 }, { dx: 14, dy: -8, phase: .71, alpha: .8 },
      { dx: -10, dy: -11, phase: .89, alpha: .68 },
    ]);
  const silhouette = [[259, 207], [249, 193], [255, 174], [264, 169], [263, 139], [267, 121], [256, 97],
      [263, 70], [284, 51], [312, 47], [326, 43], [332, 62], [344, 57], [343, 84], [349, 101],
      [344, 119], [333, 121], [328, 112], [327, 131], [338, 147], [333, 171], [339, 181], [344, 196], [340, 213]];
  const knight = texture(pixels, [245, 40, 109, 186], (x, y) => inside(silhouette, x, y) ? 1 : 0);
  const light = texture(pixels, [193, 110, 164, 97], purple, 11);
  return (ctx, phase, strength, wake) => {
    flow(ctx, wisps, phase * 2, strength, wake ? 1.23 : 1);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = strength * .11 * ((1 + Math.cos(TAU * phase)) / 2) ** 2;
    paint(ctx, light);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    paint(ctx, knight);
  };
}

function rescue(pixels) {
  const waterArea = [[167,177],[194,176],[211,172],[247,174],[271,204],[303,226],[334,231],
    [350,220],[354,204],[374,189],[393,194],[395,207],[420,209],[430,231],[447,254],
    [410,266],[384,273],[307,271],[292,282],[249,268],[237,262],[214,271],[196,256],
    [177,257],[172,243],[137,231],[146,216],[166,212]];
  const waterPaint = (x, y, r, g, b) => inside(waterArea, x, y)
    ? smooth((b - r - 6) / 37) * smooth((g - r - 5) / 29) : 0;
  const ripples = material(pixels, [[136,181,105,63],[174,173,85,66],[330,187,110,72],
    [176,223,139,62],[267,236,164,48]], waterPaint, [
      { dx: 27, dy: 3, phase: .05, alpha: .88 }, { dx: -24, dy: 3, phase: .29, alpha: .76 },
      { dx: 30, dy: 3, phase: .51, alpha: .85 }, { dx: -28, dy: 3, phase: .72, alpha: .78 },
      { dx: 30, dy: 2, phase: .9, alpha: .82 },
    ]);
  const waterMask = texture(pixels, [0,0,WIDTH,HEIGHT], (x,y) => inside(waterArea,x,y) ? 1 : 0);
  const waterFrame = surface(), waterCtx = waterFrame.getContext("2d");
  const mist = material(pixels, [[7,124,157,29],[300,125,207,30]],
    (x, y, r, g, b) => smooth((Math.min(r, g, b) - 142) / 73), [
      { dx: 16, dy: -3, phase: .19, alpha: .41 }, { dx: -19, dy: -3, phase: .67, alpha: .46 },
    ]);
  const iceArea = [[62,0],[160,0],[191,55],[208,77],[249,79],[262,96],[267,122],
    [275,142],[269,166],[260,177],[211,175],[196,154],[181,126],[151,98],[124,76],[93,43]];
  const glints = Array.from({ length: 8 }, (_, i) => texture(pixels, [61,0,216,179], (x, y, r, g, b) => {
    if (!inside(iceArea, x, y)) return 0;
    return smooth((g - r - 8) / 34) * smooth((b - r - 12) / 46) * smooth((Math.min(g, b) - 150) / 70)
      * smooth(1 - Math.abs((x * .65 + y * .55) / 35 - i - 1) / 1.1);
  }));
  const armOutline = [[259,151],[273,165],[289,185],[309,207],[337,232],[323,239],
    [291,228],[275,212],[261,193],[248,176],[239,171]];
  const arm = texture(pixels, [237,149,103,94], (x, y) => inside(armOutline, x, y) ? 1 : 0);
  const snow = texture(pixels, [326,194,9,10], (x, y, r, g, b) => smooth((Math.min(r, g, b) - 135) / 70), 1);
  const flakes = Array.from({ length: 24 }, (_, i) => ({ x: wrap(i * .618034) * 558 - 18,
    y: wrap(i * .414214) * 180 + 16, phase: wrap(i * .754878), scale: .25 + wrap(i * .317) * .39 }));
  return (ctx, phase, strength, wake) => {
    flow(ctx, mist, phase, strength);
    waterCtx.clearRect(0,0,WIDTH,HEIGHT);
    flow(waterCtx, ripples, phase * 2, strength, wake ? 1.2 : 1);
    waterCtx.globalAlpha = 1; waterCtx.globalCompositeOperation = "destination-in";
    paint(waterCtx,waterMask);
    waterCtx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1; ctx.drawImage(waterFrame,0,0);
    ctx.globalAlpha = 1;
    paint(ctx, arm);
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < glints.length; i++) {
      const light = (1 + Math.cos(TAU * (phase - i * .105))) / 2;
      ctx.globalAlpha = strength * (.015 + .26 * light ** 6);
      paint(ctx, glints[i]);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const flake of flakes) {
      const life = wrap(phase + flake.phase);
      ctx.globalAlpha = strength * .46 * Math.sin(Math.PI * life) ** 2;
      ctx.drawImage(snow.canvas, flake.x - 31 * life, flake.y + 27 * life, snow.width * flake.scale, snow.height * flake.scale);
    }
  };
}

function mirror(pixels) {
  const card = [[290,91],[326,96],[312,165],[274,156]];
  const hand = [[312,115],[332,116],[341,123],[347,137],[352,148],[365,153],[377,166],
    [370,185],[352,184],[337,171],[327,161],[316,149],[309,139],[304,130],[309,125],[302,121]];
  const glass = (x, y) => ((x - 316) / 73) ** 2 + ((y - 128) / 96) ** 2 < 1;
  const blue = (r, g, b) => smooth((b - r - 5) / 34) * smooth((g - r + 2) / 30)
    * smooth((b - g + 4) / 24) * smooth((g - 60) / 90);
  const glassPaint = (x, y, r, g, b) => glass(x, y) && !inside(card, x, y) && !inside(hand, x, y)
    && !(x > 332 && y < 79) ? blue(r, g, b) : 0;
  const wisps = material(pixels, [[283,60,66,49],[322,91,51,45],[256,119,45,66],
    [278,168,66,51],[340,151,48,64]], glassPaint, [
      { dx: 24, dy: -9, phase: .04, alpha: .9 }, { dx: 20, dy: 12, phase: .28, alpha: .88 },
      { dx: -18, dy: -16, phase: .5, alpha: .86 }, { dx: 26, dy: -14, phase: .71, alpha: .92 },
      { dx: -20, dy: -18, phase: .9, alpha: .9 },
    ]);
  // Only the mirror's painted air moves; its contents and ornate edge stay registered.
  const fixed = texture(pixels, [234,28,171,207], (x, y) =>
    !glass(x, y) || inside(card, x, y) || inside(hand, x, y)
      || (y > 207 && x > 290 && x < 337) ? 1 : 0);
  const boundary = Array.from({ length: 4 }, (_, i) => texture(pixels, [345,137,60,68],
    (x, y, r, g, b) => blue(r, g, b) * smooth(1 - Math.abs(y - 150 - i * 15) / 24), 9));
  const frost = Array.from({ length: 4 }, (_, i) => texture(pixels, [274,90,53,76],
    (x, y, r, g, b) => inside(card, x, y) ? blue(r, g, b)
      * smooth(1 - Math.abs(y - 103 - i * 16) / 24) : 0));
  const sheen = Array.from({ length: 9 }, (_, i) => texture(pixels, [244,35,145,188],
    (x,y,r,g,b) => glassPaint(x,y,r,g,b) * smooth(1 - Math.abs(y - 49 - i * 20) / 27)));
  const candles = [[70,87,13,27],[257,88,14,30],[273,170,12,21]].map(box => texture(pixels, box,
    (x, y, r, g, b) => smooth((r - 166) / 65) * smooth((g - b - 14) / 51), 2));
  return (ctx, phase, strength, wake) => {
    flow(ctx, wisps, phase * 2, strength, wake ? 1.15 : 1);
    ctx.globalAlpha = 1;
    paint(ctx, fixed);
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < sheen.length; i++) {
      const passage = Math.max(0, Math.cos(TAU * (phase * 2 - i / 9)));
      ctx.globalAlpha = strength * .78 * passage ** 6;
      paint(ctx, sheen[i]);
    }
    for (let i = 0; i < boundary.length; i++) {
      const light = (1 + Math.cos(TAU * (phase * 2 - i * .17))) / 2;
      ctx.globalAlpha = strength * .38 * light ** 5;
      paint(ctx, boundary[i]);
    }
    for (let i = 0; i < frost.length; i++) {
      const light = (1 + Math.cos(TAU * (phase - i * .15))) / 2;
      ctx.globalAlpha = strength * .4 * light ** 5;
      paint(ctx, frost[i]);
    }
    for (let i = 0; i < candles.length; i++) {
      const light = .5 + .3 * Math.sin(TAU * (phase * 3 + i * .29)) + .2 * Math.sin(TAU * (phase * 7 + i * .17));
      ctx.globalAlpha = strength * (.035 + .19 * light);
      paint(ctx, candles[i]);
    }
    ctx.globalCompositeOperation = 'source-over';
  };
}

export function createEffect(id, image) {
  if (!ids.includes(id)) throw new Error(`Unknown air effect: ${id}`);
  const source = surface(), ctx = source.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);
  const pixels = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
  const render = { icewall: iceWall, skylift: skyLift, mimic, salvation, curse, rescue, mirrorb: mirror }[id](pixels);
  return {
    draw(ctx, { time = 0, mode = 'idle', reduced = false } = {}) {
      const seconds = Number.isFinite(time) ? time : 0;
      const wake = mode === 'awaken';
      const t = wake ? Math.max(0, Math.min(3.2, seconds)) : wrap(seconds / 8) * 8;
      ctx.save();
      try {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.rect(0, 0, WIDTH, HEIGHT);
        ctx.clip();
        ctx.drawImage(source, 0, 0);
        if (reduced || (wake && (t === 0 || t === 3.2))) return;
        const strength = wake ? smooth(t / .5) * (1 - smooth((t - 2.05) / 1.15)) : 1;
        render(ctx, wake ? t / 5.6 : t / 8, strength, wake);
      } finally {
        ctx.restore();
      }
    },
  };
}
