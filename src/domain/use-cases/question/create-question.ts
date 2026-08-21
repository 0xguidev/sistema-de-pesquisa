import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Question } from '../../entities/question'
import { QuestionRepository } from '../../repositories/question-repository'
import { OptionAnswerRepository } from '../../repositories/option-answer-repository'
import { Either, left, right } from '@/core/types/either'
import { Injectable } from '@nestjs/common'
import { ConditionalRule } from '../../entities/conditional-rule'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { SurveyRepository } from '../../repositories/survey-repository'

interface CreateQuestionUseCaseRequest {
  questionTitle: string
  questionNum: number
  surveyId: string
  accountId: string
  conditionalRules?: {
    dependsOnQuestionNumber: number
    dependsOnOptionNumber: number
  }[]
}

export type CreateQuestionUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    question: Question
  }
>

@Injectable()
export class CreateQuestionUseCase {
  constructor(
    private questionRepository: QuestionRepository,
    private optionAnswerRepository: OptionAnswerRepository,
    private surveyRepository: SurveyRepository,
  ) {}

  async execute({
    questionTitle,
    questionNum,
    surveyId,
    accountId,
    conditionalRules,
  }: CreateQuestionUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const survey = await this.surveyRepository.findByIdAndAccountId(
      surveyId,
      accountId,
    )

    if (!survey) {
      return left(new ResourceNotFoundError())
    }

    const question = Question.create({
      questionTitle,
      questionNum,
      surveyId: new UniqueEntityID(surveyId),
      accountId: new UniqueEntityID(accountId),
    })

    const rulesToCreate: ConditionalRule[] = []
    if (conditionalRules) {
      for (const rule of conditionalRules) {
        const dependsOnQuestion =
          await this.questionRepository.findByQuestionNumAndAccountId(
            surveyId,
            rule.dependsOnQuestionNumber,
            accountId,
          )

        if (!dependsOnQuestion) {
          return left(new ResourceNotFoundError())
        }

        const optionAnswer =
          await this.optionAnswerRepository.findOptionByQuestionIdAndOptionNumAndAccountId(
            dependsOnQuestion.id.toString(),
            rule.dependsOnOptionNumber,
            accountId,
          )

        if (!optionAnswer) {
          return left(new ResourceNotFoundError())
        }

        const conditionalRule = ConditionalRule.create({
          questionId: question.id,
          dependsOnQuestionId: dependsOnQuestion.id,
          dependsOnQuestionNumber: rule.dependsOnQuestionNumber,
          dependsOnOptionId: optionAnswer.id,
          dependsOnOptionNumber: rule.dependsOnOptionNumber,
          surveyId: new UniqueEntityID(surveyId),
        })

        rulesToCreate.push(conditionalRule)
      }
    }

    await this.questionRepository.create(question)
    for (const rule of rulesToCreate) {
      await this.questionRepository.createConditionalRule(rule)
    }

    return right({
      question,
    })
  }
}
