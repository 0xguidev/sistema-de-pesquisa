import { ThrottlerStorage } from '@nestjs/throttler'

type ThrottlerStorageResult = Awaited<ReturnType<ThrottlerStorage['increment']>>

interface Bucket {
  hits: number
  expiresAt: number
  blockedUntil: number
}

/** In-memory throttler storage with an explicit clock for deterministic tests. */
export class ControllableThrottlerStorage implements ThrottlerStorage {
  private now = 0

  constructor(
    private readonly buckets: Map<string, Bucket> = new Map<string, Bucket>(),
  ) {}

  static sharedReplicas(count: number): ControllableThrottlerStorage[] {
    const sharedBuckets = new Map<string, Bucket>()
    return Array.from(
      { length: count },
      () => new ControllableThrottlerStorage(sharedBuckets),
    )
  }

  reset(): void {
    this.now = 0
    this.buckets.clear()
  }

  advanceBy(milliseconds: number): void {
    this.now += milliseconds
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageResult> {
    const bucketKey = `${throttlerName}:${key}`
    let bucket = this.buckets.get(bucketKey)

    if (!bucket || this.now >= bucket.expiresAt) {
      bucket = { hits: 0, expiresAt: this.now + ttl, blockedUntil: 0 }
      this.buckets.set(bucketKey, bucket)
    }

    if (bucket.blockedUntil > 0 && this.now >= bucket.blockedUntil) {
      bucket.hits = 0
      bucket.expiresAt = this.now + ttl
      bucket.blockedUntil = 0
    }

    if (bucket.blockedUntil === 0) {
      bucket.hits += 1
      if (bucket.hits > limit) bucket.blockedUntil = this.now + blockDuration
    }

    return {
      totalHits: bucket.hits,
      timeToExpire: Math.max(
        0,
        Math.ceil((bucket.expiresAt - this.now) / 1000),
      ),
      isBlocked: bucket.blockedUntil > this.now,
      timeToBlockExpire: Math.max(
        0,
        Math.ceil((bucket.blockedUntil - this.now) / 1000),
      ),
    }
  }
}
