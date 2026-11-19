import '../../ui/kit.js';

// The kit exports this sheet in JavaScript. Keep its declaration with this lane.
declare module '../../ui/kit.js' {
  export function sheet(title: string, content: HTMLElement, fallback: HTMLElement): {
    element: HTMLElement;
    open(source: HTMLElement): void;
    close(): void;
  };
}
