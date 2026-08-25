# Test environment

Use Node 20.19.4 and pnpm 10.14.0. Unit tests and coverage do not open TCP
ports. The E2E suite requires PostgreSQL reachable through `DATABASE_URL`; its
global setup derives a dedicated `_test` database and isolated schemas, and
refuses to run against any other database name. The E2E setup forces
`NODE_ENV=test`, `DATABASE_TLS_MODE=disable`, and `sslmode=disable` only on that
local dedicated URL.

Run the complete validation with:

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm test:coverage
pnpm test:e2e
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test:renderer:integration
pnpm security:audit
pnpm prisma:validate
```

The Chromium smoke test is deliberately excluded from the unit configuration.
It has its own configuration, contains no conditional skip, requires an explicit
binary path, and renders only self-contained HTML. SSRF blocking and cleanup are
covered by the renderer unit tests with a mocked browser.

Environmental failures are isolated as follows:

- socket creation is not needed by unit tests;
- PostgreSQL availability affects only `test:e2e`;
- a missing Chromium binary, or a sandbox that blocks Chromium sockets, affects
  only `test:renderer:integration`;
- registry/network availability affects only `security:audit`.
