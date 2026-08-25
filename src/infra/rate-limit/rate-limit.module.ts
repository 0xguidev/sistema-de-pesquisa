import { Module } from '@nestjs/common'
import { ThrottlerModule, ThrottlerStorageService } from '@nestjs/throttler'
import { EnvModule } from '../env/env.module'
import { EnvService } from '../env/env.service'
import { createRateLimitOptions } from './rate-limit.config'
import { PublicRateLimitGuard } from './public-rate-limit.guard'
import { DatabaseModule } from '../database/database.module'
import { PrismaService } from '../database/prisma/prisma.service'
import { PrismaThrottlerStorage } from './prisma-throttler-storage'
import { ObservabilityModule } from '../observability/observability.module'

@Module({
  imports: [
    DatabaseModule,
    ObservabilityModule,
    ThrottlerModule.forRootAsync({
      imports: [EnvModule, DatabaseModule],
      inject: [EnvService, PrismaService],
      useFactory: (env: EnvService, prisma: PrismaService) => ({
        ...createRateLimitOptions(env),
        storage:
          env.get('RATE_LIMIT_STORE') === 'database'
            ? new PrismaThrottlerStorage(prisma)
            : new ThrottlerStorageService(),
      }),
    }),
  ],
  providers: [PublicRateLimitGuard, PrismaThrottlerStorage],
  exports: [ThrottlerModule, PublicRateLimitGuard],
})
export class RateLimitModule {}
