import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  server: { port: +(process.env.PORT || 5173), strictPort: true },
  worker: { format: 'es' },
  test: { environment: 'node' },
});
