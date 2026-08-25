import { z } from 'zod'

export const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_PRIVATE_KEY',
  'JWT_PUBLIC_KEY',
  'CORS_ORIGIN',
] as const

export const envSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    JWT_PRIVATE_KEY: z.string().min(1),
    JWT_PUBLIC_KEY: z.string().min(1),
    CORS_ORIGIN: z.string().min(1),
    BCRYPT_COST: z.coerce.number().int().min(10).max(14).optional().default(10),
    TRUST_PROXY_HOPS: z.coerce
      .number()
      .int()
      .min(0)
      .max(10)
      .optional()
      .default(0),
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
    SESSION_IP_HASH_SECRET: z.string().min(32).optional(),
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
