import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Question } from '@/domain/entities/question'
import { QuestionRepository } from '@/domain/repositories/question-repository'
import { Injectable } from '@nestjs/common'
import { PrismaQuestionMapper } from '../mappers/prisma-question-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaQuestionRepository implements QuestionRepository {
  constructor(private prisma: PrismaService) {}

  async create(question: Question): Promise<void> {
    const data = PrismaQuestionMapper.toPrisma(question)

    await this.prisma.question.create({
      data,
    })
  }

  async findById(id: string): Promise<Question | null> {
    const question = await this.prisma.question.findUnique({
      where: {
        id,
      },
    })

    if (!question) {
      return null
    }

    return PrismaQuestionMapper.toDomain(question)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.question.delete({
      where: {
        id,
      },
    })
  }

  async update(question: Question): Promise<void> {
    const data = PrismaQuestionMapper.toPrisma(question)

    await this.prisma.question.update({
      where: {
        id: question.id.toString(),
      },
      data,
    })
  }
}
