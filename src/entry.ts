// Isolated visual study; production builds always open the game.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('study')) {
  await import('./render/prototype/study');
} else {
  await import('./main');
}
export {};
