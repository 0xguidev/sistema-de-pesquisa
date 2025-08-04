import { Prisma, Question as PrismaQuestion } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Question } from '@/domain/entities/question'
import { Slug } from '@/domain/entities/value-objects/slug'

export class PrismaQuestionMapper {
  static toDomain(raw: PrismaQuestion): Question {
    return Question.create(
      {
        accountId: new UniqueEntityID(raw.userId),
        surveyId: new UniqueEntityID(raw.surveyId),
        slug: Slug.create(raw.slug),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        questionTitle: raw.title,
        questionNum: raw.number,
        options: raw.options
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(question: Question): Prisma.QuestionUncheckedCreateInput {
    return {
      id: question.id.toString(),
      userId: question.accountId.toString(),
      surveyId: question.surveyId.toString(),
      title: question.questionTitle,
      number: question.questionNum,
      slug: question.slug.value,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    }
  }
}
