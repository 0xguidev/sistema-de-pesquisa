import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    globals: true,
    root: './',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/infra/renderer/*.integration-spec.ts',
    ],
    testTimeout: 10_000,
    coverage: {
      include: [
        'src/core/entities/**/*.ts',
        'src/core/types/**/*.ts',
        'src/domain/entities/**/*.ts',
        'src/domain/use-cases/**/*.ts',
        'src/infra/auth/jwt.strategy.ts',
        'src/infra/auth/roles.guard.ts',
        'src/infra/cryptography/**/*.ts',
        'src/infra/renderer/puppeteer-pdf-renderer.ts',
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
        'src/domain/use-cases/account/**/*.ts': {
          statements: 85,
          branches: 80,
          functions: 90,
          lines: 85,
        },
        'src/infra/auth/{jwt.strategy,roles.guard}.ts': {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
        'src/domain/use-cases/{answer-question,interview,option-answer,question,survey}/**/*.ts': {
          statements: 80,
          branches: 75,
          functions: 85,
          lines: 80,
        },
        'src/{domain/use-cases/report,infra/renderer}/**/*.ts': {
          statements: 80,
          branches: 60,
          functions: 75,
          lines: 80,
        },
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
