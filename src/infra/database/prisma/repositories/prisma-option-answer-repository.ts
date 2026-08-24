import { OptionAnswer } from '@/domain/entities/option-answer'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaOptionAnswerMapper } from '../mappers/prisma-option-answer-mapper'

@Injectable()
export class PrismaOptionAnswerRepository implements OptionAnswerRepository {
  constructor(private prisma: PrismaService) {}

  async findById(
    optionId: string,
    accountId: string,
  ): Promise<OptionAnswer | null> {
    const optionAnswer = await this.prisma.optionAnswer.findUnique({
      where: {
        id_userId: { id: optionId, userId: accountId },
      },
    })

    if (!optionAnswer) {
      return null
    }

    return PrismaOptionAnswerMapper.toDomain(optionAnswer)
  }

  async findByIdAndQuestionIdAndAccountId(
    optionId: string,
    questionId: string,
    accountId: string,
  ): Promise<OptionAnswer | null> {
    const option = await this.prisma.optionAnswer.findUnique({
      where: {
        id_questionId_userId: {
          id: optionId,
          questionId,
          userId: accountId,
        },
      },
    })

    return option ? PrismaOptionAnswerMapper.toDomain(option) : null
  }

  async findManyByQuestionId(
    questionId: string,
    userId: string,
  ): Promise<OptionAnswer[]> {
    const options = await this.prisma.optionAnswer.findMany({
      where: {
        questionId,
        userId,
      },
    })
    return options.map(PrismaOptionAnswerMapper.toDomain)
  }

  async findOptionByQuestionIdAndOptionNum(
    questionId: string,
    optionNum: number,
  ): Promise<OptionAnswer | null> {
    const option = await this.prisma.optionAnswer.findFirst({
      where: {
        questionId,
        number: optionNum,
      },
    })

    if (!option) {
      return null
    }

    return PrismaOptionAnswerMapper.toDomain(option)
  }

  async findOptionByQuestionIdAndOptionNumAndAccountId(
    questionId: string,
    optionNum: number,
    accountId: string,
  ): Promise<OptionAnswer | null> {
    const option = await this.prisma.optionAnswer.findFirst({
      where: { questionId, number: optionNum, userId: accountId },
    })

    return option ? PrismaOptionAnswerMapper.toDomain(option) : null
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

  async deleteConditionalRulesByDependsOnOptionId(
    dependsOnOptionId: string,
  ): Promise<void> {
    await this.prisma.conditionalRule.deleteMany({
      where: {
        dependsOnOptionId,
      },
    })
  }
}
