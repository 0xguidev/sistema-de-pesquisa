import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Question } from '../../entities/question'
import { QuestionRepository } from '../../repositories/question-repository'
import { Either, right } from 'src/core/types/either'
import { Injectable } from '@nestjs/common'
import { ConditionalRule } from '../../entities/conditional-rule'

interface CreateQuestionUseCaseRequest {
  questionTitle: string
  questionNum: number
  surveyId: string
  accountId: string
  conditionalRules?: {
    dependsOnQuestionId: string
    dependsOnOptionId: string
    operator: string
  }[]
}

export type CreateQuestionUseCaseResponse = Either<
  null,
  {
    question: Question
  }
>

@Injectable()
export class CreateQuestionUseCase {
  constructor(private questionRepository: QuestionRepository) {}

  async execute({
    questionTitle,
    questionNum,
    surveyId,
    accountId,
    conditionalRules,
  }: CreateQuestionUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const question = Question.create({
      questionTitle,
      questionNum,
      surveyId: new UniqueEntityID(surveyId),
      accountId: new UniqueEntityID(accountId),
    })

    await this.questionRepository.create(question)

    if (conditionalRules) {
      for (const rule of conditionalRules) {
        const conditionalRule = ConditionalRule.create({
          questionId: question.id,
          dependsOnQuestionId: new UniqueEntityID(rule.dependsOnQuestionId),
          dependsOnOptionId: new UniqueEntityID(rule.dependsOnOptionId),
          operator: rule.operator,
        })

        await this.questionRepository.createConditionalRule(conditionalRule)
      }
    }

    return right({
      question,
    })
  }
}
