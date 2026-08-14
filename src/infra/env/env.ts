import { z } from 'zod'

export const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_PRIVATE_KEY',
  'JWT_PUBLIC_KEY',
] as const

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  // CLOUDFLARE_ACCOUNT_ID: z.string(),
  // AWS_BUCKET_NAME: z.string(),
  // AWS_ACCESS_KEY_ID: z.string(),
  // AWS_SECRET_ACCESS_KEY: z.string(),
  // REDIS_HOST: z.string().optional().default('127.0.0.1'),
  // REDIS_PORT: z.coerce.number().optional().default(6379),
  // REDIS_DB: z.coerce.number().optional().default(0),
  PORT: z.coerce.number().optional().default(3333),
})

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
