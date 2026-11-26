/** Apply ordered host routes. `present` is a file or native function at the original path. */
export function siteRoute(config, path, present = false) {
  const headers = {};
  for (const route of config.routes) {
    if (route.handle === 'filesystem') { if (present) break; continue; }
    // A host rule (the www redirect) applies only on the host: a local server does not know the request host.
    if (route.has || !route.src || !new RegExp(route.src).test(path)) continue;
    Object.assign(headers, route.headers);
    if (route.dest) return { dest: route.dest, headers, ...(route.status && { status: route.status }) };
  }
  return { dest: path, headers };
}
