import { PrismaAnswerMapper } from '@/infra/database/prisma/mappers/prisma-answer-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import {
  AnswerQuestion,
  AnswerQuestionProps,
} from 'src/domain/entities/answer-question'

export function makeAnswerQuestion(
  override: Partial<AnswerQuestionProps> = {},
  id?: UniqueEntityID,
) {
  const answerQuestion = AnswerQuestion.create(
    {
      interviewId: new UniqueEntityID(),
      optionAnswerId: new UniqueEntityID(),
      questionId: new UniqueEntityID(),
      accountId: new UniqueEntityID(),
      ...override,
    },
    id,
  )

  return answerQuestion
}

@Injectable()
export class AnswerQuestionFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaAnswerQuestion(
    data: Partial<AnswerQuestion> = {},
  ): Promise<AnswerQuestion> {
    const account = makeAnswerQuestion(data)

    await this.prisma.answerQuestion.create({
      data: PrismaAnswerMapper.toPrisma(account),
    })

    return account
  }
}
