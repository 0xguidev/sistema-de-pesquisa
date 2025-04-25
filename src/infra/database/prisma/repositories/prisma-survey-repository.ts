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

  async delete(id: string): Promise<void> {
    await this.prisma.survey.delete({
      where: {
        id,
      },
    })
  }
  async update(question: Survey): Promise<void> {
    const data = PrismaSurveyMapper.toPrisma(question)

    await this.prisma.survey.update({
      where: {
        id: question.id.toString(),
      },
      data,
    })
  }
}
