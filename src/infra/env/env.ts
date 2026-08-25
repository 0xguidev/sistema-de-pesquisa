import { z } from 'zod'
import { createPrivateKey, createPublicKey, KeyObject } from 'node:crypto'

const MIN_RSA_BITS = 2048
const MIN_SESSION_SECRET_BYTES = 32

function decodeBase64(value: string): Buffer | null {
  const normalized = value.replace(/\s/g, '')
  if (
    normalized.length === 0 ||
    normalized.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)
  ) {
    return null
  }

  const decoded = Buffer.from(normalized, 'base64')
  return decoded.toString('base64') === normalized ? decoded : null
}

function readRsaKeyPair(privateValue: string, publicValue: string): boolean {
  const privatePem = decodeBase64(privateValue)
  const publicPem = decodeBase64(publicValue)
  if (!privatePem || !publicPem) return false

  try {
    const privateKey = createPrivateKey(privatePem)
    const publicKey = createPublicKey(publicPem)
    if (!isSafeRsaKey(privateKey) || !isSafeRsaKey(publicKey)) return false

    const derivedPublic = createPublicKey(privateKey).export({
      type: 'spki',
      format: 'der',
    })
    const configuredPublic = publicKey.export({ type: 'spki', format: 'der' })
    return Buffer.from(derivedPublic).equals(Buffer.from(configuredPublic))
  } catch {
    return false
  }
}

function isSafeRsaKey(key: KeyObject): boolean {
  return (
    key.asymmetricKeyType === 'rsa' &&
    (key.asymmetricKeyDetails?.modulusLength ?? 0) >= MIN_RSA_BITS
  )
}

function hasRequiredDatabaseTls(databaseUrl: string): boolean {
  try {
    const sslMode = new URL(databaseUrl).searchParams.get('sslmode')
    return ['require', 'verify-ca', 'verify-full'].includes(sslMode ?? '')
  } catch {
    return false
  }
}

function hasExplicitlyDisabledDatabaseTls(databaseUrl: string): boolean {
  try {
    return new URL(databaseUrl).searchParams.get('sslmode') === 'disable'
  } catch {
    return false
  }
}

export const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_PRIVATE_KEY',
  'JWT_PUBLIC_KEY',
  'CORS_ORIGIN',
] as const

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .optional()
      .default('development'),
    DATABASE_URL: z.string().url(),
    DATABASE_TLS_MODE: z.enum(['require', 'disable']),
    JWT_PRIVATE_KEY: z.string().min(1),
    JWT_PUBLIC_KEY: z.string().min(1),
    CORS_ORIGIN: z.string().min(1),
    BCRYPT_COST: z.coerce.number().int().min(10).max(14).optional().default(10),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(300)
      .max(86400)
      .optional()
      .default(900),
    RATE_LIMIT_STORE: z
      .enum(['database', 'memory'])
      .optional()
      .default('database'),
    COMPROMISED_PASSWORD_SHA256: z.string().optional().default(''),
    TRUST_PROXY_HOPS: z.coerce
      .number()
      .int()
      .min(0)
      .max(10)
      .optional()
      .default(0),
    REQUIRE_HTTPS: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .transform((value) => value === 'true'),
    LOGIN_RATE_LIMIT_IP_MAX: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(20),
    LOGIN_RATE_LIMIT_IDENTIFIER_MAX: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(5),
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .max(86400)
      .optional()
      .default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(90)
      .optional()
      .default(30),
    SESSION_CLEANUP_INTERVAL_MINUTES: z.coerce
      .number()
      .int()
      .min(1)
      .max(1440)
      .optional()
      .default(60),
    SESSION_IP_HASH_SECRET: z.string().optional(),
    REGISTER_RATE_LIMIT_IP_MAX: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(5),
    REGISTER_RATE_LIMIT_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .max(86400)
      .optional()
      .default(3600),
    REFRESH_RATE_LIMIT_IP_MAX: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(30),
    REFRESH_RATE_LIMIT_SESSION_MAX: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(10),
    REFRESH_RATE_LIMIT_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .max(86400)
      .optional()
      .default(60),
    REPORT_RATE_LIMIT_USER_MAX: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(10),
    REPORT_RATE_LIMIT_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .max(86400)
      .optional()
      .default(60),
    REPORT_PDF_GLOBAL_CONCURRENCY: z.coerce
      .number()
      .int()
      .min(1)
      .max(32)
      .optional()
      .default(2),
    REPORT_PDF_USER_CONCURRENCY: z.coerce
      .number()
      .int()
      .min(1)
      .max(8)
      .optional()
      .default(1),
    REPORT_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1000)
      .max(300000)
      .optional()
      .default(30000),
    REPORT_MAX_INTERVIEWS: z.coerce
      .number()
      .int()
      .min(1)
      .max(100000)
      .optional()
      .default(1000),
    REPORT_MAX_QUESTIONS: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(100),
    REPORT_MAX_OPTIONS_PER_QUESTION: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(100),
    REPORT_MAX_TEXT_LENGTH: z.coerce
      .number()
      .int()
      .min(1)
      .max(100000)
      .optional()
      .default(5000),
    REPORT_MAX_DOCUMENT_BYTES: z.coerce
      .number()
      .int()
      .min(1024)
      .max(1073741824)
      .optional()
      .default(20 * 1024 * 1024),
    // CLOUDFLARE_ACCOUNT_ID: z.string(),
    // AWS_BUCKET_NAME: z.string(),
    // AWS_ACCESS_KEY_ID: z.string(),
    // AWS_SECRET_ACCESS_KEY: z.string(),
    // REDIS_HOST: z.string().optional().default('127.0.0.1'),
    // REDIS_PORT: z.coerce.number().optional().default(6379),
    // REDIS_DB: z.coerce.number().optional().default(0),
    PORT: z.coerce.number().optional().default(3333),
  })
  .refine(
    (env) =>
      env.REPORT_PDF_USER_CONCURRENCY <= env.REPORT_PDF_GLOBAL_CONCURRENCY,
    {
      message:
        'REPORT_PDF_USER_CONCURRENCY must not exceed REPORT_PDF_GLOBAL_CONCURRENCY',
      path: ['REPORT_PDF_USER_CONCURRENCY'],
    },
  )
  .superRefine((env, context) => {
    if (!readRsaKeyPair(env.JWT_PRIVATE_KEY, env.JWT_PUBLIC_KEY)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `JWT key pair must be matching Base64-encoded PEM RSA keys of at least ${MIN_RSA_BITS} bits`,
        path: ['JWT_PRIVATE_KEY'],
      })
    }

    if (
      env.DATABASE_TLS_MODE === 'require' &&
      !hasRequiredDatabaseTls(env.DATABASE_URL)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DATABASE_URL must explicitly require TLS',
        path: ['DATABASE_URL'],
      })
    }
    if (
      env.DATABASE_TLS_MODE === 'disable' &&
      !hasExplicitlyDisabledDatabaseTls(env.DATABASE_URL)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DATABASE_URL must explicitly set sslmode=disable',
        path: ['DATABASE_URL'],
      })
    }
    if (env.NODE_ENV === 'production' && env.DATABASE_TLS_MODE !== 'require') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Production requires database TLS',
        path: ['DATABASE_TLS_MODE'],
      })
    }

    if (env.REQUIRE_HTTPS && env.TRUST_PROXY_HOPS === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'HTTPS enforcement requires a trusted proxy',
        path: ['TRUST_PROXY_HOPS'],
      })
    }

    const sessionSecret = env.SESSION_IP_HASH_SECRET
      ? decodeBase64(env.SESSION_IP_HASH_SECRET)
      : null
    if (sessionSecret && sessionSecret.byteLength < MIN_SESSION_SECRET_BYTES) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `SESSION_IP_HASH_SECRET must contain at least ${MIN_SESSION_SECRET_BYTES} random bytes encoded as Base64`,
        path: ['SESSION_IP_HASH_SECRET'],
      })
    } else if (env.SESSION_IP_HASH_SECRET && !sessionSecret) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SESSION_IP_HASH_SECRET must be valid Base64',
        path: ['SESSION_IP_HASH_SECRET'],
      })
    } else if (env.NODE_ENV === 'production' && !sessionSecret) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Production requires SESSION_IP_HASH_SECRET',
        path: ['SESSION_IP_HASH_SECRET'],
      })
    }
  })
  .refine(
    (env) => env.NODE_ENV !== 'production' || env.RATE_LIMIT_STORE !== 'memory',
    {
      message: 'Production requires a shared rate-limit store',
      path: ['RATE_LIMIT_STORE'],
    },
  )

export function validateRequiredEnv(env: Record<string, string | undefined>) {
  const missing = requiredEnvVars.filter(
    (key) => !env[key] || env[key]?.trim() === '',
  )

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Configure them before starting the app.`,
    )
  }

  envSchema.parse(env)
}

export type Env = z.infer<typeof envSchema>

export function parseCorsOrigin(corsOrigin: string): string | string[] {
  if (corsOrigin === '*') {
    return corsOrigin
  }

  const origins = corsOrigin.split(',').map((origin) => origin.trim())

  return origins.length === 1 ? origins[0] : origins
}

export function isCorsOriginAllowed(
  configuredOrigin: string | string[],
  requestOrigin?: string,
): boolean {
  if (!requestOrigin || configuredOrigin === '*') {
    return true
  }

  return Array.isArray(configuredOrigin)
    ? configuredOrigin.includes(requestOrigin)
    : configuredOrigin === requestOrigin
}
