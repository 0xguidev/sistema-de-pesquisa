import { Injectable } from '@nestjs/common'

export type MetricName =
  | 'login_failures_total'
  | 'http_401_total'
  | 'http_403_total'
  | 'http_429_total'
  | 'refresh_replay_total'
  | 'report_generation_total'
  | 'report_timeout_total'
  | 'ssrf_block_total'
  | 'http_5xx_total'

@Injectable()
export class SecurityMetrics {
  private readonly counters = new Map<MetricName, number>()

  increment(name: MetricName) {
    this.counters.set(name, (this.counters.get(name) ?? 0) + 1)
  }

  render(): string {
    const names: MetricName[] = [
      'login_failures_total',
      'http_401_total',
      'http_403_total',
      'http_429_total',
      'refresh_replay_total',
      'report_generation_total',
      'report_timeout_total',
      'ssrf_block_total',
      'http_5xx_total',
    ]
    return `${names.map((name) => `# TYPE ${name} counter\n${name} ${this.counters.get(name) ?? 0}`).join('\n')}\n`
  }
}
