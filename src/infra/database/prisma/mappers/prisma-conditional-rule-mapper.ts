import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ConditionalRule } from '@/domain/entities/conditional-rule'
import { ConditionalRule as PrismaConditional, Prisma } from '@prisma/client'

export class PrismaConditionalRuleMapper {
  static toDomain(raw: PrismaConditional): ConditionalRule {
    return ConditionalRule.create(
      {
        questionId: new UniqueEntityID(raw.questionId),
        dependsOnQuestionId: new UniqueEntityID(raw.dependsOnQuestionId),
        dependsOnOptionId: new UniqueEntityID(raw.dependsOnOptionId),
        operator: raw.operator,
      },
      new UniqueEntityID(raw.id),
    )
  }
  static toPrisma(rule: ConditionalRule): Prisma.ConditionalRuleCreateInput {
    return {
      id: rule.id.toString(),
      question: { connect: { id: rule.questionId.toString() } },
      dependsOnQuestion: {
        connect: { id: rule.dependsOnQuestionId.toString() },
      },
      dependsOnOption: { connect: { id: rule.dependsOnOptionId.toString() } },
      operator: rule.operator,
    }
  }
}
