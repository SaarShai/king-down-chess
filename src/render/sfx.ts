/** Short board tones. Web Audio only — no sound files. */
let ctx: AudioContext | null = null;
let enabled = true;

export function setSound(on: boolean): void { enabled = on; }

export function playTone(freq: number, dur: number, type: OscillatorType = 'square'): void {
  if (!enabled) return;
  const c = ctx ??= new AudioContext();
  void c.resume().catch(() => {}); // A browser may keep audio locked until the next gesture.
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.05, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g);
  g.connect(c.destination);
  o.onended = () => { o.disconnect(); g.disconnect(); };
  o.start();
  o.stop(c.currentTime + dur);
}

export const snd = {
  move: () => playTone(520, 0.05),
  capture: () => playTone(160, 0.12, 'sawtooth'),
  check: () => playTone(880, 0.09),
  shove: () => playTone(240, 0.08, 'triangle'),
  shot: () => playTone(740, 0.07),
  chain: () => playTone(300, 0.14, 'sawtooth'),
  swap: () => playTone(420, 0.1, 'triangle'),
};
