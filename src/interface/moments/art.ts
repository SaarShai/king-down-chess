export interface FramePack {
  image: string;
  size: number;
  columns: number;
  pivot: [number, number];
  body: number;
  ms: number;
  frames: [number, number][];
}
export interface LoadedPack { bank: FramePack; image: HTMLImageElement }

/** Start requests on use. Share in-flight loads and let the browser cache released sheets. */
export function createArtLoader() {
  const base = `${import.meta.env.BASE_URL}moments/`;
  let index: Promise<Record<string, FramePack>> | undefined;
  const loading = new Map<string, Promise<LoadedPack>>();
  return (key: string): Promise<LoadedPack> => {
    const pending = loading.get(key);
    if (pending) return pending;
    index ??= fetch(`${base}painted.json`).then(response => {
      if (!response.ok) throw Error('Moment index is missing.');
      return response.json();
    }).catch(error => { index = undefined; throw error; });
    const pack = index.then(async banks => {
      const bank = banks[key];
      if (!bank) throw Error(`Unknown moment pack: ${key}`);
      const image = new Image();
      image.src = base + bank.image;
      await image.decode();
      return { bank, image };
    }).finally(() => loading.delete(key));
    loading.set(key, pack);
    return pack;
  };
}

export function frameAt(bank: FramePack, milliseconds: number) {
  let frame = bank.frames[0][1];
  for (const [time, index] of bank.frames) {
    if (time > milliseconds) break;
    frame = index;
  }
  return frame;
}
