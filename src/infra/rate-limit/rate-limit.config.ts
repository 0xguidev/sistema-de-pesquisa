import { EnvService } from '@/infra/env/env.service'
import { ThrottlerModuleOptions } from '@nestjs/throttler'
import { createHash } from 'node:crypto'
import {
  LOGIN_IDENTIFIER_THROTTLER,
  LOGIN_IP_THROTTLER,
  RATE_LIMIT_MESSAGE,
  REGISTER_IP_THROTTLER,
  REFRESH_IP_THROTTLER,
  REFRESH_SESSION_THROTTLER,
  REPORT_USER_THROTTLER,
} from './rate-limit.constants'

interface RateLimitRequest {
  ip?: string
  originalUrl?: string
  socket?: { remoteAddress?: string }
  body?: { email?: unknown; refresh_token?: unknown }
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

const SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function refreshSessionTracker(request: RateLimitRequest): string {
  const token = request.body?.refresh_token
  const sessionId = typeof token === 'string' ? token.split('.', 1)[0] : ''
  const value = SESSION_ID_PATTERN.test(sessionId)
    ? sessionId.toLowerCase()
    : 'invalid'
  return createHash('sha256').update(value).digest('hex')
}

export function createRateLimitOptions(
  env: EnvService,
): ThrottlerModuleOptions {
  const loginWindow = env.get('LOGIN_RATE_LIMIT_WINDOW_SECONDS') * 1000
  const registerWindow = env.get('REGISTER_RATE_LIMIT_WINDOW_SECONDS') * 1000
  const reportWindow = env.get('REPORT_RATE_LIMIT_WINDOW_SECONDS') * 1000
  const refreshWindow = env.get('REFRESH_RATE_LIMIT_WINDOW_SECONDS') * 1000

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
        name: REFRESH_IP_THROTTLER,
        limit: env.get('REFRESH_RATE_LIMIT_IP_MAX'),
        ttl: refreshWindow,
        blockDuration: refreshWindow,
        getTracker: (request: RateLimitRequest) => clientIp(request),
      },
      {
        name: REFRESH_SESSION_THROTTLER,
        limit: env.get('REFRESH_RATE_LIMIT_SESSION_MAX'),
        ttl: refreshWindow,
        blockDuration: refreshWindow,
        getTracker: refreshSessionTracker,
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
