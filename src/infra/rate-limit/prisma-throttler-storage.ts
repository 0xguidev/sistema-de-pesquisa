import { Injectable } from '@nestjs/common'
import { ThrottlerStorage } from '@nestjs/throttler'
import { PrismaService } from '../database/prisma/prisma.service'

/** PostgreSQL-backed buckets. The advisory lock makes increments atomic across replicas. */
@Injectable()
export class PrismaThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly prisma: PrismaService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ) {
    const bucketKey = `${throttlerName}:${key}`

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${bucketKey}))`

      const now = new Date()
      const current = await tx.rateLimitBucket.findUnique({
        where: { key: bucketKey },
      })
      const windowExpired = !current || current.expiresAt <= now
      const blockExpired = Boolean(
        current?.blockedUntil && current.blockedUntil <= now,
      )
      const reset = windowExpired || blockExpired
      let totalHits = reset ? 0 : (current?.totalHits ?? 0)
      let expiresAt = reset ? new Date(now.getTime() + ttl) : current!.expiresAt
      let blockedUntil = reset ? null : (current?.blockedUntil ?? null)

      if (!blockedUntil || blockedUntil <= now) {
        totalHits += 1
        if (totalHits > limit) {
          blockedUntil = new Date(now.getTime() + blockDuration)
        }
      }

      await tx.rateLimitBucket.upsert({
        where: { key: bucketKey },
        create: { key: bucketKey, totalHits, expiresAt, blockedUntil },
        update: { totalHits, expiresAt, blockedUntil },
      })

      return {
        totalHits,
        timeToExpire: this.secondsUntil(expiresAt, now),
        isBlocked: Boolean(blockedUntil && blockedUntil > now),
        timeToBlockExpire: blockedUntil
          ? this.secondsUntil(blockedUntil, now)
          : 0,
      }
    })
  }

  private secondsUntil(date: Date, now: Date): number {
    return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 1000))
  }
}
