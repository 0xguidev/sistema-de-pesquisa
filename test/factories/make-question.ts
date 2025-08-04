import { PrismaQuestionMapper } from '@/infra/database/prisma/mappers/prisma-question-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Question, QuestionProps } from 'src/domain/entities/question'
import { makeOptionAnswer } from './make-option-answer'

export function makeQuestion(
  override: Partial<QuestionProps> = {},
  id?: UniqueEntityID,
) {
  const option1 = makeOptionAnswer({optionNum: 1})
  const option2 = makeOptionAnswer({optionNum: 2})
  const option3 = makeOptionAnswer({optionNum: 3})

  const question = Question.create(
    {
      surveyId: new UniqueEntityID(),
      accountId: new UniqueEntityID(),
      questionTitle: faker.lorem.sentence(),
      questionNum: faker.number.int({ min: 1, max: 30 }),
      options:  [option1, option2,option3],
      ...override,
    },
    id,
  )

  return question
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
}
