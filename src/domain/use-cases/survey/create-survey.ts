import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/types/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { Survey } from '@/domain/entities/survey'
import { Question } from '@/domain/entities/question'
import { OptionAnswer } from '@/domain/entities/option-answer'

import { SurveyRepository } from '@/domain/repositories/survey-repository'
import { QuestionRepository } from '@/domain/repositories/question-repository'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'

interface CreateSurveyUseCaseRequest {
  title: string
  location: string
  type: string
  accountId: string
  questions: Array<{
    questionTitle: string
    questionNum: number
    options: Array<{
      optionTitle: string
      optionNum: number
    }>
  }>
}

type CreateSurveyUseCaseResponse = Either<
  null,
  {
    survey: Survey
  }
>

@Injectable()
export class CreateSurveyUseCase {
  constructor(
    private surveyRepository: SurveyRepository,
    private questionRepository: QuestionRepository,
    private optionAnswerRepository: OptionAnswerRepository,
  ) {}

  async execute({
    title,
    location,
    type,
    accountId,
    questions,
  }: CreateSurveyUseCaseRequest): Promise<CreateSurveyUseCaseResponse> {
    const accountIdUnique = new UniqueEntityID(accountId)

    const survey = Survey.create({
      title,
      location,
      type,
      accountId: accountIdUnique,
    })

    await this.surveyRepository.create(survey)

    for (const q of questions) {
      const question = Question.create({
        questionTitle: q.questionTitle,
        questionNum: q.questionNum,
        surveyId: survey.id,
        accountId: accountIdUnique,
      })

      await this.questionRepository.create(question)

      for (const opt of q.options) {
        const option = OptionAnswer.create({
          optionTitle: opt.optionTitle,
          optionNum: opt.optionNum,
          questionId: question.id,
          accountId: accountIdUnique,
        })

        await this.optionAnswerRepository.create(option)
      }
    }

    return right({ survey })
  }
}
