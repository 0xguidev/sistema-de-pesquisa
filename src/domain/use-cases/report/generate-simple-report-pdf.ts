import { Injectable } from '@nestjs/common'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import puppeteer from 'puppeteer'
import type { HTTPRequest } from 'puppeteer'
import { buildHtml } from './utils/build-html'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

const PDF_OPERATION_TIMEOUT_MS = 30_000

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
  constructor(private interviewRepository: InterviewRepository) {}

  async execute(surveyId: string, accountId: string): Promise<Buffer> {
    const interviews = await this.interviewRepository.findBySurveyId(
      surveyId,
      accountId,
      1,
      1000,
    )

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

    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      timeout: PDF_OPERATION_TIMEOUT_MS,
    })
    let page: Awaited<ReturnType<typeof browser.newPage>> | undefined

    try {
      page = await browser.newPage()
      page.setDefaultNavigationTimeout(PDF_OPERATION_TIMEOUT_MS)
      page.setDefaultTimeout(PDF_OPERATION_TIMEOUT_MS)
      await page.setRequestInterception(true)
      page.on('request', interceptPdfRequest)

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: PDF_OPERATION_TIMEOUT_MS,
      })

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        timeout: PDF_OPERATION_TIMEOUT_MS,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
      })

      return Buffer.from(pdf)
    } finally {
      try {
        if (page && !page.isClosed()) await page.close()
      } finally {
        await browser.close()
      }
    }
  }
}
