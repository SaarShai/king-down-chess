/** Random pauses, with one shared limit for selected and resting board figures. */
export function idleSchedule(random = Math.random) {
 const clocks = new Map();
 const pause = () => 4000 + random() * 12000;
 return {
  update(time, pieces, duration, enabled = true) {
   if (!enabled) { clocks.clear(); return new Map(); }
   for (const [key, clock] of clocks) if (!pieces.has(key) || pieces.get(key) !== clock.value) clocks.delete(key);
   for (const [key, value] of pieces) if (!clocks.has(key)) clocks.set(key, { value, next: time + pause(), start: null, end: 0 });
   let active = 0;
   for (const clock of clocks.values()) {
    if (clock.start !== null && time >= clock.end) { clock.start = null; clock.next = time + pause(); }
    if (clock.start !== null) active++;
   }
   for (const [key, clock] of clocks) if (clock.start === null && time >= clock.next && active < 3) {
    const ms = duration(key); if (!ms) { clock.next = time + pause(); continue; }
    clock.start = time; clock.end = time + ms; active++;
   }
   return new Map([...clocks].filter(([, clock]) => clock.start !== null).map(([key, clock]) => [key, time - clock.start]));
  },
 };
}
