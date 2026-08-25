import { EnvService } from '@/infra/env/env.service'
import { ThrottlerModuleOptions } from '@nestjs/throttler'
import { createHash } from 'node:crypto'
import {
  LOGIN_IDENTIFIER_THROTTLER,
  LOGIN_IP_THROTTLER,
  RATE_LIMIT_MESSAGE,
  REGISTER_IP_THROTTLER,
  REPORT_USER_THROTTLER,
} from './rate-limit.constants'

interface RateLimitRequest {
  ip?: string
  originalUrl?: string
  socket?: { remoteAddress?: string }
  body?: { email?: unknown }
  user?: { sub?: string }
}

function clientIp(request: RateLimitRequest): string {
  return request.ip ?? request.socket?.remoteAddress ?? 'unknown'
}

export function loginIdentifierTracker(request: RateLimitRequest): string {
  const email =
    typeof request.body?.email === 'string'
      ? request.body.email.trim().toLowerCase()
      : ''
  const identifierDigest = createHash('sha256').update(email).digest('hex')

  return `${clientIp(request)}:${identifierDigest}`
}

export function createRateLimitOptions(
  env: EnvService,
): ThrottlerModuleOptions {
  const loginWindow = env.get('LOGIN_RATE_LIMIT_WINDOW_SECONDS') * 1000
  const registerWindow = env.get('REGISTER_RATE_LIMIT_WINDOW_SECONDS') * 1000
  const reportWindow = env.get('REPORT_RATE_LIMIT_WINDOW_SECONDS') * 1000

  return {
    errorMessage: RATE_LIMIT_MESSAGE,
    throttlers: [
      {
        name: REPORT_USER_THROTTLER,
        limit: env.get('REPORT_RATE_LIMIT_USER_MAX'),
        ttl: reportWindow,
        blockDuration: reportWindow,
        skipIf: (context) => {
          const request = context.switchToHttp().getRequest<RateLimitRequest>()
          return !request.originalUrl?.startsWith('/reports')
        },
        getTracker: (request: RateLimitRequest) =>
          request.user?.sub ?? clientIp(request),
      },
      {
        name: LOGIN_IP_THROTTLER,
        limit: env.get('LOGIN_RATE_LIMIT_IP_MAX'),
        ttl: loginWindow,
        blockDuration: loginWindow,
        getTracker: (request: RateLimitRequest) => clientIp(request),
      },
      {
        name: LOGIN_IDENTIFIER_THROTTLER,
        limit: env.get('LOGIN_RATE_LIMIT_IDENTIFIER_MAX'),
        ttl: loginWindow,
        blockDuration: loginWindow,
        getTracker: (request: RateLimitRequest) =>
          loginIdentifierTracker(request),
      },
      {
        name: REGISTER_IP_THROTTLER,
        limit: env.get('REGISTER_RATE_LIMIT_IP_MAX'),
        ttl: registerWindow,
        blockDuration: registerWindow,
        getTracker: (request: RateLimitRequest) => clientIp(request),
      },
    ],
  }
}
