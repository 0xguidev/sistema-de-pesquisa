import { AnswerQuestion } from '@/domain/entities/answer-question'
import { AnswerQuestionRepository } from '@/domain/repositories/answer-question-repository'
import { Injectable } from '@nestjs/common'
import { PrismaAnswerMapper } from '../mappers/prisma-answer-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaAnswerQuestionRepository
  implements AnswerQuestionRepository
{
  constructor(private prisma: PrismaService) {}
  async create(answerQuestion: AnswerQuestion): Promise<void> {
    const data = PrismaAnswerMapper.toPrisma(answerQuestion)

    await this.prisma.answerQuestion.create({
      data,
    })
  }
  async findById(id: string): Promise<AnswerQuestion | null> {
    const answer = await this.prisma.answerQuestion.findUnique({
      where: {
        id,
      },
    })

    if (!answer) {
      return null
    }

    return PrismaAnswerMapper.toDomain(answer)
  }
  async delete(id: string): Promise<void> {
    await this.prisma.answerQuestion.delete({
      where: {
        id,
      },
    })
  }
  async update(answerQuestion: AnswerQuestion): Promise<void> {
    const data = PrismaAnswerMapper.toPrisma(answerQuestion)

    await this.prisma.answerQuestion.update({
      where: {
        id: answerQuestion.id.toString(),
      },
      data,
    })
  }
}
