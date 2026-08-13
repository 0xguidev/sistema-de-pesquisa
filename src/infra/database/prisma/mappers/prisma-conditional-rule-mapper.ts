import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ConditionalRule } from '@/domain/entities/conditional-rule'
import { ConditionalRule as PrismaConditional } from '@prisma/client'

export class PrismaConditionalRuleMapper {
  static toDomain(raw: PrismaConditional): ConditionalRule {
    return ConditionalRule.create(
      {
        questionId: new UniqueEntityID(raw.questionId),
        dependsOnQuestionId: new UniqueEntityID(raw.dependsOnQuestionId),
        dependsOnQuestionNumber: raw.dependsOnQuestionNumber,
        dependsOnOptionId: new UniqueEntityID(raw.dependsOnOptionId),
        dependsOnOptionNumber: raw.dependsOnOptionNumber,
        surveyId: new UniqueEntityID(raw.surveyId),
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(rule: ConditionalRule, dependsOnOptionId: string): any {
    return {
      id: rule.id.toString(),
      questionId: rule.questionId.toString(),
      dependsOnQuestionId: rule.dependsOnQuestionId.toString(),
      dependsOnQuestionNumber: rule.dependsOnQuestionNumber,
      dependsOnOptionId,
      dependsOnOptionNumber: rule.dependsOnOptionNumber,
      surveyId: rule.surveyId.toString(),
    }
  }
}
