#!/usr/bin/env node
/**
 * Claim verification with Jev (TypeSafe), controls gated in code.
 *
 * Recipe that passed validation (LESSONS.md 2026-09-16): put **raw numbers only** in the state, put
 * each claim **in its own question**, and include one known-true and one known-false control in the
 * same call. If the controls do not separate, the run carries no information and the tool exits 2.
 *
 *   node tools/verify-claims.mjs spec.json
 *
 * Spec shape:
 *   {
 *     "report": "docs/research/…md",
 *     "state": { …raw numbers… },
 *     "control_true": "a statement the numbers clearly support",
 *     "control_false": "a statement the numbers clearly contradict",
 *     "claims": { "id": "a sentence from the report's prose" }
 *   }
 *
 * Exit codes: 0 = all claims supported (≥0.7); 1 = one or more claims flagged (<0.7); 2 = controls
 * failed (instrument invalid — fix the state/questions before trusting anything).
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const specPath = process.argv[2];
if (!specPath) {
  console.error('usage: node tools/verify-claims.mjs spec.json');
  process.exit(2);
}
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const key = process.env.TYPESAFE_API_KEY ?? readFileSync(join(homedir(), '.config/typesafe/key'), 'utf8').trim();
if (!key) {
  console.error('verify-claims: no API key (TYPESAFE_API_KEY or ~/.config/typesafe/key)');
  process.exit(2);
}

const question = (statement) => ({
  type: 'noul',
  instructions: `Is this statement consistent with the numbers in the state? Judge only from the numbers. Statement: "${statement}"`,
  criteria: {
    true: 'The numbers support the statement (stated or arithmetically implied)',
    false: 'The numbers contradict the statement',
  },
});

const all = { control_true: spec.control_true, control_false: spec.control_false, ...spec.claims };
const questions = Object.fromEntries(Object.entries(all).map(([k, v]) => [k, question(v)]));

const body = JSON.stringify({ state: spec.state, model: 'jev-latest', questions });
const res = await fetch('https://api.typesafe.ai/v1/systemone', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body,
});
if (!res.ok) {
  console.error(`verify-claims: HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
  process.exit(2);
}
const data = await res.json();
const p = (k) => data.answers[k]?.noul ?? NaN;

const ct = p('control_true'), cf = p('control_false');
console.log(`report: ${spec.report}`);
console.log(`controls: true=${ct.toFixed(2)} false=${cf.toFixed(2)}` + (ct < 0.7 || cf > 0.3 ? '  ** INSTRUMENT INVALID, results below are not evidence **' : '  (valid)'));
if (ct < 0.7 || cf > 0.3) process.exit(2);

let flagged = 0;
for (const id of Object.keys(spec.claims)) {
  const v = p(id);
  const bad = !(v >= 0.7);
  if (bad) flagged++;
  console.log(`${bad ? 'FLAG' : 'ok  '} ${id}: supported=${v.toFixed(2)}`);
}
console.log(flagged ? `verify-claims: ${flagged} claim(s) need a wording fix before they are quoted` : 'verify-claims: all claims supported by the numbers');
process.exit(flagged ? 1 : 0);
