import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Slug } from '@/domain/entities/value-objects/slug'
import {
  Question as PrismaQuestion,
  OptionAnswer as PrismaOptionAnswer,
  ConditionalRule as PrismaConditionalRule,
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
    questions: (PrismaQuestion & {
      option_answers: PrismaOptionAnswer[]
      conditionalRules: (PrismaConditionalRule & {
        dependsOnQuestion: PrismaQuestion
        dependsOnOption: PrismaOptionAnswer
      })[]
    })[]
  }): any {
    return {
      survey: {
        id: new UniqueEntityID(raw.id).toValue(),
        title: raw.title,
        location: raw.location,
        type: raw.type,
        slug: Slug.create(raw.slug),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        questions: raw.questions.map((question) => {
          return {
            id: new UniqueEntityID(question.id).toValue(),
            questionTitle: question.title,
            questionNum: question.number,
            surveyId: new UniqueEntityID(question.surveyId).toValue(),
            slug: Slug.create(question.slug),
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
            options: question.option_answers.map((option) => {
              return {
                id: new UniqueEntityID(option.id).toValue(),
                optionTitle: option.option,
                optionNum: option.number,
              }
            }),
            conditionalRules: question.conditionalRules.map((rule) => {
              return {
                questionNum: rule.dependsOnQuestion.number,
                optionNum: rule.dependsOnOption.number,
              }
            }),
          }
        }),
      },
    }
  }
}
