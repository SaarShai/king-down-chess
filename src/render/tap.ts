type Press = Pick<PointerEvent, 'clientX' | 'clientY' | 'pointerType'>;

/** True when a press moved too far for a tap, so it is a drag: past 6 px for a mouse, past 12 px for a finger or a pen. */
export const pastTap = (down: Press, e: Press): boolean =>
  Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) > (down.pointerType === 'mouse' ? 6 : 12);
