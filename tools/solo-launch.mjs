/** One opt-in build. The emitted marker keeps the host routes tied to the site bytes. */
export function soloLaunch(value = process.env.KINGDOWN_SOLO_LAUNCH) {
  if (value !== undefined && value !== '' && value !== '0' && value !== '1') throw new Error('KINGDOWN_SOLO_LAUNCH must be 0 or 1');
  return value === '1';
}

/** Add launch-only entry behavior. The off build reads each original source byte. */
export function launchSource(code, id, enabled) {
  if (id.endsWith('/src/diagnostics/data.ts')) {
    const route = " if (clean === '/next.html') return '/next.html';\n";
    if (enabled) return code;
    // A changed line would keep the route in the off build, so the build stops.
    if (!code.includes(route)) throw new Error('Launch recorder route has changed');
    return code.replace(route, '');
  }
  if (!enabled) return;
  if (id.endsWith('/src/online/entry.ts')) {
    const call = '      const host = createBrowserRuntime(api, session.userId);';
    const controls = "      document.querySelector('#settings-sheet .new-game-body')!.append(logoutError, logoutGroup);";
    if (!code.includes(call) || !code.includes(controls)) throw new Error('Launch account entry has changed');
    return "import { installLocalSolo, installAccountControls } from './launch';\n" + code.replace(call, '      installLocalSolo(api, session.userId);\n' + call).replace(controls, controls + '\n      installAccountControls(auth, session);');
  }
}
