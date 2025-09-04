import { PrismaQuestionMapper } from '@/infra/database/prisma/mappers/prisma-question-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Question, QuestionProps } from 'src/domain/entities/question'
import {
  ConditionalRule,
  ConditionalRuleProps,
} from 'src/domain/entities/conditional-rule'

export function makeQuestion(
  override: Partial<QuestionProps> = {},
  id?: UniqueEntityID,
) {
  const question = Question.create(
    {
      surveyId: new UniqueEntityID(),
      accountId: new UniqueEntityID(),
      questionTitle: faker.lorem.sentence(),
      questionNum: faker.number.int({ min: 1, max: 30 }),
      ...override,
    },
    id,
  )

  return question
}

export function makeConditionalRule(
  questionId: UniqueEntityID,
  override: Partial<ConditionalRuleProps> = {},
  id?: UniqueEntityID,
) {
  const conditionalRule = ConditionalRule.create(
    {
      questionId,
      dependsOnQuestionId: new UniqueEntityID(),
      dependsOnOptionId: new UniqueEntityID(),
      operator: 'EQUAL',
      ...override,
    },
    id,
  )

  return conditionalRule
}

@Injectable()
export class QuestionFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaQuestion(data: Partial<Question> = {}): Promise<Question> {
    const question = makeQuestion(data)

    await this.prisma.question.create({
      data: PrismaQuestionMapper.toPrisma(question),
    })

    return question
  }

  async makePrismaQuestionWithConditionalRule(
    data: Partial<Question> = {},
  ): Promise<Question> {
    const question = makeQuestion(data)
    const conditionalRule = makeConditionalRule(question.id)

    await this.prisma.question.create({
      data: PrismaQuestionMapper.toPrisma(question),
    })

    await this.prisma.conditionalRule.create({
      data: {
        questionId: question.id.toString(),
        dependsOnQuestionId: conditionalRule.dependsOnQuestionId.toString(),
        dependsOnOptionId: conditionalRule.dependsOnOptionId.toString(),
        operator: conditionalRule.operator,
      },
    })

    return question
  }
}
