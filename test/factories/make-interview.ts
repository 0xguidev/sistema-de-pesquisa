import { PrismaInterviewMapper } from '@/infra/database/prisma/mappers/prisma-interview-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Interview, InterviewProps } from 'src/domain/entities/interview'

export function makeInterview(
  override: Partial<InterviewProps> = {},
  id?: UniqueEntityID,
) {
  const interview = Interview.create(
    {
      surveyId:  new UniqueEntityID(),
      accountId:  new UniqueEntityID(),
      ...override,
    },
    id,
  )

  return interview
}


@Injectable()
export class InterviewFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaInterview(
    data: Partial<Interview> = {},
  ): Promise<Interview> {
    const account = makeInterview(data)

    await this.prisma.interview.create({
      data: PrismaInterviewMapper.toPrisma(account),
    })

    return account
  }
}