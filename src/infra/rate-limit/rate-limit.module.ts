import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { EnvModule } from '../env/env.module'
import { EnvService } from '../env/env.service'
import { createRateLimitOptions } from './rate-limit.config'
import { PublicRateLimitGuard } from './public-rate-limit.guard'

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => createRateLimitOptions(env),
    }),
  ],
  providers: [PublicRateLimitGuard],
  exports: [ThrottlerModule, PublicRateLimitGuard],
})
export class RateLimitModule {}
