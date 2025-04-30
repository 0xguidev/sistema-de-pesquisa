import { OptionAnswer } from '@/domain/entities/option-answer'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaOptionAnswerMapper } from '../mappers/prisma-option-answer-mapper'

@Injectable()
export class PrismaOptionAnswerRepository implements OptionAnswerRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<OptionAnswer | null> {
    const optionAnswer = await this.prisma.optionAnswer.findUnique({
      where: {
        id,
      },
    })

    if (!optionAnswer) {
      return null
    }

    return PrismaOptionAnswerMapper.toDomain(optionAnswer)
  }

  async findManyByQuestionId(
    questionId: string,
  ): Promise<OptionAnswer[] | null> {
    const options = await this.prisma.optionAnswer.findMany({
      where: {
        questionId,
      },
    })
    if (!options) {
      return null
    }
    return options.map(PrismaOptionAnswerMapper.toDomain)
  }

  async create(optionanswer: OptionAnswer): Promise<void> {
    const data = PrismaOptionAnswerMapper.toPrisma(optionanswer)

    await this.prisma.optionAnswer.create({
      data,
    })
  }

  async save(optionanswer: OptionAnswer): Promise<void> {
    const data = PrismaOptionAnswerMapper.toPrisma(optionanswer)

    await this.prisma.optionAnswer.update({
      where: {
        id: data.id,
      },
      data,
    })
  }

  async delete(optionAnswer: OptionAnswer): Promise<void> {
    await this.prisma.optionAnswer.delete({
      where: {
        id: optionAnswer.id.toString(),
      },
    })
  }
}
