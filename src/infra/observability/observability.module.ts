import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { CorrelationMiddleware } from './correlation.middleware'
import { HttpObservabilityInterceptor } from './http-observability.interceptor'
import { MetricsController } from './metrics.controller'
import { SecurityLogger } from './security-logger.service'
import { SecurityMetrics } from './security-metrics.service'
import { GlobalExceptionFilter } from './global-exception.filter'

@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    SecurityLogger,
    SecurityMetrics,
    { provide: APP_INTERCEPTOR, useClass: HttpObservabilityInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
  exports: [SecurityLogger, SecurityMetrics],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes('*')
  }
}
