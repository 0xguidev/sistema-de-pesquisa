import {
  CompleteSurvey,
  CompleteSurveyRepository,
} from '@/domain/repositories/complete-survey-repository'
import { PersistenceConflictError } from '@/domain/use-cases/error/persistence-conflict.error'
import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaConditionalRuleMapper } from '../mappers/prisma-conditional-rule-mapper'
import { PrismaOptionAnswerMapper } from '../mappers/prisma-option-answer-mapper'
import { PrismaQuestionMapper } from '../mappers/prisma-question-mapper'
import { PrismaSurveyMapper } from '../mappers/prisma-survey-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaCompleteSurveyRepository implements CompleteSurveyRepository {
  constructor(private prisma: PrismaService) {}

  async createComplete(data: CompleteSurvey): Promise<void> {
    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.survey.create({
          data: PrismaSurveyMapper.toPrisma(data.survey),
        })
        for (const question of data.questions) {
          await transaction.question.create({
            data: PrismaQuestionMapper.toPrisma(question),
          })
        }
        for (const option of data.options) {
          await transaction.optionAnswer.create({
            data: PrismaOptionAnswerMapper.toPrisma(option),
          })
        }
        for (const rule of data.conditionalRules) {
          await transaction.conditionalRule.create({
            data: PrismaConditionalRuleMapper.toPrisma(
              rule,
              rule.dependsOnOptionId.toString(),
            ),
          })
        }
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2003'].includes(error.code)
      ) {
        throw new PersistenceConflictError()
      }
      throw error
    }
  }
}
