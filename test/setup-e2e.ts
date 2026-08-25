import 'dotenv/config'

import { PrismaClient } from '@prisma/client'

const TEST_DATABASE_SUFFIX = '_test'
const TEST_SCHEMA_PATTERN = /^vitest_test_[a-z0-9_]+_w[12]$/

function workerDatabaseUrl(): string {
  const baseUrl = process.env.E2E_DATABASE_URL
  const prefix = process.env.E2E_SCHEMA_PREFIX
  const poolId = Number(process.env.VITEST_POOL_ID ?? '1')

  if (!baseUrl || !prefix || ![1, 2].includes(poolId)) {
    throw new Error('E2E global setup did not provide a valid worker database')
  }

  const url = new URL(baseUrl)
  const schema = `${prefix}_w${poolId}`
  if (!url.pathname.slice(1).endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error('Refusing to run E2E outside a dedicated test database')
  }
  if (!TEST_SCHEMA_PATTERN.test(schema)) {
    throw new Error(`Refusing to use unsafe E2E schema: ${schema}`)
  }

  url.searchParams.set('schema', schema)
  url.searchParams.set('connection_limit', '5')
  return url.toString()
}

const databaseUrl = workerDatabaseUrl()
process.env.DATABASE_URL = databaseUrl
// Individual E2E workers use isolated schemas; shared-store behavior is covered
// separately with a shared fake, while this keeps existing per-test resets cheap.
process.env.RATE_LIMIT_STORE = 'memory'

let prisma: PrismaClient

beforeAll(async () => {
  prisma = new PrismaClient({ datasourceUrl: databaseUrl })
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = current_schema()
  `

  if (tables.length > 0) {
    const quotedTables = tables
      .map(({ tablename }) => `"${tablename.replaceAll('"', '""')}"`)
      .join(', ')
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`,
    )
  }
})

afterAll(async () => {
  await prisma?.$disconnect()
})
