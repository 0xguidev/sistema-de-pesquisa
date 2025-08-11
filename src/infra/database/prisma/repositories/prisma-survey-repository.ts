import { Survey } from '@/domain/entities/survey'
import { SurveyRepository } from '@/domain/repositories/survey-repository'
import { Injectable } from '@nestjs/common'
import { PrismaSurveyMapper } from '../mappers/prisma-survey-mapper'
import { PrismaService } from '../prisma.service'

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

  async findManyWithPagination(
    page: number,
    accountId: string
  ): Promise<{ id: string; title: string }[]> {
    const skip = (page - 1) * 10
    const take = 10

    const surveys = await this.prisma.survey.findMany({
      skip,
      take,
      select: {
        id: true,
        title: true,
      },
      where: {
        userId: accountId,
      },
    })

    return surveys.map((survey) => ({
      id: survey.id,
      title: survey.title,
    }))
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
