import { Injectable } from '@nestjs/common'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import { buildHtml } from './utils/build-html'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { ReportProtection } from './report-protection'
import { PdfRenderer } from './pdf-renderer'

@Injectable()
export class GenerateSimpleReportPdfUseCase {
  constructor(
    private interviewRepository: InterviewRepository,
    private protection: ReportProtection,
    private renderer: PdfRenderer,
  ) {}

  async execute(surveyId: string, accountId: string): Promise<Buffer> {
    return this.protection.withPdfSlot(accountId, (signal) =>
      this.generate(surveyId, accountId, signal),
    )
  }

  private async generate(
    surveyId: string,
    accountId: string,
    signal: AbortSignal,
  ): Promise<Buffer> {
    const interviews = await this.interviewRepository.findBySurveyId(
      surveyId,
      accountId,
      1,
      this.protection.maxInterviews,
    )
    signal.throwIfAborted()

    this.protection.validateInterviews(interviews)

    if (!interviews || interviews.data.length === 0) {
      throw new ResourceNotFoundError()
    }

    const questionMeta = new Map<string, { title: string; number: number }>()

    const report: Record<
      string,
      Record<
        string,
        { answer: string; count: number; percentage: number; num: number }
      >
    > = {}

    for (const interview of interviews.data) {
      for (const answer of interview.answers) {
        if (answer?.question?.questionId && answer?.option?.title) {
          const qId = answer.question.questionId

          if (!questionMeta.has(qId)) {
            questionMeta.set(qId, {
              title: answer.question.title,
              number: answer.question.number,
            })
          }

          if (!report[qId]) report[qId] = {}

          const text = answer.option.title

          if (!report[qId][text]) {
            report[qId][text] = {
              answer: text,
              count: 0,
              percentage: 0,
              num: answer.option.number,
            }
          }

          report[qId][text].count++
        }
      }
    }

    const totalVotes = interviews.data.length

    const questions = Object.entries(report).map(([questionId, answers]) => {
      const meta = questionMeta.get(questionId)!

      const options = Object.values(answers)
        .map((o) => ({
          ...o,
          percentage: parseFloat(((o.count / totalVotes) * 100).toFixed(1)),
        }))
        // 🔥 ORDENAÇÃO GARANTIDA AQUI TAMBÉM
        .sort((a, b) => a.num - b.num)

      return {
        questionNum: meta.number,
        questionTitle: meta.title,
        options,
      }
    })

    const html = buildHtml(questions)

    const buffer = await this.renderer.render(html, {
      timeoutMs: this.protection.timeoutMs,
      signal,
    })
    this.protection.validateDocument(buffer)
    return buffer
  }
}
