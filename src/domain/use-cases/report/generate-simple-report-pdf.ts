import { Injectable } from '@nestjs/common'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import puppeteer from 'puppeteer'
import { buildHtml } from './utils/build-html'

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
      throw new Error('Nenhuma entrevista encontrada')
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
          percentage: parseFloat(
            ((o.count / totalVotes) * 100).toFixed(1),
          ),
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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
    })

    await browser.close()

    return Buffer.from(pdf)
  }
}