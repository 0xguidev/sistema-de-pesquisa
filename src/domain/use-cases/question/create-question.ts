import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Question } from '../../entities/question'
import { QuestionRepository } from '../../repositories/question-repository'
import { OptionAnswerRepository } from '../../repositories/option-answer-repository'
import { Either, left, right } from 'src/core/types/either'
import { Injectable } from '@nestjs/common'
import { ConditionalRule } from '../../entities/conditional-rule'

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
  Error,
  {
    question: Question
  }
>

@Injectable()
export class CreateQuestionUseCase {
  constructor(
    private questionRepository: QuestionRepository,
    private optionAnswerRepository: OptionAnswerRepository,
  ) {}

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
        const dependsOnQuestion = await this.questionRepository.findByQuestionNum(
          surveyId,
          rule.dependsOnQuestionNumber,
        )

        if (!dependsOnQuestion) {
          return left(new Error('Depends on question not found'))
        }

        const optionAnswer = await this.optionAnswerRepository.findOptionByQuestionIdAndOptionNum(
          dependsOnQuestion.id.toString(),
          rule.dependsOnOptionNumber,
        )

        if (!optionAnswer) {
          return left(new Error('Depends on option not found'))
        }

        const conditionalRule = ConditionalRule.create({
          questionId: question.id,
          dependsOnQuestionId: dependsOnQuestion.id,
          dependsOnQuestionNumber: rule.dependsOnQuestionNumber,
          dependsOnOptionId: optionAnswer.id,
          dependsOnOptionNumber: rule.dependsOnOptionNumber,
          surveyId: new UniqueEntityID(surveyId),
        })

        await this.questionRepository.createConditionalRule(conditionalRule)
      }
    }

    return right({
      question,
    })
  }
}
