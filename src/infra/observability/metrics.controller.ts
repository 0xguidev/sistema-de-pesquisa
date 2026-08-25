import { Controller, Get, Header } from '@nestjs/common'
import { Public } from '@/infra/auth/public'
import { SecurityMetrics } from './security-metrics.service'

@Controller('/metrics')
export class MetricsController {
  constructor(private readonly metrics: SecurityMetrics) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics() {
    return this.metrics.render()
  }
}
