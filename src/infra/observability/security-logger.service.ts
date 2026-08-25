import { Injectable } from '@nestjs/common'
import { createHmac } from 'node:crypto'
import { requestContext } from './request-context'
import { SecurityEventCode } from './security-events'

const SENSITIVE_KEY =
  /^(password|access_?token|refresh_?token|authorization|cookie|jwt.*key|database_?url)$/i

@Injectable()
export class SecurityLogger {
  private readonly pseudonymKey =
    process.env.LOG_PSEUDONYM_KEY ?? process.env.SESSION_IP_HASH_SECRET ?? 'local-only'

  audit(code: SecurityEventCode, fields: Record<string, unknown> = {}) {
    this.write('audit', code, fields)
  }

  operational(code: SecurityEventCode, fields: Record<string, unknown> = {}) {
    this.write('operational', code, fields)
  }

  pseudonym(value?: string): string | undefined {
    if (!value) return undefined
    return createHmac('sha256', this.pseudonymKey)
      .update(value.trim().toLowerCase())
      .digest('hex')
      .slice(0, 24)
  }

  private write(
    category: 'audit' | 'operational',
    code: SecurityEventCode,
    fields: Record<string, unknown>,
  ) {
    const context = requestContext.getStore()
    const record = this.sanitize({
      timestamp: new Date().toISOString(),
      level: category === 'audit' ? 'info' : 'info',
      category,
      event_code: code,
      request_id: context?.requestId,
      method: context?.method,
      path: context?.path,
      user_id: context?.userId
        ? this.pseudonym(context.userId)
        : undefined,
      ...fields,
    })
    process.stdout.write(`${JSON.stringify(record)}\n`)
  }

  private sanitize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item))
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([key]) => !SENSITIVE_KEY.test(key))
          .map(([key, item]) => [key, this.sanitize(item)]),
      )
    }
    if (typeof value === 'string') {
      return value
        .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [REDACTED]')
        .replace(/(postgres(?:ql)?:\/\/)[^@\s]+@/gi, '$1[REDACTED]@')
    }
    return value
  }
}
