import { PrismaOptionAnswerMapper } from '@/infra/database/prisma/mappers/prisma-option-answer-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import {
  OptionAnswer,
  OptionAnswerProps,
} from 'src/domain/entities/option-answer'
export function makeOptionAnswer(
  override: Partial<OptionAnswerProps> = {},
  id?: UniqueEntityID,
) {
  const optionanswer = OptionAnswer.create(
    {
      optionTitle: faker.lorem.sentence(),
      optionNum: faker.number.int({ min: 1, max: 50 }),
      accountId: new UniqueEntityID(),
      questionId: new UniqueEntityID(),
      createdAt: new Date(),
      ...override,
    },
    id,
  )

  return optionanswer
}

@Injectable()
export class OptionAnswerFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaOptionAnswer(
    data: Partial<OptionAnswer> = {},
  ): Promise<OptionAnswer> {
    const account = makeOptionAnswer(data)

    await this.prisma.optionAnswer.create({
      data: PrismaOptionAnswerMapper.toPrisma(account),
    })

    return account
  }
}
