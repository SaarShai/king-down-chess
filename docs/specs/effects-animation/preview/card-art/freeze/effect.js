const SIZE = 512;
const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const fract = value => value - Math.floor(value);

export function createEffect(image) {
  const makeCanvas = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };
  const source = makeCanvas(SIZE, SIZE);
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0, SIZE, SIZE);
  const pixels = sourceContext.getImageData(0, 0, SIZE, SIZE).data;
  const light = index => pixels[index] * .22 + pixels[index + 1] * .61 + pixels[index + 2] * .17;
  const bands = Array.from({ length: 12 }, () => {
    const canvas = makeCanvas(SIZE, SIZE);
    const context = canvas.getContext('2d');
    return { canvas, context, data: context.createImageData(SIZE, SIZE) };
  });

  // The source pixels carry every fracture. Only their light changes.
  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      const index = (y * SIZE + x) * 4;
      const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
      const value = light(index);
      const edge = Math.max(Math.abs(value - light(index - 4)), Math.abs(value - light(index - SIZE * 4)));
      const cyan = smooth((g - r - 4) / 42) * smooth((b - r - 8) / 48);
      const bright = smooth((value - 128) / 94);
      const facet = Math.max(smooth((edge - 9) / 34), bright * .24);
      const centre = smooth((x - 55) / 45) * smooth((477 - x) / 42);
      const strength = cyan * bright * facet * centre;
      if (strength < .008) continue;
      const travel = clamp((484 - y + (x - 255) * .13) / 500);
      const band = bands[Math.min(11, Math.floor(travel * 12))].data.data;
      band[index] = 155;
      band[index + 1] = 235;
      band[index + 2] = 255;
      band[index + 3] = Math.round(strength * 225);
    }
  }
  for (const band of bands) {
    band.context.putImageData(band.data, 0, 0);
    delete band.data;
    delete band.context;
  }

  const snow = makeCanvas(28, 32);
  const snowContext = snow.getContext('2d');
  const snowData = snowContext.createImageData(28, 32);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 28; x++) {
      const src = ((42 + y) * SIZE + 142 + x) * 4;
      const dst = (y * 28 + x) * 4;
      snowData.data[dst] = pixels[src];
      snowData.data[dst + 1] = pixels[src + 1];
      snowData.data[dst + 2] = pixels[src + 2];
      snowData.data[dst + 3] = Math.round(smooth((light(src) - 168) / 63) * 230);
    }
  }
  snowContext.putImageData(snowData, 0, 0);
  const flakes = Array.from({ length: 66 }, (_, i) => {
    const depth = i < 34 ? 0 : i < 57 ? 1 : 2;
    return {
      depth,
      x: fract(Math.sin((i + 1) * 81.73) * 43758.5453) * 660 - 40,
      y: fract(Math.sin((i + 1) * 39.21) * 15731.743) * 440 - 35,
      phase: fract(i * .61803398875),
      scale: [.16, .34, .72][depth] * (.7 + fract(i * .317) * .6),
    };
  });

  const mist = makeCanvas(256, 96);
  const mistContext = mist.getContext('2d');
  const mistData = mistContext.createImageData(256, 96);
  // Smooth periodic noise makes thin vapour, rather than a solid moving veil.
  for (let y = 0; y < 96; y++) {
    for (let x = 0; x < 256; x++) {
      const u = x / 256 * TAU, v = y / 96;
      const ridge = .46 + .12 * Math.sin(u * 2) + .07 * Math.cos(u * 5);
      const cloud = Math.exp(-Math.pow((v - ridge) / .18, 2));
      const noise = .46 + .21 * Math.sin(u * 3 + v * 11)
        + .16 * Math.cos(u * 7 - v * 19) + .1 * Math.sin(u * 13 + v * 31);
      const alpha = cloud * Math.max(0, noise) * Math.sin(Math.PI * v) * 86;
      const index = (y * 256 + x) * 4;
      mistData.data[index] = 160;
      mistData.data[index + 1] = 222;
      mistData.data[index + 2] = 247;
      mistData.data[index + 3] = Math.round(alpha);
    }
  }
  mistContext.putImageData(mistData, 0, 0);

  function drawSnow(ctx, time, intensity, foreground) {
    for (const flake of flakes) {
      if ((flake.depth === 2) !== foreground) continue;
      const life = fract(time / 8 * (flake.depth + 1) + flake.phase);
      const envelope = smooth(life / .12) * smooth((1 - life) / .12);
      const travel = [150, 245, 400][flake.depth];
      const x = flake.x - travel * life;
      const y = flake.y + travel * .9 * life;
      const alpha = [.33, .48, .46][flake.depth] * envelope * intensity;
      ctx.globalAlpha = alpha;
      ctx.drawImage(snow, x, y, 28 * flake.scale, 32 * flake.scale);
    }
  }

  return {
    draw(ctx, { time, mode, reduced }) {
      ctx.save();
      try {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.rect(0, 0, SIZE, SIZE);
        ctx.clip();
        ctx.drawImage(image, 0, 0, SIZE, SIZE);
        if (reduced) return;
        const awaken = mode === 'awaken';
        const t = awaken ? Math.max(0, time) : ((time % 8) + 8) % 8;
        const envelope = awaken ? smooth(t / .23) * (1 - smooth((t - 1.65) / 1.55)) : 1;
        if (envelope === 0) return;
        const gust = awaken ? envelope * (1 + .9 * Math.sin(Math.PI * clamp(t / 2.5))) : 1;
        drawSnow(ctx, t, gust * .9, false);
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < bands.length; i++) {
          const phase = t / 8 - i / bands.length;
          const idleLight = Math.pow((1 + Math.cos(TAU * phase)) / 2, 9);
          const onset = smooth((t - i * .068) / .25);
          const release = 1 - smooth((t - .85 - i * .068) / .8);
          ctx.globalAlpha = clamp(awaken ? envelope * onset * release * 1.5 : .08 + idleLight * 1.15);
          ctx.drawImage(bands[i].canvas, 0, 0);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = envelope * (awaken ? .65 : .42);
        const drift = 42 * Math.sin(TAU * t / 8);
        const rise = 5 * Math.cos(TAU * t / 8);
        ctx.drawImage(mist, -150 + drift, 365 + rise, 640, 100);
        ctx.globalAlpha = envelope * (awaken ? .38 : .24);
        ctx.drawImage(mist, 330 - drift * .45, 123 - rise, 205, 76);
        drawSnow(ctx, t, gust, true);
      } finally {
        ctx.restore();
      }
    },
  };
}
