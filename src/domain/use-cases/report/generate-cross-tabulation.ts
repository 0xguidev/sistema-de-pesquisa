import { Injectable } from '@nestjs/common'
import { InterviewRepository } from 'src/domain/repositories/interview-repository'
import { ICrossReport, ICrossReportAnswer } from '../../types/ReportTypes'

@Injectable()
export class GenerateCrossTabulationUseCase {
  constructor(private interviewRepository: InterviewRepository) {}

  async execute(surveyId: string, accountId: string): Promise<ICrossReport[]> {
    const interviews = await this.interviewRepository.findBySurveyId(surveyId, accountId, 1, 1000)
    if (!interviews || interviews.data.length === 0) return []

    const result: ICrossReport[] = []

    // Loop pelas entrevistas
    for (const interview of interviews.data) {
      for (let i = 0; i < interview.answers.length; i++) {
        const answerA = interview.answers[i]

        for (let j = i + 1; j < interview.answers.length; j++) {
          const answerB = interview.answers[j]

          if (
            answerA.question.questionId !== answerB.question.questionId &&
            answerA.question.number < answerB.question.number
          ) {
            const questionAId = answerA.question.questionId
            const questionA = answerA.question.title
            const questionANum = answerA.question.number
            const questionBId = answerB.question.questionId
            const questionB = answerB.question.title
            const questionBNum = answerB.question.number
            const answerTextA = answerA.option.title
            const answerTextB = answerB.option.title

            let entry = result.find(
              e =>
                e.questionAId === questionAId &&
                e.questionBId === questionBId,
            )
            if (!entry) {
              entry = {
                questionA,
                questionANum,
                questionAId,
                questionB,
                questionBNum,
                questionBId,
                answers: [],
              }
              result.push(entry)
            }

            let answerEntry = entry.answers.find(
              a => a.answerA === answerTextA && a.answerB === answerTextB,
            )
            if (!answerEntry) {
              answerEntry = {
                answerA: answerTextA,
                answerB: answerTextB,
                count: 0,
                percentage: 0,
                numA: answerA.option.number,
                numB: answerB.option.number,
              }
              entry.answers.push(answerEntry)
            }
            answerEntry.count++
          }
        }
      }
    }

    // Calcular porcentagens e ordenar as respostas dentro de cada entrada
    for (const entry of result) {
      const totalVotes = interviews.data.length

      // Ordenar por numA e numB
      entry.answers.sort((a, b) => {
        if (a.numA !== b.numA) return a.numA - b.numA
        return a.numB - b.numB
      })

      for (const a of entry.answers) {
        a.percentage = parseFloat(((a.count / totalVotes) * 100).toFixed(1))
      }
    }

    return result
  }
}
