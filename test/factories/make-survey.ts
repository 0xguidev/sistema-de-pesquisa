import { PrismaSurveyMapper } from '@/infra/database/prisma/mappers/prisma-survey-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Survey, SurveyProps } from 'src/domain/entities/survey'

export function makeSurvey(
  override: Partial<SurveyProps> = {},
  id?: UniqueEntityID,
) {
  const survey = Survey.create(
    {
      title: faker.lorem.sentence(),
      type: faker.lorem.word(),
      location: faker.lorem.word(),
      accountId: new UniqueEntityID(),
      ...override,
    },
    id,
  )

  return survey
}

@Injectable()
export class SurveyFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaSurvey(data: Partial<Survey> = {}): Promise<Survey> {
    const survey = makeSurvey(data)

    await this.prisma.survey.create({
      data: PrismaSurveyMapper.toPrisma(survey),
    })

    return survey
  }
}
