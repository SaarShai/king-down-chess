/**
 * Shared TypeSafe/Jev client for the balancing tools (tools/jev-*.ts).
 *
 * The recipe that passed control validation (LESSONS.md 2026-09-16): raw evidence in `state`, one
 * judgment per question, and known-answer controls in the same call. The key is read from
 * `TYPESAFE_API_KEY` or `~/.config/typesafe/key` and never logged.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface Answer {
  type: 'noul' | 'choice' | 'score';
  noul?: number;
  choice?: string;
  probabilities?: Record<string, number>;
  score?: number;
  confidence?: number;
}

const apiKey = (): string => {
  let fromFile = '';
  try { fromFile = readFileSync(join(homedir(), '.config/typesafe/key'), 'utf8').trim(); } catch { /* env wins, file optional */ }
  const k = process.env.TYPESAFE_API_KEY || fromFile;
  if (!k) throw new Error('jev: no API key (TYPESAFE_API_KEY or ~/.config/typesafe/key)');
  return k;
};

/** One System One call. Retries 429/529 with backoff, as the SDKs do. */
export async function ask(state: unknown, questions: Record<string, unknown>, tries = 4): Promise<Record<string, Answer>> {
  for (let i = 0; ; i++) {
    const res = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, model: 'jev-latest', questions }),
    });
    if (res.ok) return ((await res.json()) as { answers: Record<string, Answer> }).answers;
    if ((res.status === 429 || res.status === 529) && i < tries - 1) {
      await new Promise(r => setTimeout(r, 1000 * 2 ** i));
      continue;
    }
    throw new Error(`jev: HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
  }
}

export const noul = (a: Answer): number => a.noul ?? NaN;
export const choice = (a: Answer): string => a.choice ?? '';
export const score = (a: Answer): number => a.score ?? NaN;
export const prob = (a: Answer, label: string): number => a.probabilities?.[label] ?? 0;
export const conf = (a: Answer): number => a.confidence ?? 0;

/**
 * Gate on controls placed in the same call. `pick` is the expected Choice label (probability ≥
 * `minP`), `high`/`low` are expected Noul bands. Returns null when valid, or a description.
 */
export function controlCheck(answers: Record<string, Answer>, spec: {
  choice?: { key: string; expect: string; minP?: number };
  high?: { key: string; min?: number };
  low?: { key: string; max?: number };
}): string | null {
  if (spec.choice) {
    const a = answers[spec.choice.key];
    const p = a ? prob(a, spec.choice.expect) : 0;
    if (!(p >= (spec.choice.minP ?? 0.5))) return `${spec.choice.key}: expected "${spec.choice.expect}" (p=${p.toFixed(2)})`;
  }
  if (spec.high) {
    const a = answers[spec.high.key];
    const v = a ? noul(a) : NaN;
    if (!(v >= (spec.high.min ?? 0.7))) return `${spec.high.key}: expected high (${v.toFixed(2)})`;
  }
  if (spec.low) {
    const a = answers[spec.low.key];
    const v = a ? noul(a) : NaN;
    if (!(v <= (spec.low.max ?? 0.3))) return `${spec.low.key}: expected low (${v.toFixed(2)})`;
  }
  return null;
}
