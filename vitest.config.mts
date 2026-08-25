import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    globals: true,
    root: './',
    testTimeout: 10_000,
    coverage: {
      include: [
        'src/core/entities/**/*.ts',
        'src/core/types/**/*.ts',
        'src/domain/entities/**/*.ts',
        'src/domain/use-cases/**/*.ts',
      ],
      exclude: [
        'src/domain/use-cases/**/interfaces/**/*.ts',
        'src/domain/types/**/*.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 75,
        lines: 80,
      },
    },
  },
  plugins: [
    tsConfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
})
