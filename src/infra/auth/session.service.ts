import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { PrismaService } from '../database/prisma/prisma.service'
import { EnvService } from '../env/env.service'
import { SecurityLogger } from '../observability/security-logger.service'
import { SecurityMetrics } from '../observability/security-metrics.service'
import { SecurityEvent } from '../observability/security-events'

export type SessionMetadata = { userAgent?: string; ip?: string }
type SessionTokens = {
  accessToken: string
  refreshToken: string
  refreshExpiresAt: Date
  accountId: string
}

@Injectable()
export class SessionService implements OnModuleInit, OnModuleDestroy {
  private cleanupTimer?: ReturnType<typeof setInterval>

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private env: EnvService,
    private securityLogger: SecurityLogger,
    private metrics: SecurityMetrics,
  ) {}

  onModuleInit() {
    const interval = this.env.get('SESSION_CLEANUP_INTERVAL_MINUTES') * 60_000
    this.cleanupTimer = setInterval(() => void this.cleanupExpired(), interval)
    this.cleanupTimer.unref()
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer)
  }

  async create(accountId: string, metadata: SessionMetadata): Promise<SessionTokens> {
    const id = randomUUID()
    const refreshToken = this.generateRefreshToken(id)
    const expiresAt = this.refreshExpiry()
    await this.prisma.session.create({
      data: {
        id,
        accountId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        userAgent: metadata.userAgent?.slice(0, 200),
        ipHash: this.hashIp(metadata.ip),
      },
    })
    return this.tokens(accountId, id, refreshToken, expiresAt)
  }

  async rotate(refreshToken: string): Promise<SessionTokens | null> {
    const sessionId = this.sessionIdFromToken(refreshToken)
    if (!sessionId) return null
    const presentedHash = this.hashToken(refreshToken)
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } })
    if (!session || session.revokedAt || session.expiresAt <= new Date()) return null

    if (!this.hashesEqual(session.tokenHash, presentedHash)) {
      const replay = await this.prisma.sessionUsedToken.findUnique({
        where: { tokenHash: presentedHash },
      })
      if (replay?.sessionId === sessionId) {
        await this.prisma.session.updateMany({
          where: { id: sessionId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
        this.securityLogger.audit(SecurityEvent.REFRESH_REPLAY, {
          session_id: this.securityLogger.pseudonym(sessionId),
          principal_id: this.securityLogger.pseudonym(session.accountId),
        })
        this.metrics.increment('refresh_replay_total')
      }
      return null
    }

    const nextToken = this.generateRefreshToken(session.id)
    const nextHash = this.hashToken(nextToken)
    const now = new Date()
    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.session.updateMany({
        where: {
          id: session.id,
          tokenHash: presentedHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { tokenHash: nextHash, lastUsedAt: now },
      })
      if (claimed.count !== 1) return false
      await tx.sessionUsedToken.create({
        data: { tokenHash: presentedHash, sessionId: session.id, usedAt: now },
      })
      return true
    })
    if (!updated) {
      await this.prisma.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      this.securityLogger.audit(SecurityEvent.REFRESH_REPLAY, {
        session_id: this.securityLogger.pseudonym(session.id),
        principal_id: this.securityLogger.pseudonym(session.accountId),
        reason: 'concurrent_rotation',
      })
      this.metrics.increment('refresh_replay_total')
      return null
    }
    return this.tokens(session.accountId, session.id, nextToken, session.expiresAt)
  }

  async revoke(sessionId: string, accountId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, accountId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  async revokeAll(accountId: string) {
    await this.prisma.session.updateMany({
      where: { accountId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  async isActive(sessionId: string, accountId: string): Promise<boolean> {
    return Boolean(await this.prisma.session.findFirst({
      where: { id: sessionId, accountId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    }))
  }

  async cleanupExpired() {
    await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
  }

  private tokens(accountId: string, sessionId: string, refreshToken: string, refreshExpiresAt: Date): SessionTokens {
    return {
      accessToken: this.jwt.sign({ sub: accountId, sid: sessionId, iat: Math.floor(Date.now() / 1000) }),
      refreshToken,
      refreshExpiresAt,
      accountId,
    }
  }

  private refreshExpiry() {
    return new Date(Date.now() + this.env.get('REFRESH_TOKEN_TTL_DAYS') * 86_400_000)
  }

  private generateRefreshToken(sessionId: string) {
    return `${sessionId}.${randomBytes(32).toString('base64url')}`
  }

  private sessionIdFromToken(token: string) {
    const [id, secret, extra] = token.split('.')
    return !extra && secret && /^[0-9a-f-]{36}$/i.test(id) ? id : null
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  private hashesEqual(stored: string, presented: string) {
    const left = Buffer.from(stored, 'hex')
    const right = Buffer.from(presented, 'hex')
    return left.length === right.length && timingSafeEqual(left, right)
  }

  private hashIp(ip?: string) {
    const secret = this.env.get('SESSION_IP_HASH_SECRET')
    return ip && secret ? createHmac('sha256', secret).update(ip).digest('hex') : undefined
  }
}
