import { Survey } from '@/domain/entities/survey'
import { SurveyRepository } from '@/domain/repositories/survey-repository'
import { Injectable } from '@nestjs/common'
import { PrismaSurveyMapper } from '../mappers/prisma-survey-mapper'
import { PrismaService } from '../prisma.service'
import { PrismaSurveyDetailsMapper } from '../mappers/prisma-survey-detailsMapper'
import { SurveyDetails } from '@/domain/use-cases/survey/interfaces/survey.interface'

@Injectable()
export class PrismaSurveyRepository implements SurveyRepository {
  constructor(private prisma: PrismaService) {}

  async create(survey: Survey): Promise<void> {
    const data = PrismaSurveyMapper.toPrisma(survey)

    await this.prisma.survey.create({
      data,
    })
  }

  async findById(id: string): Promise<Survey | null> {
    const survey = await this.prisma.survey.findUnique({
      where: {
        id,
      },
    })

    if (!survey) {
      return null
    }

    return PrismaSurveyMapper.toDomain(survey)
  }

  async findSurveydetails(
    id: string,
    accountId: string,
  ): Promise<SurveyDetails | null> {
    const survey = await this.prisma.survey.findUnique({
      where: {
        id,
        userId: accountId,
      },
      include: {
        questions: {
          include: {
            option_answers: true,
            conditionalRules: {
              include: {
                dependsOnQuestion: true,
                dependsOnOption: true,
              },
            },
          },
        },
      },
    })

    if (!survey) {
      return null
    }

    return PrismaSurveyDetailsMapper.toDomain(survey)
  }

  async findManyWithPagination(
    page: number,
    accountId: string,
  ): Promise<{ surveys: { id: string; title: string }[]; total: number }> {
    const skip = (page - 1) * 10
    const take = 10

    const [surveys, total] = await Promise.all([
      this.prisma.survey.findMany({
        skip,
        take,
        select: {
          id: true,
          title: true,
        },
        where: {
          userId: accountId,
        },
      }),
      this.prisma.survey.count({
        where: {
          userId: accountId,
        },
      }),
    ])

    return {
      surveys: surveys.map((survey) => ({
        id: survey.id,
        title: survey.title,
      })),
      total,
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.survey.delete({
      where: {
        id,
      },
    })
  }

  async update(survey: Survey): Promise<void> {
    const data = PrismaSurveyMapper.toPrisma(survey)

    await this.prisma.survey.update({
      where: {
        id: survey.id.toString(),
      },
      data,
    })
  }
}
