import 'dotenv/config'

import { PrismaClient } from '@prisma/client'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const TEST_DATABASE_SUFFIX = '_test'
const TEST_SCHEMA_PATTERN = /^vitest_test_[a-z0-9_]+_w[12]$/
const WORKERS = [1, 2] as const

function quotedIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

function testDatabaseUrl(source: string): URL {
  const url = new URL(source)
  const sourceDatabase = url.pathname.slice(1)
  if (!sourceDatabase) throw new Error('DATABASE_URL must name a database')
  const testDatabase = sourceDatabase.endsWith(TEST_DATABASE_SUFFIX)
    ? sourceDatabase
    : `${sourceDatabase}${TEST_DATABASE_SUFFIX}`
  url.pathname = `/${testDatabase}`
  url.searchParams.set('schema', 'public')
  url.searchParams.set('connection_limit', '5')
  return url
}

async function ensureTestDatabase(source: URL, target: URL): Promise<void> {
  const adminUrl = new URL(source)
  adminUrl.pathname = '/postgres'
  adminUrl.searchParams.set('schema', 'public')
  const admin = new PrismaClient({ datasourceUrl: adminUrl.toString() })
  const databaseName = target.pathname.slice(1)

  try {
    const rows = await admin.$queryRawUnsafe<Array<{ exists: boolean }>>(
      'SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS "exists"',
      databaseName,
    )
    if (!rows[0]?.exists) {
      await admin.$executeRawUnsafe(
        `CREATE DATABASE ${quotedIdentifier(databaseName)}`,
      )
    }
  } finally {
    await admin.$disconnect()
  }
}

async function dropTestSchemas(targetUrl: URL, schemas: string[]) {
  const teardown = new PrismaClient({ datasourceUrl: targetUrl.toString() })
  try {
    for (const schema of schemas) {
      if (!TEST_SCHEMA_PATTERN.test(schema)) {
        throw new Error(`Refusing to drop unsafe E2E schema: ${schema}`)
      }
      await teardown.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS ${quotedIdentifier(schema)} CASCADE`,
      )
    }
  } finally {
    await teardown.$disconnect()
  }
}

export default async function globalSetup() {
  const configuredUrl = process.env.DATABASE_URL
  if (!configuredUrl) throw new Error('DATABASE_URL is required for E2E tests')

  const sourceUrl = new URL(configuredUrl)
  const targetUrl = testDatabaseUrl(configuredUrl)
  if (!targetUrl.pathname.slice(1).endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error('Refusing to prepare a non-test database')
  }
  await ensureTestDatabase(sourceUrl, targetUrl)

  const runId = `${Date.now().toString(36)}_${process.pid.toString(36)}`
  const schemaPrefix = `vitest_test_${runId}`
  const schemas = WORKERS.map((worker) => `${schemaPrefix}_w${worker}`)

  try {
    for (const schema of schemas) {
      if (!TEST_SCHEMA_PATTERN.test(schema)) {
        throw new Error(`Refusing to create unsafe E2E schema: ${schema}`)
      }
      const workerUrl = new URL(targetUrl)
      workerUrl.searchParams.set('schema', schema)
      await execFileAsync('pnpm', ['prisma', 'db', 'push', '--skip-generate'], {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: workerUrl.toString() },
      })
    }
  } catch (error) {
    await dropTestSchemas(targetUrl, schemas)
    throw error
  }

  process.env.E2E_DATABASE_URL = targetUrl.toString()
  process.env.E2E_SCHEMA_PREFIX = schemaPrefix

  return () => dropTestSchemas(targetUrl, schemas)
}
