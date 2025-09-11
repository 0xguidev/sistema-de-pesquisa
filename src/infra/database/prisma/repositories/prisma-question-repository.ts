import { Question } from '@/domain/entities/question'
import { QuestionRepository } from '@/domain/repositories/question-repository'
import { Injectable } from '@nestjs/common'
import { PrismaQuestionMapper } from '../mappers/prisma-question-mapper'
import { PrismaService } from '../prisma.service'
import { ConditionalRule } from '@/domain/entities/conditional-rule'
import { PrismaConditionalRuleMapper } from '../mappers/prisma-conditional-rule-mapper'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'

@Injectable()
export class PrismaQuestionRepository implements QuestionRepository {
  constructor(
    private prisma: PrismaService,
    private optionRepository: OptionAnswerRepository,
  ) {}

  async create(question: Question): Promise<void> {
    const data = PrismaQuestionMapper.toPrisma(question)

    await this.prisma.question.create({
      data,
    })
  }

  async findById(id: string): Promise<Question | null> {
    const question = await this.prisma.question.findUnique({
      where: {
        id,
      },
    })

    if (!question) {
      return null
    }

    return PrismaQuestionMapper.toDomain(question)
  }

  async findByQuestionNum(
    surveyId: string,
    questionNum: number,
  ): Promise<Question | null> {
    const question = await this.prisma.question.findFirst({
      where: {
        number: questionNum,
        surveyId,
      },
    })

    if (!question) {
      return null
    }

    return PrismaQuestionMapper.toDomain(question)
  }

  async findQuestionsBySurveyId(surveyId: string): Promise<Question[]> {
    const questions = await this.prisma.question.findMany({
      where: {
        surveyId,
      },
    })

    if (!questions) {
      return []
    }

    return questions.map(PrismaQuestionMapper.toDomain)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.question.delete({
      where: {
        id,
      },
    })
  }

  async update(question: Question): Promise<void> {
    const data = PrismaQuestionMapper.toPrisma(question)

    await this.prisma.question.update({
      where: {
        id: question.id.toString(),
      },
      data,
    })
  }

  async createConditionalRule(rule: ConditionalRule): Promise<void> {
    const dependsOnQuestion = await this.findByQuestionNum(
      rule.surveyId.toString(),
      rule.dependsOnQuestionNumber,
    )

    if (!dependsOnQuestion) {
      throw new Error('Pergunta dependente não encontrada')
    }

    const dependsOnOption =
      await this.optionRepository.findOptionByQuestionIdAndOptionNum(
        dependsOnQuestion.id.toString(),
        rule.dependsOnOptionNumber,
      )

    if (!dependsOnOption) {
      throw new Error('Opção dependente não encontrada')
    }

    const data = PrismaConditionalRuleMapper.toPrisma(
      rule,
      dependsOnOption.id.toString(),
    )

    await this.prisma.conditionalRule.create({
      data,
    })
  }

  async findConditionalRulesByQuestionId(
    questionId: string,
  ): Promise<ConditionalRule[]> {
    const rules = await this.prisma.conditionalRule.findMany({
      where: {
        questionId,
      },
    })

    return rules.map(PrismaConditionalRuleMapper.toDomain)
  }

  async deleteConditionalRule(id: string): Promise<void> {
    await this.prisma.conditionalRule.delete({
      where: {
        id,
      },
    })
  }

  async updateConditionalRule(rule: ConditionalRule): Promise<void> {
    const dependsOnQuestion = await this.findByQuestionNum(
      rule.surveyId.toString(),
      rule.dependsOnQuestionNumber,
    )

    if (!dependsOnQuestion) {
      throw new Error('Pergunta dependente não encontrada')
    }

    const dependsOnOption =
      await this.optionRepository.findOptionByQuestionIdAndOptionNum(
        dependsOnQuestion.id.toString(),
        rule.dependsOnOptionNumber,
      )

    if (!dependsOnOption) {
      throw new Error('Opção dependente não encontrada')
    }

    const data = PrismaConditionalRuleMapper.toPrisma(
      rule,
      dependsOnOption.id.toString(),
    )

    await this.prisma.conditionalRule.update({
      where: {
        id: rule.id.toString(),
      },
      data,
    })
  }
}
