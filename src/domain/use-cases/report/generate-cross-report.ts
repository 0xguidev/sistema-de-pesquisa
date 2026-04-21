import { Injectable } from '@nestjs/common'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import { QuestionRepository } from '@/domain/repositories/question-repository'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'

export interface CrossReportData {
  questionA: string
  questionANum: number
  questionAId: string
  questionB: string
  questionBNum: number
  questionBId: string
  answers: Array<{
    numA: number
    answerA: string
    numB: number
    answerB: string
    percentage: number
  }>
}

interface InternalAnswer {
  numA: number
  answerA: string
  numB: number
  answerB: string
  percentage: number
}

interface InternalCrossReportData extends Omit<CrossReportData, 'answers'> {
  answers: InternalAnswer[]
}

@Injectable()
export class GenerateCrossReportUseCase {
  constructor(
    private interviewRepository: InterviewRepository,
    private questionRepository: QuestionRepository,
    private optionAnswerRepository: OptionAnswerRepository,
  ) {}

  async execute(
    surveyId: string,
    accountId: string,
  ): Promise<CrossReportData[]> {
    const interviews = await this.interviewRepository.findBySurveyId(
      surveyId,
      accountId,
      1,
      1000,
    )
    if (!interviews || interviews.data.length === 0) {
      throw new Error('Nenhuma entrevista encontrada para gerar relatório')
    }

    // Buscar todas as perguntas do survey
    const questions =
      await this.questionRepository.findQuestionsBySurveyId(surveyId)
    if (!questions || questions.length < 2) {
      throw new Error(
        'São necessárias pelo menos duas perguntas para gerar relatório cruzado',
      )
    }

    const result: InternalCrossReportData[] = []

    // Gerar pares de perguntas e suas combinações de opções
    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const questionA = questions[i]
        const questionB = questions[j]

        const optionsA = await this.optionAnswerRepository.findManyByQuestionId(
          questionA.id.toString(),
        )
        const optionsB = await this.optionAnswerRepository.findManyByQuestionId(
          questionB.id.toString(),
        )

        if (
          !optionsA ||
          !optionsB ||
          optionsA.length === 0 ||
          optionsB.length === 0
        ) {
          continue // Pular se alguma pergunta não tem opções
        }

        const entry: InternalCrossReportData = {
          questionA: questionA.questionTitle,
          questionANum: questionA.questionNum,
          questionAId: questionA.id.toString(),
          questionB: questionB.questionTitle,
          questionBNum: questionB.questionNum,
          questionBId: questionB.id.toString(),
          answers: [],
        }

        // Gerar todas as combinações cartesianas de opções
        for (const optionA of optionsA) {
          for (const optionB of optionsB) {
            entry.answers.push({
              numA: optionA.optionNum,
              answerA: optionA.optionTitle,
              numB: optionB.optionNum,
              answerB: optionB.optionTitle,
              percentage: 0,
            })
          }
        }

        result.push(entry)
      }
    }

    // Contar ocorrências nas entrevistas
    for (const interview of interviews.data) {
      for (const entry of result) {
        const answerA = interview.answers.find(
          (a) => a.question.questionId === entry.questionAId,
        )
        const answerB = interview.answers.find(
          (a) => a.question.questionId === entry.questionBId,
        )

        if (answerA && answerB) {
          const answerEntry = entry.answers.find(
            (a) =>
              a.numA === answerA.option.number &&
              a.numB === answerB.option.number,
          )
          if (answerEntry) {
            answerEntry.percentage += 1
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
        a.percentage = parseFloat(
          ((a.percentage / totalVotes) * 100).toFixed(1),
        )
      }
    }

    // Ordenar o resultado por questionANum e questionBNum em ordem crescente
    result.sort((a, b) => {
      if (a.questionANum !== b.questionANum)
        return a.questionANum - b.questionANum
      return a.questionBNum - b.questionBNum
    })

    return result as CrossReportData[]
  }
}
