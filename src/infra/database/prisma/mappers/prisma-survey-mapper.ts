import { Survey as PrismaSurvey, Prisma } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Survey } from '@/domain/entities/survey'
import { Slug } from '@/domain/entities/value-objects/slug'

export class PrismaSurveyMapper {
  static toDomain(raw: PrismaSurvey): Survey {
    return Survey.create(
      {
        title: raw.title,
        location: raw.location,
        type: raw.type,
        accountId: new UniqueEntityID(raw.userId),
        slug: Slug.create(raw.slug),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(survey: Survey): Prisma.SurveyUncheckedCreateInput {
    return {
      id: survey.id.toString(),
      userId: survey.accountId.toString(),
      slug: survey.slug.value,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
      title: survey.title,
      location: survey.location,
      type: survey.type,
    }
  }
}
