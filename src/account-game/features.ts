import type { Options } from '../match/setup';

export const featureNames = [['fairy', 'fairy', 'Fairy pieces'], ['arrangement', 'arrange', 'Arrangement'], ['classic', 'classic', 'Classic chess'], ['cards', 'cards', 'Cards'], ['kingPowers', 'powers', 'King powers']] as const;
export const ruleNames = (options: Options | null | undefined) => featureNames.filter(([field]) => options?.[field]).map(([, , label]) => label).join(', ') || 'Standard pieces';
export const icon = (name: string) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
export function features(options: Options | null | undefined, words = false) {
  const span = document.createElement('span'); span.className = 'feats';
  if (words) { span.textContent = ruleNames(options); return span; }
  for (const [field, name, label] of featureNames) if (options?.[field]) { const mark = document.createElement('span'); mark.title = label; mark.setAttribute('role', 'img'); mark.setAttribute('aria-label', label); mark.innerHTML = icon(name); span.append(mark); }
  return span;
}
