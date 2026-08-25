import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    include: ['src/infra/renderer/*.integration-spec.ts'],
    globals: true,
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
  plugins: [tsConfigPaths(), swc.vite({ module: { type: 'es6' } })],
})
