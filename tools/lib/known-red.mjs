// The QA known-red list (checks-and-hooks/09). tools/qa-known-red.json maps a QA case id to the path
// of its open ticket in the specs tracker. Unit test: tools/lib/known-red.test.ts.
//
//   verdict(ok, ticket)   PASS (passed, not listed), FAIL (failed, not listed),
//                         XFAIL (failed, listed: a known fault), XPASS (passed, listed: the list is stale).
//   classify(results, list)
//                         results: [{ id, ok }]. Gives { cases: [{ id, verdict, ticket }], counts, summary, ok }.
//                         ok is false when a case gives FAIL or XPASS.
//   lintList(list, root)  The faults of the list: a ticket path outside docs/specs, a ticket file that does
//                         not exist, a ticket with no Status line, a ticket that is resolved or wontfix.
//                         Ticket lint: tools/qa-known-red.lint.test.ts (in npm test).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const verdicts = ['PASS', 'FAIL', 'XFAIL', 'XPASS'];

/** The verdict of one case; `ticket` is the list entry for the case, or null. */
export const verdict = (ok, ticket) => (ticket ? (ok ? 'XPASS' : 'XFAIL') : ok ? 'PASS' : 'FAIL');

/** True when the verdict fails the run. */
export const failsRun = v => v === 'FAIL' || v === 'XPASS';

export function classify(results, list) {
  const cases = results.map(({ id, ok }) => {
    const ticket = Object.hasOwn(list, id) ? list[id] : null;
    return { id, verdict: verdict(ok, ticket), ticket };
  });
  const counts = Object.fromEntries(verdicts.map(v => [v, cases.filter(c => c.verdict === v).length]));
  const summary = `qa: ${verdicts.map(v => `${counts[v]} ${v}`).join(', ')}`;
  return { cases, counts, summary, ok: !cases.some(c => failsRun(c.verdict)) };
}

/** A ticket status that closes the ticket; a listed case must point to an open ticket. */
const closed = ['resolved', 'wontfix'];

export function lintList(list, root) {
  const faults = [];
  for (const [id, ticket] of Object.entries(list)) {
    const fault = text => faults.push(`"${id}" -> ${ticket}: ${text}`);
    if (typeof ticket !== 'string' || !/^docs\/specs\/.+\.md$/.test(ticket)) { fault('not a ticket in docs/specs'); continue; }
    const path = join(root, ticket);
    if (!existsSync(path)) { fault('the ticket file does not exist'); continue; }
    const status = readFileSync(path, 'utf8').match(/^(?:\*\*)?Status:(?:\*\*)?\s*([\w-]+)/m)?.[1];
    if (!status) fault('the ticket has no Status line');
    else if (closed.includes(status)) fault(`the ticket status is ${status}; open a new ticket or remove the entry`);
  }
  return faults;
}
