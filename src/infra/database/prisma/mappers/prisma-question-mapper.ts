import { Prisma, Question as PrismaQuestion } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Question } from '@/domain/entities/question'
import { Slug } from '@/domain/entities/value-objects/slug'

export class PrismaQuestionMapper {
  static toDomain(raw: PrismaQuestion): Question {
    return Question.create(
      {
        questionTitle: raw.title,
        questionNum: raw.number,
        surveyId: new UniqueEntityID(raw.surveyId),
        accountId: new UniqueEntityID(raw.userId),
        slug: Slug.create(raw.slug),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
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
