import { Interview } from '@/domain/entities/interview'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaInterviewMapper } from '../mappers/prisma-interview-mapper'

@Injectable()
export class PrismaInterviewRepository implements InterviewRepository {
  constructor(private prisma: PrismaService) {}

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
