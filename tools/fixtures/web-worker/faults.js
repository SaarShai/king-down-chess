/* This prefix runs only on the check server. Release files stay unchanged. */
const fixtureFetch = self.fetch.bind(self);
const fixtureLog = (event, fields = {}) => fixtureFetch('/fixture/event', { method: 'POST', body: JSON.stringify({ event, ...fields }) });
const fixtureDelete = caches.delete.bind(caches);
caches.delete = async name => {
  const mode = await (await fixtureFetch(`/fixture/delete?name=${encodeURIComponent(name)}&state=${self.registration.active?.state}`)).text();
  if (mode === 'throw') throw new Error('Planned cache delete fault');
  if (mode === 'false') return false;
  const result = await fixtureDelete(name);
  await fixtureLog('deleted', { name });
  return result;
};
const fixtureListen = self.addEventListener.bind(self);
self.addEventListener = (type, listener) => {
  if (type !== 'message') return fixtureListen(type, listener);
  fixtureListen(type, event => {
    event.waitUntil(fixtureLog('request', { requestId: event.data?.requestId, client: event.source?.url }));
    let reply;
    listener({ data: event.data, source: event.source,
      ports: event.ports.map(port => ({ postMessage(data) {
        reply = (async () => {
          await fixtureLog('proof', { requestId: data.requestId, version: data.version, client: event.source.url });
          port.postMessage(data);
        })();
      } })),
      waitUntil(promise) { event.waitUntil(promise.then(() => reply)); },
    });
  });
};
