import { Interview } from '@/domain/entities/interview'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaInterviewMapper } from '../mappers/prisma-interview-mapper'
import { PrismaInterviewListMapper } from '../mappers/prisma-interviews-list-mapper'

@Injectable()
export class PrismaInterviewRepository implements InterviewRepository {
  constructor(private prisma: PrismaService) {}

  async findBySurveyId(
    surveyId: string,
    accountId: string,
    page: number,
    limit: number,
  ): Promise<{
    data: any[]
    total: number
  }> {
    const [interviewsFromDb, total] = await Promise.all([
      this.prisma.interview.findMany({
        where: {
          surveyId,
          userId: accountId,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          answer_questions: {
            include: {
              question: true,
              optionAnswer: true,
            },
          },
        },
      }),
      this.prisma.interview.count({
        where: {
          surveyId,
          userId: accountId,
        },
      }),
    ])

    const data = interviewsFromDb.map((interview) =>
      PrismaInterviewListMapper.toDomain(interview),
    )

    return { data, total }
  }

  async create(interview: Interview): Promise<void> {
    const data = PrismaInterviewMapper.toPrisma(interview)

    await this.prisma.interview.create({
      data,
    })
  }

  async findById(id: string): Promise<Interview | null> {
    const interview = await this.prisma.interview.findUnique({
      where: {
        id,
      },
    })

    if (!interview) {
      return null
    }

    return PrismaInterviewMapper.toDomain(interview)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.interview.delete({
      where: {
        id,
      },
    })
  }

  async update(interview: Interview): Promise<void> {
    const data = PrismaInterviewMapper.toPrisma(interview)

    await this.prisma.interview.update({
      where: {
        id: interview.id.toString(),
      },
      data,
    })
  }
}
