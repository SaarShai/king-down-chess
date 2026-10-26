const WIDTH = 512, HEIGHT = 288, TAU = Math.PI * 2;
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const fract = n => n - Math.floor(n);
const random = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

export const ids = ['haste', 'flight', 'leap', 'vault', 'march', 'strike', 'rally'];

function surface(width = WIDTH, height = HEIGHT) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
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

const red = (r, g, b) => r > g * 1.34 && r > b * 1.2 && r - g > 24;
const gold = (r, g, b) => smooth((r - b - 35) / 55) * smooth((g - b - 18) / 45) * smooth((r - 145) / 80);
const cream = (r, g, b) => smooth((r - 190) / 45) * smooth((g - 165) / 50) * smooth((g - b - 18) / 35);
const green = (r, g, b) => smooth((Math.max(r, g) - 80) / 50) * smooth((Math.min(r, g) - b - 28) / 45);
const warmMist = (r, g, b) => smooth((r - 145) / 70) * smooth((g - 132) / 65) * smooth((r - b + 5) / 45);

// Source colour defines the visible contour; the bound only selects the material.
function texture(pixels, box, test, feather = 3) {
  const [x, y, w, h] = box, canvas = surface(w, h), ctx = canvas.getContext('2d');
  const data = ctx.createImageData(w, h), mask = new Float32Array(w * h);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const p = ((y + yy) * WIDTH + x + xx) * 4, q = (yy * w + xx) * 4;
    const edge = feather ? smooth(Math.min(xx, yy, w - 1 - xx, h - 1 - yy) / feather) : 1;
    const alpha = clamp(test(pixels[p], pixels[p + 1], pixels[p + 2], x + xx, y + yy)) * edge;
    mask[yy * w + xx] = alpha;
    data.data[q] = pixels[p]; data.data[q + 1] = pixels[p + 1]; data.data[q + 2] = pixels[p + 2];
    data.data[q + 3] = Math.round(255 * alpha);
  }
  ctx.putImageData(data, 0, 0);
  return { canvas, x, y, w, h, mask };
}

function cutout(pixels, box, test, motion) {
  const part = texture(pixels, box, test, 0), { x, y, w, h } = part;
  const mask = part.mask, expanded = mask.slice();
  for (let yy = 1; yy < h - 1; yy++) for (let xx = 1; xx < w - 1; xx++) {
    if (mask[yy * w + xx] < .6) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) expanded[(yy + dy) * w + xx + dx] = 1;
  }
  // shortcut: nearest source paint fills short exposed edges; larger motion needs a clean plate.
  const layer = surface(w, h), plate = surface(w, h), front = new Uint8ClampedArray(w * h * 4);
  const back = new Uint8ClampedArray(front.length), nearest = new Int32Array(mask.length).fill(-1);
  const queue = new Int32Array(mask.length);
  let head = 0, end = 0;
  for (let at = 0; at < mask.length; at++) if (!expanded[at]) { nearest[at] = at; queue[end++] = at; }
  while (head < end) {
    const at = queue[head++], xx = at % w;
    for (const next of [xx ? at - 1 : -1, xx < w - 1 ? at + 1 : -1, at - w, at + w]) {
      if (next < 0 || next >= mask.length || nearest[next] !== -1) continue;
      nearest[next] = nearest[at]; queue[end++] = next;
    }
  }
  for (let at = 0; at < mask.length; at++) {
    if (!expanded[at]) continue;
    const xx = at % w, yy = Math.floor(at / w), p = ((y + yy) * WIDTH + x + xx) * 4;
    const near = nearest[at] < 0 ? at : nearest[at];
    const from = ((y + Math.floor(near / w)) * WIDTH + x + near % w) * 4, q = at * 4;
    for (let c = 0; c < 3; c++) { front[q + c] = pixels[p + c]; back[q + c] = pixels[from + c]; }
    front[q + 3] = back[q + 3] = Math.round(255 * expanded[at]);
  }
  layer.getContext('2d').putImageData(new ImageData(front, w, h), 0, 0);
  plate.getContext('2d').putImageData(new ImageData(back, w, h), 0, 0);
  return { layer, plate, mask: expanded, x, y, w, h, ...motion };
}

function cloth(pixels, box, polygon, anchor, amount, offset = 0) {
  return cutout(pixels, box, (r, g, b, x, y) => red(r, g, b) && inside(polygon, x, y),
    { anchorX: anchor[0], anchorY: anchor[1], shear: amount, offset, cloth: true });
}

function leaf(pixels, box, pivot, dx, dy, turn, offset, test = green) {
  return cutout(pixels, box, test, { anchorX: pivot[0], anchorY: pivot[1], dx, dy, turn, offset });
}

function exclusion(polygons) {
  return polygons.map(points => {
    const path = new Path2D();
    path.rect(0, 0, WIDTH, HEIGHT);
    path.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) path.lineTo(points[i][0], points[i][1]);
    path.closePath();
    return path;
  });
}

function field(pixels, box, test, dx, dy, offset, alpha = .5) {
  return { ...texture(pixels, box, test, 9), dx, dy, offset, alpha };
}

function route(knots, closed = false) {
  const result = [];
  const count = closed ? knots.length : knots.length - 1;
  for (let i = 0; i < count; i++) {
    const a = knots[i], b = knots[(i + 1) % knots.length];
    const steps = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
    for (let j = 0; j < steps; j++) {
      const u = j / steps;
      result.push({ x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u,
        width: a[2] + (b[2] - a[2]) * u, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) });
    }
  }
  return result;
}

function grains(pixels, samples, guide, count, size, opacity, closed = false) {
  const tiles = samples.map(([x, y]) => texture(pixels, [x - 4, y - 4, 9, 9], gold, 2).canvas);
  return { route: route(guide, closed), closed, particles: Array.from({ length: count }, (_, i) => ({
    phase: random(i + 11), lane: (random(i + 191) - .5) * 1.8,
    size: size * (.55 + random(i + 991)), alpha: opacity * (.4 + random(i + 714) * .6),
    laps: 1 + i % 3, tile: tiles[i % tiles.length],
  })) };
}

function setup(id, pixels) {
  const parts = [], fields = [], flows = [], sparks = [];
  let stable = [], fixedInk;
  if (id === 'haste') {
    stable = [[[254,36],[284,36],[304,42],[334,45],[344,63],[341,79],[325,90],[317,154],[323,164],
      [329,178],[322,189],[335,202],[333,229],[324,235],[238,218],[208,198],[213,181],[228,167],[237,149],[248,88],[251,77]]];
    parts.push(cloth(pixels, [151, 8, 131, 64], [[155,23],[184,11],[222,22],[280,13],[280,61],[250,68],[191,64],[160,70],[188,45]], [279,21], .021));
    flows.push(grains(pixels, [[91,153],[110,171],[145,193],[199,209],[357,231],[399,231]],
      [[240,135,3],[194,138,4],[135,142,6],[98,151,9],[90,164,12],[112,182,11],[157,200,9],[210,216,6],
        [271,230,4],[329,237,4],[379,236,8],[419,231,8],[424,221,6],[401,210,4],[365,200,3]], 250, 3.6, .88));
    fields.push(field(pixels, [71,128,160,92], gold, 3,-1,0,.27), field(pixels,[310,206,141,42],gold,3,1,1.5,.3));
  } else if (id === 'flight') {
    stable = [[[257,19],[266,25],[268,34],[259,47],[275,68],[274,76],[264,84],[274,91],[274,108],
      [283,145],[293,161],[294,189],[283,196],[253,197],[219,187],[214,179],[218,169],[218,159],[226,148],
      [237,94],[237,86],[244,78],[234,68],[236,52],[247,36],[250,25]], [[124,215],[377,215],[379,265],[126,265]]];
    parts.push(cloth(pixels,[124,2,121,103],[[126,2],[156,23],[200,27],[214,47],[211,68],[241,84],[243,101],[193,89],[180,74],[183,52],[141,55],[126,37]],[243,94],.048));
    parts.push(cloth(pixels,[281,145,110,65],[[282,147],[318,155],[344,172],[349,193],[366,202],[390,186],[377,206],[350,208],[335,196],[312,178],[282,177]],[284,157],.05,1.2));
    fields.push(field(pixels,[282,25,92,107],cream,-6,3,0,.8),field(pixels,[142,113,116,101],cream,7,2,1.6,.75));
    parts.push(leaf(pixels,[382,54,18,20],[390,64],7,-4,.13,.4,cream),leaf(pixels,[297,74,17,15],[304,81],6,-4,-.16,1.8,cream),
      leaf(pixels,[122,170,14,18],[129,178],-5,4,.16,2.8,cream),leaf(pixels,[183,109,17,12],[191,115],-7,2,-.2,3.9,cream));
  } else if (id === 'leap') {
    stable = [[[107,35],[133,64],[153,67],[164,51],[189,39],[186,19],[192,14],[204,26],[208,49],[198,65],
      [202,77],[215,76],[247,91],[281,101],[314,112],[332,127],[345,150],[360,151],[377,183],[390,195],
      [390,207],[379,204],[367,198],[359,183],[350,177],[338,167],[320,165],[298,158],[281,153],[256,151],
      [235,145],[231,156],[233,162],[225,166],[211,163],[201,163],[187,151],[175,132],[176,125],[184,125],
      [191,118],[182,116],[168,117],[153,111],[154,105],[161,100],[154,93],[157,79],[143,75],[119,77],[112,62]],
      [[61,191],[91,191],[106,260],[56,260]],[[173,190],[202,190],[215,260],[168,260]],
      [[297,190],[328,190],[342,260],[290,260]],[[424,190],[455,190],[469,260],[417,260]]];
    const valleyMist = (r,g,b) => smooth((Math.min(r,g)-118)/50)*smooth((r-b+20)/45);
    fields.push(field(pixels,[202,143,253,85],valleyMist,13,-3,0,.85),field(pixels,[99,116,98,70],valleyMist,5,0,1.6,.42),
      field(pixels,[358,120,151,50],warmMist,-4,1,3.2,.38));
    // Small leaf paint from the foreground travels only through the open valley.
    const leafTile = texture(pixels,[52,187,20,12],(r,g,b,x,y) =>
      inside([[0,8],[4,3],[10,1],[19,1],[17,6],[12,10],[6,11]],x-52,y-187) ? 1 : 0,0).canvas;
    for (const [x,y,offset,size] of [[392,68,.2,24],[446,100,.55,22],[427,133,.8,20]])
      sparks.push({ tile:leafTile, x,y, dx:62, dy:-12, size, offset, leaf:true });
  } else if (id === 'vault') {
    stable = [[[168,158],[181,143],[195,140],[208,122],[226,113],[252,105],[269,99],[280,88],[274,82],
      [252,79],[244,73],[244,61],[251,53],[257,44],[260,54],[259,66],[267,70],[266,60],[272,49],[277,62],
      [283,62],[281,46],[286,41],[289,55],[296,58],[298,63],[305,58],[307,51],[312,61],[312,73],
      [318,80],[327,88],[336,89],[338,95],[332,101],[324,106],[321,119],[310,128],[321,139],[321,149],
      [312,163],[306,169],[296,164],[299,157],[287,160],[279,159],[283,151],[278,144],[261,150],
      [242,151],[217,154],[196,162],[185,171],[175,178],[171,177],[176,163]]];
    parts.push(leaf(pixels,[215,58,23,16],[227,65],9,-4,.16,.3),leaf(pixels,[232,74,17,15],[240,81],11,-3,-.19,1.1),
      leaf(pixels,[172,93,21,22],[182,103],10,-5,.23,2.2),leaf(pixels,[156,116,27,22],[169,127],12,-5,-.15,3.1),
      leaf(pixels,[202,174,24,23],[214,185],10,-6,.19,4.4),leaf(pixels,[219,193,27,25],[232,205],8,-4,-.18,5.4));
    const rockColor = (r,g,b) => smooth((170-Math.max(r,g,b))/55)*smooth((r-b+7)/32);
    parts.push(leaf(pixels,[112,121,16,20],[120,131],3,-4,.07,.8,rockColor),leaf(pixels,[126,153,15,19],[133,162],5,-3,-.08,2.9,rockColor),
      leaf(pixels,[147,150,13,17],[153,158],5,-4,.09,4.1,rockColor),leaf(pixels,[182,180,13,18],[188,189],5,-3,-.08,5.2,rockColor));
    fields.push(field(pixels,[74,88,219,88],cream,5,-2,0,.58),field(pixels,[91,128,105,77],cream,4,-2,1.4,.4));
    flows.push(grains(pixels,[[102,154],[121,171],[149,186]],[[78,180,10],[115,166,12],[143,148,8],[176,127,6],[208,112,3]],65,2.4,.5));
  } else if (id === 'march') {
    // This source is already the approved top 16:9 crop of the square painting.
    stable = [[[0,161],[46,161],[52,198],[93,219],[135,239],[166,239],[165,164],[183,167],[185,195],
      [235,220],[255,220],[284,204],[327,197],[343,192],[351,187],[363,189],[365,210],[412,231],[450,243],
      [512,265],[512,288],[0,288]]];
    parts.push(cloth(pixels,[63,25,70,60],[[65,52],[87,38],[108,37],[131,27],[128,57],[107,65],[86,60],[67,81]],[128,40],.052),
      cloth(pixels,[202,63,54,49],[[204,85],[225,74],[241,76],[255,65],[252,98],[237,106],[222,95],[207,105]],[253,79],.06,1),
      cloth(pixels,[433,90,78,79],[[434,132],[458,119],[473,107],[492,111],[511,94],[511,128],[492,145],[476,141],[457,153],[436,163]],[505,115],.05,2.1),
      cloth(pixels,[260,88,24,37],[[261,105],[272,101],[283,90],[281,119],[268,124],[261,121]],[282,105],.055,3));
    fields.push(field(pixels,[0,101,105,115],()=>1,12,-4,.6,1));
    // The bronze army stays in front of the drifting cream dust; moving flags are excluded.
    fixedInk = texture(pixels,[0,87,512,142],(r,g,b,x,y) => r < 235 && g < 190 && b < 125 && !parts.some(part =>
      x >= part.x && x < part.x + part.w && y >= part.y && y < part.y + part.h
      && part.mask[(y - part.y) * part.w + x - part.x]),0);
    fields.push(field(pixels,[0,118,102,130],warmMist,9,-3,.3,.7),field(pixels,[174,164,180,89],warmMist,11,-2,1.4,.72),
      field(pixels,[398,170,114,93],warmMist,-10,-3,3,.68),field(pixels,[92,2,173,57],warmMist,2,0,4.5,.24));
    flows.push(grains(pixels,[[49,166],[73,193],[325,218],[442,228]],[[9,221,17],[104,196,13],[213,213,10],[319,219,9],[427,238,16],[507,252,20]],70,2.2,.34));
  } else if (id === 'strike') {
    stable = [[[181,61],[189,51],[207,46],[224,50],[233,54],[237,43],[244,35],[255,34],[265,42],[269,61],
      [278,65],[291,74],[300,90],[300,105],[289,116],[299,124],[301,139],[289,152],[275,157],[270,170],
      [266,179],[263,194],[267,213],[277,244],[271,258],[253,258],[244,248],[237,228],[225,218],[214,199],
      [200,190],[198,177],[194,162],[197,149],[194,137],[201,124],[205,119],[191,112],[183,94],[172,91],
      [163,95],[153,94],[148,88],[149,82],[158,76],[165,68]],
      [[111,73],[120,70],[136,78],[270,137],[335,159],[352,162],[429,218],[347,190],[326,171],[268,149],[143,97],[114,82]]];
    parts.push(cloth(pixels,[169,3,98,48],[[170,20],[195,10],[227,5],[251,4],[264,13],[266,27],[253,35],[240,40],[208,48],[181,42]],[253,33],.048),
      cloth(pixels,[108,105,93,70],[[116,131],[134,112],[157,108],[182,112],[200,109],[196,133],[184,147],[171,155],[158,161],[126,173],[137,150],[117,147],[108,143]],[198,118],.048,1.4),
      cloth(pixels,[259,151,46,37],[[261,152],[279,155],[289,165],[304,178],[303,187],[285,174],[274,172],[262,168]],[262,156],.05,2.6));
    fields.push(field(pixels,[68,151,143,80],gold,3,-1,0,.27),field(pixels,[230,194,92,64],gold,3,-2,1.9,.25));
    flows.push(grains(pixels,[[105,184],[135,198],[188,217],[273,237],[302,228]],[[82,161,5],[111,180,8],[155,202,10],[209,225,8],[259,243,7],[301,249,7]],110,2.7,.45));
    for (const [x,y] of [[253,46],[277,84],[236,151],[252,234],[358,181]]) {
      sparks.push({tile:texture(pixels,[x-3,y-3,7,7],(r,g,b)=>smooth((Math.min(r,g)-196)/52),2).canvas,
        x,y,dx:0,dy:0,size:5,offset:random(x+y)});
    }
  } else if (id === 'rally') {
    stable = [
      [[138,109],[150,107],[150,116],[162,117],[162,107],[179,108],[179,117],[187,117],[188,111],[198,114],
        [198,130],[190,137],[189,144],[183,151],[184,194],[192,201],[200,207],[200,215],[205,221],
        [206,237],[198,242],[126,242],[120,238],[121,225],[127,217],[127,209],[139,202],[144,194],
        [145,151],[141,144],[142,136],[137,132]],
      [[400,123],[405,124],[408,129],[404,133],[412,142],[416,153],[419,162],[417,166],[409,170],
        [409,175],[415,178],[414,183],[414,202],[423,206],[424,213],[429,217],[431,230],[427,234],
        [378,234],[372,230],[373,218],[378,211],[382,207],[384,184],[381,179],[383,174],[389,171],
        [385,167],[382,161],[385,149],[393,137],[397,132],[396,128]],
      [[271,15],[277,12],[280,0],[285,0],[286,12],[292,15],[292,21],[287,25],[287,151],[291,156],
        [290,164],[299,170],[300,174],[270,174],[272,169],[278,164],[278,153],[279,25]],
      [[257,173],[308,173],[313,216],[256,216]],
    ];
    // Keep the crown and gold fringe on the same source-cloth layer as the red paint.
    const banner = [[288,24],[347,42],[349,80],[357,111],[375,139],[390,178],[379,181],
      [355,163],[341,183],[325,174],[314,151],[291,137]];
    parts.push(leaf(pixels,[287,24,102,156],[289,40],0,0,0,.4,
      (r,g,b,x,y) => inside(banner,x,y) && (red(r,g,b) || (x > 298 && x < 337 && y > 48 && y < 104)
        || (r > g * 1.2 && g > b * 1.5 && r - g > 19))));
    Object.assign(parts[0], { cloth:true, shear:.045 });
    parts.push(cloth(pixels,[287,13,119,32],[[289,16],[311,18],[330,26],[345,31],[362,38],[378,35],
      [390,33],[404,39],[392,37],[380,38],[363,42],[345,35],[329,29],[309,21],[289,19]],[289,18],.045,.8));
    parts.push(cloth(pixels,[339,36,105,37],[[341,38],[353,43],[363,55],[375,63],[388,63],[402,58],
      [413,58],[425,65],[437,66],[442,64],[439,70],[429,70],[414,64],[404,61],[391,67],[377,67],
      [363,60],[352,49],[341,43]],[341,40],.05,2.1));
    const leftWake = [[25,261],[55,249],[83,235],[102,217],[111,213],[126,221],[142,234],[166,240],
      [207,246],[220,253],[202,260],[170,258],[140,251],[119,252],[90,263],[54,273],[25,276]];
    const rightWake = [[349,227],[365,218],[378,220],[397,228],[425,233],[447,236],[478,238],[510,247],
      [510,256],[477,253],[448,246],[423,241],[399,239],[375,235],[350,235]];
    const dust = (r,g,b) => cream(r,g,b) * smooth((b-105)/60);
    fields.push(field(pixels,[25,211,199,67],(r,g,b,x,y)=>inside(leftWake,x,y)*dust(r,g,b),-7,-2,.3,.65),
      field(pixels,[347,213,165,46],(r,g,b,x,y)=>inside(rightWake,x,y)*dust(r,g,b),7,-2,2.2,.62));
    flows.push(grains(pixels,[[89,240],[113,227],[145,248],[183,250]],
      [[140,238,4],[119,244,6],[94,253,7],[65,264,7],[29,273,5]],75,2.1,.4));
    flows.push(grains(pixels,[[362,228],[422,237],[458,245],[490,248]],
      [[393,230,3],[420,236,4],[450,242,5],[478,247,5],[510,252,4]],60,1.9,.35));
  }
  // A drifting source patch must not carry any fixed figure paint beyond its edge.
  for (const patch of fields) {
    const ctx = patch.canvas.getContext('2d'), data = ctx.createImageData(patch.w, patch.h);
    for (let yy = 0; yy < patch.h; yy++) for (let xx = 0; xx < patch.w; xx++) {
      const x = patch.x + xx, y = patch.y + yy, at = yy * patch.w + xx;
      const fixedAt = fixedInk && y >= fixedInk.y && y < fixedInk.y + fixedInk.h
        ? (y - fixedInk.y) * fixedInk.w + x - fixedInk.x : -1;
      if (!patch.mask[at] || stable.some(polygon => inside(polygon, x, y)) || (fixedAt >= 0 && fixedInk.mask[fixedAt])) continue;
      const p = (y * WIDTH + x) * 4, q = at * 4;
      data.data[q] = pixels[p]; data.data[q+1] = pixels[p+1]; data.data[q+2] = pixels[p+2];
      data.data[q+3] = Math.round(255 * patch.mask[at]);
    }
    ctx.putImageData(data,0,0);
  }
  return { parts, fields, flows, sparks, fixedInk, clip: exclusion(stable) };
}

export function createEffect(id, image) {
  if (!ids.includes(id)) throw new Error(`Unknown movement effect: ${id}`);
  const source = surface(), sourceCtx = source.getContext('2d', { willReadFrequently: true });
  sourceCtx.drawImage(image, 0, 0, WIDTH, HEIGHT);
  const pixels = sourceCtx.getImageData(0, 0, WIDTH, HEIGHT).data;
  const effect = setup(id, pixels);

  const renderer = {
    draw(ctx, { time = 0, mode = 'idle', reduced = false } = {}) {
      const seconds = Number.isFinite(time) ? time : 0, wake = mode === 'awaken';
      const t = wake ? Math.max(0, Math.min(3.2, seconds)) : ((seconds % 8) + 8) % 8;
      const cycle = wake ? t / 3.2 : t / 8, phase = cycle * TAU;
      const envelope = wake ? smooth(t / .35) * smooth((3.2 - t) / .8) : 1;
      const strength = envelope * (wake ? 1.35 : 1);
      ctx.save();
      try {
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none'; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        ctx.drawImage(source, 0, 0);
        if (reduced || (wake && (t === 0 || t === 3.2))) return;

        for (const part of effect.parts) {
          ctx.globalAlpha = envelope;
          ctx.drawImage(part.plate, part.x, part.y);
          ctx.save();
          ctx.translate(part.anchorX, part.anchorY);
          const wave = Math.sin(phase * 2 + part.offset) - Math.sin(part.offset);
          if (part.cloth) {
            const ripple = wave * .78 + Math.sin(phase * 3) * .22;
            ctx.transform(1, part.shear * ripple * strength, part.shear * .13 * Math.sin(phase * 3) * strength, 1, 0, 0);
          } else {
            ctx.translate(part.dx * wave * strength, part.dy * wave * strength);
            ctx.rotate(part.turn * wave * strength);
          }
          ctx.drawImage(part.layer, part.x - part.anchorX, part.y - part.anchorY);
          ctx.restore();
        }

        ctx.save();
        for (const clip of effect.clip) ctx.clip(clip, 'evenodd');
        for (const patch of effect.fields) {
          const drift = Math.sin(phase + patch.offset) - Math.sin(patch.offset);
          ctx.globalAlpha = patch.alpha * envelope * (.74 + .26 * Math.cos(phase * 2 + patch.offset));
          ctx.drawImage(patch.canvas, patch.x + patch.dx * drift * strength, patch.y + patch.dy * drift * strength);
        }
        for (const flow of effect.flows) for (const particle of flow.particles) {
          const u = fract(particle.phase + cycle * particle.laps), p = flow.route[Math.floor(u * flow.route.length)];
          const spread = particle.lane * p.width;
          const fade = flow.closed ? 1 : Math.sin(Math.PI * u) ** 2;
          ctx.globalAlpha = particle.alpha * envelope * fade;
          ctx.save();
          ctx.translate(p.x - Math.sin(p.angle) * spread, p.y + Math.cos(p.angle) * spread);
          ctx.rotate(p.angle);
          ctx.drawImage(particle.tile, -particle.size / 2, -particle.size / 2, particle.size, particle.size);
          ctx.restore();
        }
        for (const spark of effect.sparks) {
          if (!spark.leaf) continue;
          const u = fract(cycle * (spark.leaf ? 2 : 1) + spark.offset), fade = Math.sin(Math.PI * u) ** (spark.leaf ? 2 : 20);
          ctx.globalAlpha = envelope * fade * (spark.leaf ? .78 : .72);
          ctx.save();
          ctx.translate(spark.x + spark.dx * (u - .5) * strength, spark.y + spark.dy * (u - .5) * strength);
          if (spark.leaf) ctx.rotate((u - .5) * 1.5);
          ctx.drawImage(spark.tile, -spark.size / 2, -spark.size * .3, spark.size, spark.size * .6);
          ctx.restore();
        }
        ctx.restore();
        if (effect.fixedInk) {
          ctx.globalAlpha = 1;
          ctx.drawImage(effect.fixedInk.canvas,effect.fixedInk.x,effect.fixedInk.y);
        }
        // Fixed source-metal pixels brighten briefly; armour and weapon never move.
        ctx.globalCompositeOperation = 'screen';
        for (const spark of effect.sparks) {
          if (spark.leaf) continue;
          const u = fract(cycle + spark.offset);
          ctx.globalAlpha = envelope * Math.sin(Math.PI * u) ** 20 * .58;
          ctx.drawImage(spark.tile, spark.x - spark.size / 2, spark.y - spark.size / 2, spark.size, spark.size);
        }
      } finally { ctx.restore(); }
    },
  };
  if (id !== 'rally') return renderer;

  // Fade the whole large banner once; separate plate/cloth fades expose the plate's fill.
  const frame = surface(), frameCtx = frame.getContext('2d');
  const sample = { time: 0, mode: 'idle', reduced: false };
  return {
    draw(ctx, { time = 0, mode = 'idle', reduced = false } = {}) {
      const seconds = Number.isFinite(time) ? time : 0, wake = mode === 'awaken';
      const t = wake ? Math.max(0, Math.min(3.2, seconds)) : ((seconds % 8) + 8) % 8;
      ctx.save();
      try {
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        ctx.drawImage(source, 0, 0);
        if (reduced || (wake && (t === 0 || t === 3.2))) return;
        sample.time = wake ? t / 3.2 * 8 : t;
        frameCtx.clearRect(0, 0, WIDTH, HEIGHT);
        renderer.draw(frameCtx, sample);
        ctx.globalAlpha = wake ? smooth(t / .35) * smooth((3.2 - t) / .8) : 1;
        ctx.drawImage(frame, 0, 0);
      } finally { ctx.restore(); }
    },
  };
}
