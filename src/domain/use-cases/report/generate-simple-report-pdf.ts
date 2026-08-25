import { Injectable } from '@nestjs/common'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import puppeteer from 'puppeteer'
import type { HTTPRequest } from 'puppeteer'
import { buildHtml } from './utils/build-html'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { ReportProtection } from './report-protection'

export function isAllowedPdfResource(url: string): boolean {
  if (url === 'about:blank') return true

  try {
    return new URL(url).protocol === 'data:'
  } catch {
    return false
  }
}

function interceptPdfRequest(request: HTTPRequest): void {
  const action = isAllowedPdfResource(request.url())
    ? request.continue()
    : request.abort('blockedbyclient')

  void action.catch(() => undefined)
}

@Injectable()
export class GenerateSimpleReportPdfUseCase {
  constructor(
    private interviewRepository: InterviewRepository,
    private protection: ReportProtection,
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

    const timeout = this.protection.timeoutMs
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      timeout,
    })
    let page: Awaited<ReturnType<typeof browser.newPage>> | undefined
    const closeOnTimeout = () => {
      void browser.close().catch(() => undefined)
    }
    signal.addEventListener('abort', closeOnTimeout, { once: true })

    try {
      signal.throwIfAborted()
      page = await browser.newPage()
      page.setDefaultNavigationTimeout(timeout)
      page.setDefaultTimeout(timeout)
      await page.setRequestInterception(true)
      page.on('request', interceptPdfRequest)

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout,
      })

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        timeout,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
      })

      const buffer = Buffer.from(pdf)
      this.protection.validateDocument(buffer)
      return buffer
    } finally {
      signal.removeEventListener('abort', closeOnTimeout)
      try {
        if (page && !page.isClosed()) await page.close()
      } finally {
        await browser.close().catch(() => undefined)
      }
    }
  }
}
