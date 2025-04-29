import { Prisma, Interview as PrismaInterview } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Interview } from '@/domain/entities/interview'

export class PrismaInterviewMapper {
  static toDomain(raw: PrismaInterview): Interview {
    return Interview.create(
      {
        surveyId: new UniqueEntityID(raw.surveyId),
        accountId: new UniqueEntityID(raw.userId),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(interview: Interview): Prisma.InterviewUncheckedCreateInput {
    return {
      id: interview.id.toString(),
      surveyId: interview.surveyId.toString(),
      userId: interview.accountId.toString(),
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    }
  }
}
