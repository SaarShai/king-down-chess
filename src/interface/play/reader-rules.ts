// Stage "readingb" (launch decision 33): the pure rules of the B reading area, apart from the DOM so that a unit test can read them.
import type { Form } from './layout';

/** The sentences of a text, split after a full stop that a capital letter follows (the copy table's sentences). */
export function sentences(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+(?=[A-Z])/).map(line => line.trim()).filter(Boolean);
}
/** End turn is brass after a move and quiet after a free action alone (option d2); its enabled state does not change. */
export const finishKind = (freeOnly: boolean): 'main' | 'quiet' => freeOnly ? 'quiet' : 'main';
/** The label of the one summary control (option a1): one source shows its own summary; several show a count of sources. */
export function summaryLabel(summaries: readonly string[], form: Form, label = 'Active effects'): string {
  if (!summaries.length) return '';
  return summaries.length === 1 && form !== 'compact' ? summaries[0] : `${label} · ${summaries.length}`;
}
