const WIDTH = 512, HEIGHT = 288, TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const fract = value => value - Math.floor(value);
const seed = value => fract(Math.sin(value * 127.1 + 311.7) * 43758.5453);

export const ids = ['firewall', 'earthquake', 'burn', 'firestarter', 'control', 'morphp', 'sacrifice', 'back'];

function surface(width = WIDTH, height = HEIGHT) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  return canvas;
}

// These areas protect the painted stone and figures, including each frozen impact.
const profiles = {
  firewall: {
    material: 'fire',
    protect: [
      [22,70,94,214], [100,70,145,204], [144,87,212,195],
      [8,127,35,181], [89,113,114,186], [130,140,182,228],
      [199,135,230,189], [217,147,260,207], [333,96,512,137],
    ],
    fields: [
      [0,0,146,141,3.7,2.3,.74], [98,17,106,138,4.7,3,.73],
      [178,47,114,147,4.7,3.1,.79], [250,88,102,134,4.3,3,.82],
      [319,120,100,130,5.4,3.8,.86], [395,127,117,154,6.4,4.2,.88],
    ],
    particles: { count:72, rise:30, drift:11, opacity:.83, size:1.9 },
  },
  earthquake: {
    material: 'dust',
    protect: [
      [[42,47],[53,35],[97,36],[121,54],[132,91],[156,135],[156,151],
        [141,165],[105,174],[73,154],[70,126],[59,105],[47,99]],
      [[428,87],[450,91],[463,108],[454,124],[452,134],[438,146],
        [442,158],[432,174],[414,178],[385,161],[381,152],[394,133],[416,109]],
      [[196,162],[249,149],[315,166],[316,184],[304,202],[263,212],[223,198],[198,185]],
    ],
    fields: [
      [0,65,92,105,8,5,.65], [131,90,95,103,8.6,6,.7],
      [210,78,103,109,9,6,.68], [298,111,107,83,10,5,.7],
      [391,127,105,65,4.6,2.8,.43], [130,178,221,44,4.1,1.6,.34],
    ],
    particles: { count:48, rise:18, drift:14, opacity:.48, size:1.7 },
    glints: [105,179,318,62],
    chips: [[203,106,5],[238,133,5],[305,148,5],[346,145,4],[370,123,5]],
  },
  burn: {
    material: 'fire',
    protect: [
      [[217,34],[243,31],[255,40],[269,44],[276,42],[290,58],[281,77],
        [267,83],[250,145],[265,159],[262,176],[268,190],[256,208],
        [234,203],[188,182],[165,174],[169,156],[180,149],[191,116],[210,70],[216,63]],
      [[339,78],[357,80],[363,86],[386,88],[405,98],[411,123],[416,136],
        [410,148],[400,155],[398,169],[389,183],[391,197],[379,219],
        [344,223],[318,216],[305,205],[314,180],[324,169],[327,145],[349,130],
        [353,111],[344,107],[338,100],[338,93],[333,90]],
    ],
    fields: [
      [0,123,131,56,5.5,1.5,.74], [83,137,141,68,5.5,2,.82],
      [197,176,97,45,4.1,2,.88], [267,111,91,103,3.7,3,.78],
      [314,115,101,99,4.6,3.6,.75],
      [0,65,41,38,1.1,1.8,.7], [478,64,33,35,1.1,1.7,.7],
    ],
    particles: { count:58, rise:23, drift:-12, opacity:.78, size:1.6 },
  },
  firestarter: {
    material: 'fire',
    protect: [
      [[202,44],[222,43],[229,46],[241,45],[251,59],[250,82],[257,98],
        [250,104],[242,94],[240,113],[244,130],[243,149],[232,164],
        [223,178],[216,195],[202,205],[166,204],[137,196],[130,186],
        [132,170],[142,164],[143,148],[153,133],[174,121],[180,111],[176,95],[185,62]],
      [[306,47],[319,48],[329,53],[336,51],[349,61],[345,77],[337,83],
        [334,109],[340,116],[336,129],[341,138],[337,146],[315,143],
        [291,132],[277,124],[281,114],[285,109],[295,78],[299,64]],
    ],
    fields: [
      [0,193,134,95,5.8,2.1,.89], [89,166,134,101,5.4,2.1,.88],
      [198,130,96,79,4.8,2.3,.86], [252,72,105,75,3.7,3.3,.88],
      [252,47,18,15,.8,1.2,.67], [366,44,18,18,.8,1.3,.67],
    ],
    particles: { count:57, rise:22, drift:-9, opacity:.82, size:1.5 },
  },
  control: {
    material: 'teal',
    protect: [
      [68,23,145,225],
      [[245,42],[283,44],[300,56],[305,81],[305,103],[300,126],
        [292,134],[277,124],[267,106],[257,88],[246,81]],
      [[181,176],[280,176],[289,210],[291,230],[180,230]],
    ],
    fields: [
      [121,30,82,59,7.6,4,.88], [161,53,71,62,7.2,4.4,.92],
      [192,86,87,77,6.4,5.2,.84], [182,120,74,49,6,4,.78],
    ],
    particles: { count:25, rise:24, drift:28, opacity:.68, size:2.4 },
  },
  morphp: {
    material: 'lilac',
    protect: [
      [[222,41],[242,27],[257,27],[260,39],[271,31],[280,40],[285,56],
        [287,68],[299,90],[305,102],[301,114],[292,119],[278,111],[268,99],
        [263,109],[271,125],[277,149],[266,161],[247,157],[237,140],
        [224,114],[211,97],[209,78],[213,60]],
      [[205,120],[219,126],[228,144],[234,169],[245,183],[279,187],[289,197],
        [296,216],[305,231],[305,250],[187,251],[187,230],[192,212],[200,194]],
      [[185,59],[193,42],[211,25],[231,19],[245,21],[241,33],[225,43],[205,55]],
    ],
    fields: [
      [169,50,73,65,7.2,5,.92], [188,98,76,72,8,5.6,.94],
      [242,102,80,85,8,6,.94], [179,21,89,54,6.4,4.8,.84],
    ],
    particles: { count:32, rise:32, drift:22, opacity:.9, size:4.2 },
    chips: [[161,100,5],[177,94,5],[177,160,5],[316,195,5],[307,85,4],[322,111,5],[195,178,3]],
  },
};

function inside(points, x, y) {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
  }
  return result;
}

function colour(kind, r, g, b) {
  if (kind === 'fire') return smooth((r - 122) / 65) * smooth((r - g - 12) / 30) * smooth((g - b - 17) / 32);
  if (kind === 'dust') return smooth((r - 143) / 55) * smooth((r - g - 24) / 35) * smooth((g - b - 24) / 39);
  if (kind === 'teal') return smooth((g - r - 8) / 35) * smooth((b - r - 3) / 35) * smooth((g - 105) / 70);
  if (kind === 'lilac') return smooth((b - g + 24) / 38) * smooth((b - r + 100) / 60) * smooth((r - 100) / 70);
  return smooth((r - 178) / 58) * smooth((g - 133) / 58) * smooth((r - b - 9) / 30);
}

export function createEffect(id, image) {
  if (id === 'sacrifice' || id === 'back') return createStillMaterialEffect(id, image);
  const profile = profiles[id];
  if (!profile) throw new Error(`Unknown painted material effect: ${id}`);
  const source = surface(), sourceCtx = source.getContext('2d', { willReadFrequently:true });
  sourceCtx.drawImage(image, 0, 0, WIDTH, HEIGHT);
  const pixels = sourceCtx.getImageData(0, 0, WIDTH, HEIGHT).data;
  const safe = new Uint8Array(WIDTH * HEIGHT);
  const safety = surface(), safetyCtx = safety.getContext('2d');
  const safetyData = safetyCtx.createImageData(WIDTH, HEIGHT);
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    let protectedPixel = false;
    for (const area of profile.protect) {
      if (typeof area[0] === 'number'
        ? x >= area[0] && x <= area[2] && y >= area[1] && y <= area[3]
        : inside(area, x, y)) { protectedPixel = true; break; }
    }
    if (!protectedPixel) {
      safe[y * WIDTH + x] = 1;
      safetyData.data[(y * WIDTH + x) * 4 + 3] = 255;
    }
  }
  safetyCtx.putImageData(safetyData, 0, 0);

  // Only source RGB enters these layers. Soft colour masks retain the brush edges.
  function cutout(left, top, width, height, kind, feather = 7, glint = false) {
    const canvas = surface(width, height), context = canvas.getContext('2d');
    const data = context.createImageData(width, height);
    let visible = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const sx = left + x, sy = top + y;
      if (sx < 1 || sx >= WIDTH - 1 || sy < 1 || sy >= HEIGHT - 1 || !safe[sy * WIDTH + sx]) continue;
      const p = (sy * WIDTH + sx) * 4, q = (y * width + x) * 4;
      const r = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
      let alpha = colour(kind, r, g, b) * smooth(Math.min(x, y, width - 1 - x, height - 1 - y) / feather);
      if (glint) {
        const edge = Math.max(Math.abs(r - pixels[p - 4]), Math.abs(r - pixels[p - WIDTH * 4]));
        alpha *= smooth((edge - 13) / 35);
      }
      data.data[q] = r; data.data[q + 1] = g; data.data[q + 2] = b;
      data.data[q + 3] = Math.round(alpha * 255);
      visible += alpha;
    }
    context.putImageData(data, 0, 0);
    return { canvas, left, top, width, height, visible };
  }

  const fields = profile.fields.map((area, index) => ({
    ...cutout(area[0], area[1], area[2], area[3], profile.material),
    dx:area[4], dy:area[5], opacity:area[6], phase:index * 1.73,
  }));
  let materialPlate;
  if (id === 'morphp') {
    materialPlate = surface();
    const plateCtx = materialPlate.getContext('2d'), plate = plateCtx.createImageData(WIDTH, HEIGHT);
    for (const field of fields) {
      const mask = field.canvas.getContext('2d').getImageData(0,0,field.width,field.height).data;
      for (let y = 0; y < field.height; y++) for (let x = 0; x < field.width; x++) {
        const alpha = mask[(y * field.width + x) * 4 + 3];
        if (!alpha) continue;
        const sx = field.left+x, sy = field.top+y, at = (sy*WIDTH+sx)*4;
        const colourSum = [0,0,0];
        let weight = 0;
        for (let radius = 2; radius <= 18; radius += 2) {
          for (const [dx,dy] of [[-radius,0],[radius,0],[0,-radius],[0,radius]]) {
            const xx=sx+dx, yy=sy+dy, q=(yy*WIDTH+xx)*4;
            if (xx<0 || xx>=WIDTH || yy<0 || yy>=HEIGHT || !safe[yy*WIDTH+xx]) continue;
            if (colour('lilac',pixels[q],pixels[q+1],pixels[q+2]) >= .08) continue;
            const sampleWeight = 1 / (radius * radius);
            for (let c=0;c<3;c++) colourSum[c]+=pixels[q+c]*sampleWeight;
            weight+=sampleWeight;
          }
        }
        if (!weight) continue;
        for (let c=0;c<3;c++) plate.data[at+c]=colourSum[c]/weight;
        plate.data[at+3]=Math.max(plate.data[at+3],alpha);
      }
    }
    plateCtx.putImageData(plate,0,0);
  }
  const glints = profile.glints ? cutout(...profile.glints, 'gold', 8, true) : null;

  const candidates = [];
  for (const field of fields) {
    for (let y = field.top + 5; y < field.top + field.height - 5; y += 3) {
      for (let x = field.left + 5; x < field.left + field.width - 5; x += 3) {
        const p = (y * WIDTH + x) * 4;
        if (safe[y * WIDTH + x] && colour(profile.material, pixels[p], pixels[p + 1], pixels[p + 2]) > .65) candidates.push({ x,y });
      }
    }
  }
  const tiles = [];
  if (candidates.length) for (let i = 0; i < 8; i++) {
    const from = candidates[Math.floor(seed(i + 431) * candidates.length)];
    tiles.push(cutout(from.x - 3, from.y - 3, 7, 7, profile.material, 2));
  }
  const particle = profile.particles;
  const particles = candidates.length ? Array.from({ length:particle.count }, (_, i) => {
    const from = candidates[Math.floor(seed(i + 41) * candidates.length)];
    return {
      x:from.x, y:from.y, phase:seed(i + 1001), laps:1 + i % 3,
      drift:particle.drift * (.45 + seed(i + 501)), rise:particle.rise * (.55 + seed(i + 601)),
      size:particle.size * (.65 + seed(i + 701)), alpha:.35 + seed(i + 801) * .65,
      tile:tiles[i % tiles.length].canvas,
    };
  }) : [];
  const chips = (profile.chips || []).map((chip, index) => ({
    ...cutout(chip[0] - chip[2], chip[1] - chip[2], chip[2] * 2 + 1, chip[2] * 2 + 1,
      id === 'morphp' ? 'gold' : 'dust', 1.5), phase:index * 1.87,
  }));
  const paint = surface(), paintCtx = paint.getContext('2d');

  return {
    draw(ctx, { time = 0, mode = 'idle', reduced = false } = {}) {
      const seconds = Number.isFinite(time) ? time : 0;
      const wake = mode === 'awaken';
      const t = wake ? Math.max(0, Math.min(3.2, seconds)) : ((seconds % 8) + 8) % 8;
      const envelope = wake ? smooth(t / .4) * smooth((3.2 - t) / .85) : 1;
      ctx.save();
      try {
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none'; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.drawImage(source, 0, 0);
        if (reduced || envelope === 0) return;
        if (materialPlate) { ctx.globalAlpha = envelope; ctx.drawImage(materialPlate,0,0); ctx.globalAlpha = 1; }
        const phase = TAU * t / 8;
        const strength = envelope * (wake ? 1.25 : 1);
        paintCtx.clearRect(0, 0, WIDTH, HEIGHT);
        paintCtx.globalCompositeOperation = 'source-over';
        paintCtx.filter = 'none';
        for (const field of fields) {
          const pulse = .86 + .14 * Math.sin(phase * 3 + field.phase);
          paintCtx.globalAlpha = clamp(field.opacity * strength * pulse);
          // Short, continuous source-texture advection bends only the painted material.
          const strip = id === 'morphp' ? 1 : 6;
          for (let row = 0; row < field.height; row += strip) {
            const height = strip === 1 ? 1 : Math.min(7, field.height - row);
            const bend = Math.sin(phase * 3 + row * .035 + field.phase)
              + .28 * Math.sin(phase * 5 - row * .07 + field.phase);
            const dx = field.dx * bend * strength;
            const dy = field.dy * Math.sin(phase * 2 + row * .018 + field.phase) * strength;
            if (strip === 1) {
              const sampleY = row - field.dy * Math.sin(phase * 2 + field.phase) * strength;
              if (sampleY < 0 || sampleY + 1 > field.height) continue;
              paintCtx.drawImage(field.canvas, 0, sampleY, field.width, 1,
                field.left + dx, field.top + row, field.width, 1);
            } else {
              paintCtx.drawImage(field.canvas, 0, row, field.width, height,
                field.left + dx, field.top + row + dy, field.width, height);
            }
          }
        }
        if (profile.material === 'teal' || profile.material === 'lilac') {
          paintCtx.globalCompositeOperation = profile.material === 'lilac' ? 'lighter' : 'screen';
          for (const field of fields) for (let column = 0; column < field.width; column += 8) {
            const width = Math.min(8, field.width - column);
            const travel = phase * 4 - field.phase - column / field.width * Math.PI;
            paintCtx.globalAlpha = clamp(strength * .78 * Math.max(0, Math.cos(travel)) ** 4);
            paintCtx.drawImage(field.canvas, column, 0, width, field.height,
              field.left + column, field.top, width, field.height);
          }
          paintCtx.globalCompositeOperation = 'source-over';
        }
        if (glints) {
          paintCtx.globalCompositeOperation = 'screen';
          paintCtx.globalAlpha = envelope * (.12 + .22 * ((1 + Math.sin(phase * 3)) / 2) ** 5);
          paintCtx.drawImage(glints.canvas, glints.left, glints.top);
          paintCtx.globalCompositeOperation = 'source-over';
        }
        for (const mote of particles) {
          const u = fract(t / 8 * mote.laps + mote.phase);
          const life = Math.sin(Math.PI * u) ** 2;
          const x = mote.x + mote.drift * u + 2 * Math.sin(TAU * u + mote.phase);
          const y = mote.y - mote.rise * u;
          paintCtx.globalAlpha = clamp(life * envelope * mote.alpha * particle.opacity);
          paintCtx.drawImage(mote.tile, x, y, mote.size * 1.2, mote.size * 1.8);
        }
        for (const chip of chips) {
          paintCtx.globalAlpha = envelope * (id === 'morphp' ? .68 : .3);
          const drift = Math.sin(phase + chip.phase);
          paintCtx.drawImage(chip.canvas, chip.left + drift * (id === 'morphp' ? 2.3 : 1.1),
            chip.top - Math.cos(phase + chip.phase) * (id === 'morphp' ? 2.5 : .8));
        }
        paintCtx.globalAlpha = 1;
        paintCtx.globalCompositeOperation = 'destination-in';
        paintCtx.drawImage(safety, 0, 0);
        paintCtx.globalCompositeOperation = 'source-over';
        ctx.beginPath(); ctx.rect(0, 0, WIDTH, HEIGHT); ctx.clip();
        ctx.globalAlpha = 1;
        ctx.drawImage(paint, 0, 0);
      } finally {
        ctx.restore();
      }
    },
  };
}

// These two paintings need light on fixed paint, rather than displaced material.
function createStillMaterialEffect(id, image) {
  const back = id === 'back';
  const source = surface(), sourceCtx = source.getContext('2d', { willReadFrequently:true });
  sourceCtx.drawImage(image, 0, 0, WIDTH, HEIGHT);
  const pixels = sourceCtx.getImageData(0, 0, WIDTH, HEIGHT).data;
  const light = surface(), lightCtx = light.getContext('2d');
  const data = lightCtx.createImageData(WIDTH, HEIGHT);
  const safety = surface(), safeCtx = safety.getContext('2d');
  safeCtx.fillStyle = 'white'; safeCtx.fillRect(0, 0, WIDTH, HEIGHT);
  const rook = [[240,104,46,27],[244,127,39,51],[225,175,69,28],[219,200,99,37]];
  if (!back) {
    safeCtx.globalCompositeOperation = 'destination-out';
    for (const rect of rook) safeCtx.fillRect(...rect);
  }
  const cracks = [
    [[283,35,4],[279,48,4],[276,61,4],[271,72,4],[278,83,5],[284,92,6],
      [291,104,7],[291,121,7],[292,138,7],[296,156,7],[300,174,7],[307,191,6],[316,205,5]],
    [[237,88,5],[232,104,6],[235,122,5],[232,140,5],[230,159,5],[229,177,6],[219,194,6],[216,211,5]],
  ];
  function crackWeight(x, y) {
    let weight = 0;
    for (const route of cracks) for (let i = 1; i < route.length; i++) {
      const a = route[i - 1], b = route[i], dx = b[0] - a[0], dy = b[1] - a[1];
      const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy));
      const width = (a[2] + (b[2] - a[2]) * t) * 2.2;
      weight = Math.max(weight, smooth(1 - Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t) / width));
    }
    return weight;
  }
  const candidates = [];
  for (let y = 1; y < HEIGHT - 1; y++) for (let x = 1; x < WIDTH - 1; x++) {
    const p = (y * WIDTH + x) * 4, r = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
    const edge = Math.max(Math.abs(r - pixels[p - 4]), Math.abs(g - pixels[p - WIDTH * 4 + 1]));
    let alpha;
    if (back) {
      alpha = smooth((r - 110) / 75) * smooth((r - g - 5) / 25) * smooth((g - b - 25) / 45);
      alpha *= .45 + .55 * smooth(edge / 35);
    } else {
      let protectedPixel = false;
      for (const rect of rook) if (x >= rect[0] && x < rect[0] + rect[2] && y >= rect[1] && y < rect[1] + rect[3]) protectedPixel = true;
      if (protectedPixel) continue;
      alpha = crackWeight(x, y) * smooth((r - 110) / 100) * smooth((g - 60) / 90) * smooth((r - b - 10) / 40);
      if (alpha > .35 && r > 210 && g > 150 && edge > 6 && x % 2 === 0 && y % 2 === 0) candidates.push({ x,y });
    }
    data.data[p] = r; data.data[p + 1] = g; data.data[p + 2] = b;
    data.data[p + 3] = Math.round(alpha * 255);
  }
  lightCtx.putImageData(data, 0, 0);
  const glints = back ? [[256,24,5],[101,80,5],[408,80,5],[213,118,5],[298,118,5],[255,155,6],[128,142,5],[384,142,5]].map(point => {
    const size = point[2] * 2 + 1, canvas = surface(size,size), context = canvas.getContext('2d');
    const tile = context.createImageData(size,size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const p = ((point[1] + y - point[2]) * WIDTH + point[0] + x - point[2]) * 4, q = (y * size + x) * 4;
      tile.data[q] = pixels[p]; tile.data[q + 1] = pixels[p + 1]; tile.data[q + 2] = pixels[p + 2];
      tile.data[q + 3] = Math.round(data.data[p + 3] * smooth((pixels[p + 1] - 165) / 65)
        * smooth(Math.min(x,y,size - 1 - x,size - 1 - y) / 3));
    }
    context.putImageData(tile,0,0);
    return { canvas, x:point[0] - point[2], y:point[1] - point[2] };
  }) : [];
  const tiles = candidates.slice(0,8).map((_, index) => {
    const from = candidates[Math.floor(seed(index + 321) * candidates.length)];
    const canvas = surface(7,7), context = canvas.getContext('2d'), tile = context.createImageData(7,7);
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const p = ((from.y + y - 3) * WIDTH + from.x + x - 3) * 4, q = (y * 7 + x) * 4;
      tile.data[q] = pixels[p]; tile.data[q + 1] = pixels[p + 1]; tile.data[q + 2] = pixels[p + 2];
      tile.data[q + 3] = Math.round(255 * smooth((pixels[p] - 200) / 48) * smooth((pixels[p + 1] - 145) / 60)
        * smooth(Math.min(x,y,6 - x,6 - y) / 2));
    }
    context.putImageData(tile,0,0);
    return canvas;
  });
  const dust = candidates.length ? Array.from({ length:24 }, (_, i) => {
    const from = candidates[Math.floor(seed(i + 522) * candidates.length)];
    return { x:from.x, y:from.y, phase:seed(i + 700), laps:1 + i % 2,
      drift:(seed(i + 800) - .5) * 16, fall:22 + seed(i + 900) * 14,
      size:5 + seed(i + 1000) * 2.5, tile:tiles[i % tiles.length] };
  }) : [];
  const paint = surface(), paintCtx = paint.getContext('2d');
  return {
    draw(ctx, { time = 0, mode = 'idle', reduced = false } = {}) {
      const seconds = Number.isFinite(time) ? time : 0, wake = mode === 'awaken';
      const t = wake ? Math.max(0,Math.min(3.2,seconds)) : ((seconds % 8) + 8) % 8;
      const envelope = wake ? smooth(t / .4) * smooth((3.2 - t) / .85) : 1;
      ctx.save();
      try {
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none'; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.drawImage(source,0,0);
        if (reduced || envelope === 0) return;
        const phase = TAU * t / 8, strength = envelope * (wake ? 1.2 : 1);
        paintCtx.clearRect(0,0,WIDTH,HEIGHT);
        paintCtx.globalCompositeOperation = 'screen';
        if (back) {
          // The sheen stays inside the original gold paint; the crown never moves.
          for (let column = 0; column < WIDTH; column += 4) {
            const sweepPhase = wake ? TAU * t / 2.4 : phase * 2;
            const sweep = Math.max(0,Math.cos(sweepPhase + Math.PI * .65 - column / WIDTH * TAU)) ** 18;
            paintCtx.globalAlpha = strength * .55 * sweep;
            paintCtx.drawImage(light,column,0,4,HEIGHT,column,0,4,HEIGHT);
          }
          for (let i = 0; i < glints.length; i++) {
            const glint = glints[i];
            paintCtx.globalAlpha = strength * .3 * Math.max(0,Math.cos(phase * 2 - i * 1.21)) ** 18;
            paintCtx.drawImage(glint.canvas,glint.x,glint.y);
          }
        } else {
          paintCtx.globalCompositeOperation = 'lighter';
          for (let row = 16; row < 232; row += 4) {
            const shimmer = .04 + .86 * Math.max(0,Math.cos(phase * 4 - (row - 35) * .032)) ** 4;
            paintCtx.globalAlpha = clamp(strength * shimmer);
            paintCtx.drawImage(light,0,row,WIDTH,4,0,row,WIDTH,4);
          }
          paintCtx.globalCompositeOperation = 'source-over';
          for (const mote of dust) {
            const u = fract(t / 8 * mote.laps + mote.phase);
            paintCtx.globalAlpha = envelope * .95 * Math.sin(Math.PI * u) ** 2;
            paintCtx.drawImage(mote.tile,mote.x + mote.drift * u,mote.y + mote.fall * u,mote.size,mote.size * 1.4);
          }
          paintCtx.globalAlpha = 1; paintCtx.globalCompositeOperation = 'destination-in';
          paintCtx.drawImage(safety,0,0);
        }
        ctx.beginPath(); ctx.rect(0,0,WIDTH,HEIGHT); ctx.clip();
        ctx.globalCompositeOperation = back ? 'screen' : 'lighter';
        ctx.drawImage(paint,0,0);
      } finally {
        ctx.restore();
      }
    },
  };
}
