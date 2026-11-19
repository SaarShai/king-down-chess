const key = 'daylight.hints';
let seenThisVisit = false;

export const hintLines = {
  piece: 'Tap a piece of yours.',
  ring: 'Rings show its moves. Tap a ring.',
  end: 'End turn gives the move to Computer.',
  card: 'Tap a card to read it.',
  info: 'Tap i for the full rule.',
} as const;

export type Hint = keyof typeof hintLines;

export function startHints(first: boolean) {
  let enabled = first && !seenThisVisit;
  if (enabled) {
    try { enabled = localStorage.getItem(key) !== '1'; } catch { /* Use the flag for this visit. */ }
  }
  const shown = new Set<Hint>();
  return {
    /** Call only when the hint has room to show. */
    take(hint: Hint): string | null {
      if (!enabled || shown.has(hint)) return null;
      shown.add(hint);
      seenThisVisit = true;
      try { localStorage.setItem(key, '1'); } catch { /* Use the flag for this visit. */ }
      return hintLines[hint];
    },
  };
}

/** False means the reset lasts for this visit only. */
export function resetHints(): boolean {
  seenThisVisit = false;
  try { localStorage.removeItem(key); return true; } catch { return false; }
}
