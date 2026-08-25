import { InvalidRequestError } from '@/core/errors/errors/invalid-request-error'
import { EnvService } from '@/infra/env/env.service'
import { Injectable, Optional } from '@nestjs/common'
import { SecurityLogger } from '@/infra/observability/security-logger.service'
import { SecurityMetrics } from '@/infra/observability/security-metrics.service'
import { SecurityEvent } from '@/infra/observability/security-events'
import { PdfCapacityStore } from './pdf-capacity-store'

export class ReportUserCapacityError extends Error {}
export class ReportGlobalCapacityError extends Error {}
export class ReportTimeoutError extends Error {}

@Injectable()
export class ReportProtection {
  constructor(
    private readonly env: EnvService,
    private readonly capacity: PdfCapacityStore,
    @Optional() private readonly logger?: SecurityLogger,
    @Optional() private readonly metrics?: SecurityMetrics,
  ) {}

  get maxInterviews() {
    return this.env.get('REPORT_MAX_INTERVIEWS')
  }
  get timeoutMs() {
    return this.env.get('REPORT_TIMEOUT_MS')
  }

  validateInterviews(result: {
    data: Array<{
      answers: Array<{
        question: { title: string; questionId: string }
        option: { title: string }
      }>
    }>
    total: number
  }) {
    if (result.total > this.maxInterviews) {
      throw new InvalidRequestError(
        `O relatório excede o limite de ${this.maxInterviews} entrevistas (total: ${result.total}).`,
      )
    }
    const questionIds = new Set<string>()
    const options = new Map<string, Set<string>>()
    for (const interview of result.data)
      for (const answer of interview.answers) {
        const { question, option } = answer
        questionIds.add(question.questionId)
        if (
          question.title.length > this.env.get('REPORT_MAX_TEXT_LENGTH') ||
          option.title.length > this.env.get('REPORT_MAX_TEXT_LENGTH')
        )
          throw new InvalidRequestError(
            'O relatório contém texto maior que o limite configurado.',
          )
        const values = options.get(question.questionId) ?? new Set<string>()
        values.add(option.title)
        options.set(question.questionId, values)
      }
    if (questionIds.size > this.env.get('REPORT_MAX_QUESTIONS'))
      throw new InvalidRequestError(
        `O relatório excede o limite de ${this.env.get('REPORT_MAX_QUESTIONS')} perguntas.`,
      )
    for (const values of options.values())
      if (values.size > this.env.get('REPORT_MAX_OPTIONS_PER_QUESTION'))
        throw new InvalidRequestError(
          `O relatório excede o limite de ${this.env.get('REPORT_MAX_OPTIONS_PER_QUESTION')} opções por pergunta.`,
        )
  }

  validateDocument(buffer: Buffer) {
    if (buffer.byteLength > this.env.get('REPORT_MAX_DOCUMENT_BYTES'))
      throw new InvalidRequestError(
        `O documento excede o limite de ${this.env.get('REPORT_MAX_DOCUMENT_BYTES')} bytes.`,
      )
  }

  validateQuestions(questions: Array<{ questionTitle: string }>) {
    if (questions.length > this.env.get('REPORT_MAX_QUESTIONS'))
      throw new InvalidRequestError(
        `O relatório excede o limite de ${this.env.get('REPORT_MAX_QUESTIONS')} perguntas.`,
      )
    if (
      questions.some(
        (question) =>
          question.questionTitle.length >
          this.env.get('REPORT_MAX_TEXT_LENGTH'),
      )
    )
      throw new InvalidRequestError(
        'O relatório contém texto maior que o limite configurado.',
      )
  }

  validateOptions(options: Array<{ optionTitle: string }>) {
    if (options.length > this.env.get('REPORT_MAX_OPTIONS_PER_QUESTION'))
      throw new InvalidRequestError(
        `O relatório excede o limite de ${this.env.get('REPORT_MAX_OPTIONS_PER_QUESTION')} opções por pergunta.`,
      )
    if (
      options.some(
        (option) =>
          option.optionTitle.length > this.env.get('REPORT_MAX_TEXT_LENGTH'),
      )
    )
      throw new InvalidRequestError(
        'O relatório contém texto maior que o limite configurado.',
      )
  }

  async withPdfSlot<T>(
    accountId: string,
    operation: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const slot = await this.capacity.acquire({
      accountId,
      globalLimit: this.env.get('REPORT_PDF_GLOBAL_CONCURRENCY'),
      userLimit: this.env.get('REPORT_PDF_USER_CONCURRENCY'),
      // A crashed replica cannot release its lease. Keep it slightly longer
      // than the enforced render timeout, then let another acquisition reap it.
      leaseMs: this.timeoutMs + 30_000,
    })
    if (!slot.acquired && slot.reason === 'user') {
      this.logger?.audit(SecurityEvent.REPORT_CAPACITY_REJECTED, {
        scope: 'user',
        principal_id: this.logger?.pseudonym(accountId),
      })
      throw new ReportUserCapacityError(
        'Já existe uma geração de PDF em andamento para este usuário.',
      )
    }
    if (!slot.acquired) {
      this.logger?.audit(SecurityEvent.REPORT_CAPACITY_REJECTED, {
        scope: 'global',
      })
      throw new ReportGlobalCapacityError(
        'A capacidade de geração de PDF está temporariamente esgotada.',
      )
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const abort = new AbortController()
    // Convert synchronous renderer failures into a rejected promise so the
    // finally block always releases the distributed lease.
    const running = Promise.resolve().then(() => operation(abort.signal))
    try {
      return await Promise.race([
        running,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            this.logger?.audit(SecurityEvent.REPORT_TIMEOUT, {
              principal_id: this.logger?.pseudonym(accountId),
              timeout_ms: this.timeoutMs,
            })
            this.metrics?.increment('report_timeout_total')
            reject(
              new ReportTimeoutError(
                'A geração do relatório excedeu o tempo limite.',
              ),
            )
            abort.abort()
          }, this.timeoutMs)
        }),
      ])
    } finally {
      if (timer) clearTimeout(timer)
      // The timed-out operation may ignore cancellation. Observe its eventual
      // rejection without delaying the HTTP response or retaining capacity.
      void running.catch(() => undefined)
      await this.capacity.release(slot.leaseId)
    }
  }
}
