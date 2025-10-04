import { Injectable } from '@nestjs/common'
import { InterviewRepository } from 'src/domain/repositories/interview-repository'

export interface SimpleReportData {
  questionId: string
  questionNum: number
  questionTitle: string
  options: {
    num: number
    answer: string
    percentage: number
  }[]
}

@Injectable()
export class GenerateSimpleReportUseCase {
  constructor(private interviewRepository: InterviewRepository) {}

  async execute(surveyId: string, accountId: string): Promise<SimpleReportData[]> {
    const interviews = await this.interviewRepository.findBySurveyId(surveyId, accountId, 1, 1000)
    if (!interviews || interviews.data.length === 0) {
      throw new Error('Nenhuma entrevista encontrada para gerar relatório')
    }

    const report: Record<string, Record<string, { answer: string; count: number; percentage: number; num: number }>> = {}

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
    const result: SimpleReportData[] = []

    for (const questionId in report) {
      const options = Object.values(report[questionId])
      options.sort((a, b) => a.num - b.num)

      // Obter texto da pergunta
      const firstAnswer = interviews.data
        .flatMap(i => i.answers)
        .find(a => a.question.questionId === questionId)
      const questionText = firstAnswer?.question.title || 'N/A'
      const questionNum = firstAnswer?.question.number || 0

      // Calcular porcentagens
      options.forEach(option => {
        option.percentage = parseFloat(((option.count / totalVotes) * 100).toFixed(1))
      })

      result.push({
        questionId,
        questionNum,
        questionTitle: questionText,
        options: options.map(opt => ({
          num: opt.num,
          answer: opt.answer,
          percentage: opt.percentage,
        })),
      })
    }

    // Ordenar o resultado por questionNum em ordem crescente
    result.sort((a, b) => a.questionNum - b.questionNum)

    return result
  }
}
