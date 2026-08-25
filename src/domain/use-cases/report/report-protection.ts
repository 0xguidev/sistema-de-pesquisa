import { InvalidRequestError } from '@/core/errors/errors/invalid-request-error'
import { EnvService } from '@/infra/env/env.service'
import { Injectable, Logger } from '@nestjs/common'

export class ReportUserCapacityError extends Error {}
export class ReportGlobalCapacityError extends Error {}
export class ReportTimeoutError extends Error {}

@Injectable()
export class ReportProtection {
  private readonly logger = new Logger(ReportProtection.name)
  private globalPdf = 0
  private readonly userPdf = new Map<string, number>()

  constructor(private readonly env: EnvService) {}

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
      this.logger.warn(
        JSON.stringify({
          event: 'report_capacity_rejected',
          scope: 'user',
          accountId,
        }),
      )
      throw new ReportUserCapacityError(
        'Já existe uma geração de PDF em andamento para este usuário.',
      )
    }
    if (this.globalPdf >= this.env.get('REPORT_PDF_GLOBAL_CONCURRENCY')) {
      this.logger.warn(
        JSON.stringify({ event: 'report_capacity_rejected', scope: 'global' }),
      )
      throw new ReportGlobalCapacityError(
        'A capacidade de geração de PDF está temporariamente esgotada.',
      )
    }
    this.globalPdf++
    this.userPdf.set(accountId, currentUser + 1)
    let timer: ReturnType<typeof setTimeout> | undefined
    const abort = new AbortController()
    const running = operation(abort.signal)
    let timedOut = false
    try {
      return await Promise.race([
        running,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            timedOut = true
            this.logger.error(
              JSON.stringify({
                event: 'report_timeout',
                accountId,
                timeoutMs: this.timeoutMs,
              }),
            )
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
      // Do not return capacity while Chromium is still unwinding.
      if (timedOut) await running.catch(() => undefined)
      this.globalPdf--
      const remaining = (this.userPdf.get(accountId) ?? 1) - 1
      if (remaining === 0) this.userPdf.delete(accountId)
      else this.userPdf.set(accountId, remaining)
    }
  }
}
