import { onlineClient } from '../../../src/online/client';

declare global {
  interface Window {
    privateProbe: (marker: string) => Promise<{ status: number; code: string }>;
    recordWorkerEvent: (event: { event: string; marker: string; client: string }) => Promise<void>;
  }
}
// Hold receipt in the page. A held worker event prevents takeover.
const NativeChannel = window.MessageChannel;
window.MessageChannel = class {
  port1: MessagePort;
  port2: MessagePort;
  constructor() {
    const channel = new NativeChannel();
    let listener: MessagePort['onmessage'] = null;
    this.port2 = channel.port2;
    this.port1 = {
      get onmessage() { return listener; },
      set onmessage(value: MessagePort['onmessage']) {
        listener = value;
        channel.port1.onmessage = value ? async event => {
          const applicationCaches = (await caches.keys()).filter(name => name.startsWith('kingdown-'));
          await fetch(`/fixture/reply?client=${encodeURIComponent(location.href)}`);
          if (!listener) return;
          await fetch('/fixture/event', { method: 'POST', body: JSON.stringify({ event: 'reply', requestId: event.data.requestId, version: event.data.version, client: location.href, applicationCaches }) });
          listener?.call(channel.port1, event);
        } : null;
      },
      close() { listener = null; channel.port1.close(); },
    } as MessagePort;
  }
} as unknown as typeof MessageChannel;

window.privateProbe = async marker => {
  try {
    await onlineClient({ token: async () => marker, fetch: (url, init) => {
      const headers = new Headers(init?.headers); headers.set('X-Fixture-Tab', location.href);
      return fetch(url, { ...init, headers });
    } }).games();
    return { status: 200, code: '' };
  } catch (error) {
    const failure = error as { status: number; code: string };
    if (failure.status === 503) await window.recordWorkerEvent({ event: 'refused', marker, client: location.href });
    return { status: failure.status, code: failure.code };
  }
};
