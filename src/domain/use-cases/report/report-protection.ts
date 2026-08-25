import { InvalidRequestError } from '@/core/errors/errors/invalid-request-error'
import { EnvService } from '@/infra/env/env.service'
import { Injectable, Optional } from '@nestjs/common'
import { SecurityLogger } from '@/infra/observability/security-logger.service'
import { SecurityMetrics } from '@/infra/observability/security-metrics.service'
import { SecurityEvent } from '@/infra/observability/security-events'

export class ReportUserCapacityError extends Error {}
export class ReportGlobalCapacityError extends Error {}
export class ReportTimeoutError extends Error {}

@Injectable()
export class ReportProtection {
  private globalPdf = 0
  private readonly userPdf = new Map<string, number>()

  constructor(
    private readonly env: EnvService,
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
    const currentUser = this.userPdf.get(accountId) ?? 0
    if (currentUser >= this.env.get('REPORT_PDF_USER_CONCURRENCY')) {
      this.logger?.audit(SecurityEvent.REPORT_CAPACITY_REJECTED, {
        scope: 'user',
        principal_id: this.logger?.pseudonym(accountId),
      })
      throw new ReportUserCapacityError(
        'Já existe uma geração de PDF em andamento para este usuário.',
      )
    }
    if (this.globalPdf >= this.env.get('REPORT_PDF_GLOBAL_CONCURRENCY')) {
      this.logger?.audit(SecurityEvent.REPORT_CAPACITY_REJECTED, {
        scope: 'global',
      })
      throw new ReportGlobalCapacityError(
        'A capacidade de geração de PDF está temporariamente esgotada.',
      )
    }
    this.globalPdf++
    this.userPdf.set(accountId, currentUser + 1)
    let timer: ReturnType<typeof setTimeout> | undefined
    const abort = new AbortController()
    const running = operation(abort.signal)
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
      this.globalPdf--
      const remaining = (this.userPdf.get(accountId) ?? 1) - 1
      if (remaining === 0) this.userPdf.delete(accountId)
      else this.userPdf.set(accountId, remaining)
    }
  }
}
