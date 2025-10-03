import { Injectable } from '@nestjs/common'
import { InterviewRepository } from 'src/domain/repositories/interview-repository'
import { ISimpleReport, ISimpleOptionsReport } from '../../types/ReportTypes'

@Injectable()
export class GenerateSimpleReportUseCase {
  constructor(private interviewRepository: InterviewRepository) {}

  async execute(surveyId: string, accountId: string): Promise<ISimpleReport[]> {
    const interviews = await this.interviewRepository.findBySurveyId(surveyId, accountId, 1, 1000)
    if (!interviews || interviews.data.length === 0) return []

    const report: Record<string, Record<string, ISimpleOptionsReport & { num: number }>> = {}

    for (const interview of interviews.data) {
      for (const answer of interview.answers) {
        if (answer && answer.question.questionId && answer.option.title) {
          const questionId = answer.question.questionId

          if (!report[questionId]) {
            report[questionId] = {}
          }

          const answerText = answer.option.title
          if (!report[questionId][answerText]) {
            report[questionId][answerText] = {
              answer: answerText,
              count: 0,
              percentage: 0,
              num: answer.option.number,
            }
          }

          report[questionId][answerText].count++
        }
      }
    }

    const totalVotes = interviews.data.length
    const result: ISimpleReport[] = []

    for (const questionId in report) {
      const options: ISimpleOptionsReport[] = []

      for (const answerText in report[questionId]) {
        const item = report[questionId][answerText]
        const count = item.count
        const percentage = parseFloat(((count / totalVotes) * 100).toFixed(1))

        options.push({
          answer: answerText,
          count,
          percentage,
          num: report[questionId][answerText].num,
        })
      }

      // Sort options by num
      options.sort((a, b) => {
        const numA = report[questionId][a.answer].num
        const numB = report[questionId][b.answer].num
        return numA - numB
      })

      // Get question text and num from the first answer
      const firstAnswer = interviews.data
        .flatMap(i => i.answers)
        .find(a => a.question.questionId === questionId)
      const questionText = firstAnswer?.question.title || 'N/A'
      const questionNum = firstAnswer?.question.number || 0

      result.push({
        question: questionText,
        questionId,
        questionNum,
        options,
      })
    }

    return result
  }
}
