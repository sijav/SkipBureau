import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

// NestJS is decorator driven and needs `emitDecoratorMetadata`, which esbuild
// does not do. swc does, so vitest transforms through it.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    testTimeout: 60_000,
    hookTimeout: 180_000,
    // PGlite binds a port, so the suites cannot share one.
    fileParallelism: false,
  },
})
