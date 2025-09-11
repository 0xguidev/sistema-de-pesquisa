import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ConditionalRule } from '@/domain/entities/conditional-rule'
import { ConditionalRule as PrismaConditional, Prisma } from '@prisma/client'

export class PrismaConditionalRuleMapper {
  static toDomain(raw: PrismaConditional): ConditionalRule {
    return ConditionalRule.create(
      {
        questionId: new UniqueEntityID(raw.questionId),
        dependsOnQuestionId: new UniqueEntityID(raw.dependsOnQuestionId),
        dependsOnQuestionNumber: raw.dependsOnQuestionNumber,
        dependsOnOptionNumber: raw.dependsOnOptionNumber,
        surveyId: new UniqueEntityID(raw.surveyId),
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(rule: ConditionalRule, dependsOnOptionId: string): any {
    return {
      id: rule.id.toString(),
      question: { connect: { id: rule.questionId.toString() } },
      dependsOnQuestion: {
        connect: { id: rule.dependsOnQuestionId.toString() },
      },
      dependsOnQuestionNumber: rule.dependsOnQuestionNumber,
      dependsOnOptionNumber: rule.dependsOnOptionNumber,
      survey: { connect: { id: rule.surveyId.toString() } },
      dependsOnOption: {
        connect: {
          id: dependsOnOptionId,
        },
      },
    }
  }
}
