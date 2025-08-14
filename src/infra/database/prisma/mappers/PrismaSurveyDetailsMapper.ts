import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Slug } from '@/domain/entities/value-objects/slug'
import {
  Survey as SurveyDetails,
  Question as PrismaQuestion,
  OptionAnswer as PrismaOptionAnswer,
} from '@prisma/client'

export class PrismaSurveyDetailsMapper {
  static toDomain(raw: {
    id: string
    title: string
    location: string
    type: string
    userId: string
    slug: string
    createdAt: Date
    updatedAt: Date | null
    questions: (PrismaQuestion & { option_answers: PrismaOptionAnswer[] })[]
  }): any {
    return {
      survey: {
        id: new UniqueEntityID(raw.id),
        title: raw.title,
        location: raw.location,
        type: raw.type,
        accountId: new UniqueEntityID(raw.userId),
        slug: Slug.create(raw.slug),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        questions: raw.questions.map((question) => {
          return {
            id: new UniqueEntityID(question.id),
            questionTitle: question.title,
            questionNum: question.number,
            accountId: new UniqueEntityID(question.userId),
            surveyId: new UniqueEntityID(question.surveyId),
            slug: Slug.create(question.slug),
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
            option_answers: question.option_answers.map((option) => {
              return {
                id: new UniqueEntityID(option.id),
                optionTitle: option.option,
                optionNum: option.number,
                questionId: new UniqueEntityID(option.questionId),
                accountId: new UniqueEntityID(option.userId),
                slug: Slug.create(option.slug),
                createdAt: option.createdAt,
                updatedAt: option.updatedAt,
              }
            }),
          }
        }),
      },
    }
  }
}
