// The privacy policy must say what the code does (approval items D9 a, D12 a, D14 a): each cleanup period of the
// daily job, the Settings control by its exact name, and OpenAI as a recipient. A changed period or label fails here.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const policy = readFileSync('public/privacy.html', 'utf8'), text = policy.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

test('the policy gives each cleanup period of the daily job', () => {
 const job = readFileSync('src/online/jobs.ts', 'utf8').match(/export async function cleanup[\s\S]*?\n}/)![0];
 const periods = [...new Set([...job.matchAll(/interval '(\d+ (?:days|months))'/g)].map(match => match[1]))].sort();
 expect(periods).toEqual(['12 months', '30 days', '7 days']);
 for (const period of periods) expect(text, period).toContain(`${period}`);
});

test('the policy names the online control as Settings shows it, says the default applies, and names OpenAI', () => {
 const label = readFileSync('src/plugin/index.html', 'utf8').match(/<label>(Show when I am online) <input id="show-online"/)![1];
 expect(text).toContain(`only when ${label} is on in the app's Settings`);
 expect(text).toContain('the default applies, and no setting stops it');
 expect(text).toContain('OpenAI receives what the app sends to ChatGPT');
});

test('the policy has no placeholder left from the draft', () => {
 expect(policy).not.toMatch(/<[A-Z][A-Z ,."_-]{3,}>/);
 expect(text).not.toContain('can stay after deletion');
});
