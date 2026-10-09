/** A recorded position stays in Review; null asks to leave. */
export function reviewStep(target: number | null, length: number): { ply: number; viewing: number | null } {
  const ply = Math.max(0, Math.min(length, target ?? length));
  return { ply, viewing: target == null || length === 0 ? null : ply };
}
