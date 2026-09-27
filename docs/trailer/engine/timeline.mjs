// The trailer script as data. Change order, timing or parameters here; shot code stays untouched.
// start/dur in seconds; fadeIn/fadeOut are crossfade lengths; params go to the shot module unchanged.
export const FPS = 30;
export const shots = [
  { id: 'wake', module: 'wake', start: 0, dur: 9, params: {} },
  { id: 'archer', module: 'intro', start: 9, dur: 5, params: { piece: 'archer', name: 'ARCHER', tint: 'ember', reveal: 'arrow', whipOut: 'left' } },
  { id: 'beast', module: 'intro', start: 14, dur: 5, params: { piece: 'beast', name: 'BEAST', tint: 'blood', reveal: 'bite', whipIn: 'left', whipOut: 'right' } },
  { id: 'maester', module: 'intro', start: 19, dur: 5, params: { piece: 'maester', name: 'MAESTER', tint: 'teal', reveal: 'scan', whipIn: 'right', whipOut: 'left' } },
  { id: 'ogre', module: 'intro', start: 24, dur: 5, params: { piece: 'ogre', name: 'OGRE', tint: 'ochre', reveal: 'shove', whipIn: 'left', whipOut: 'right' } },
  { id: 'guard', module: 'intro', start: 29, dur: 5, params: { piece: 'guard', name: 'GUARD', tint: 'steel', reveal: 'stand', whipIn: 'right', whipOut: 'left' } },
  { id: 'montage', module: 'montage', start: 34, dur: 8, params: {} },
  { id: 'kings', module: 'kings', start: 42, dur: 10, fadeIn: 0.4, params: {} },
  { id: 'title', module: 'title', start: 52, dur: 7, fadeIn: 0.3, params: { cta: 'Play free' } },
];
export const DURATION = Math.max(...shots.map(s => s.start + s.dur));
