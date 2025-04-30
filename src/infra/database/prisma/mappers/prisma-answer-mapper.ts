import { Prisma, AnswerQuestion as PrismaAnswer } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AnswerQuestion } from '@/domain/entities/answer-question'

export class PrismaAnswerMapper {
  static toDomain(raw: PrismaAnswer): AnswerQuestion {
    return AnswerQuestion.create(
      {
        optionAnswerId: new UniqueEntityID(raw.optionAnswerId),
        interviewId: new UniqueEntityID(raw.interviewId),
        questionId: new UniqueEntityID(raw.questionId),
        accountId: new UniqueEntityID(raw.userId),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    answer: AnswerQuestion,
  ): Prisma.AnswerQuestionUncheckedCreateInput {
    return {
      interviewId: answer.interviewId.toString(),
      questionId: answer.questionId.toString(),
      optionAnswerId: answer.optionAnswerId.toString(),
      id: answer.id.toString(),
      userId: answer.accountId.toString(),
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
    }
  }
}
