import { PrismaSurveyMapper } from '@/infra/database/prisma/mappers/prisma-survey-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Survey, SurveyProps } from 'src/domain/entities/survey'
import { makeQuestion } from './make-question'

export function makeSurvey(
  override: Partial<SurveyProps> = {},
  id?: UniqueEntityID,
) {
  const question1 = makeQuestion({ questionNum: 1 })
  const question2 = makeQuestion({ questionNum: 2 })
  const question3 = makeQuestion({ questionNum: 3 })

  const survey = Survey.create(
    {
      title: faker.lorem.sentence(),
      type: faker.lorem.word(),
      location: faker.lorem.word(),
      questions: [question1, question2, question3],
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
