import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Either, left, right } from '@/core/types/either'
import { ConditionalRule } from '@/domain/entities/conditional-rule'
import { OptionAnswer } from '@/domain/entities/option-answer'
import { Question } from '@/domain/entities/question'
import { Survey } from '@/domain/entities/survey'
import { CompleteSurveyRepository } from '@/domain/repositories/complete-survey-repository'
import { Injectable } from '@nestjs/common'
import { InvalidSurveyStructureError } from '../error/invalid-survey-structure.error'
import { PersistenceConflictError } from '../error/persistence-conflict.error'

export interface CompleteSurveyQuestionInput {
  questionTitle: string
  questionNum: number
  options: { optionTitle: string; optionNum: number }[]
  conditionalRules?: {
    dependsOnQuestionNumber: number
    dependsOnOptionNumber: number
  }[]
}

interface CreateCompleteSurveyRequest {
  title: string
  location: string
  type: string
  accountId: string
  questions?: CompleteSurveyQuestionInput[]
}

type CreateCompleteSurveyResponse = Either<
  InvalidSurveyStructureError | PersistenceConflictError,
  { survey: Survey }
>

@Injectable()
export class CreateCompleteSurveyUseCase {
  constructor(private repository: CompleteSurveyRepository) {}

  async execute(
    input: CreateCompleteSurveyRequest,
  ): Promise<CreateCompleteSurveyResponse> {
    const validationError = this.validate(input)
    if (validationError) return left(validationError)

    const accountId = new UniqueEntityID(input.accountId)
    const survey = Survey.create({
      title: input.title,
      location: input.location,
      type: input.type,
      accountId,
    })
    const questionsByNumber = new Map<number, Question>()
    const optionsByQuestionNumber = new Map<number, Map<number, OptionAnswer>>()

    for (const item of input.questions ?? []) {
      const question = Question.create({
        questionTitle: item.questionTitle,
        questionNum: item.questionNum,
        surveyId: survey.id,
        accountId,
      })
      questionsByNumber.set(item.questionNum, question)
      optionsByQuestionNumber.set(
        item.questionNum,
        new Map(
          item.options.map((itemOption) => {
            const option = OptionAnswer.create({
              optionTitle: itemOption.optionTitle,
              optionNum: itemOption.optionNum,
              questionId: question.id,
              accountId,
            })
            return [itemOption.optionNum, option]
          }),
        ),
      )
    }

    const conditionalRules: ConditionalRule[] = []
    for (const item of input.questions ?? []) {
      const question = questionsByNumber.get(item.questionNum)!
      for (const rule of item.conditionalRules ?? []) {
        const dependsOnQuestion = questionsByNumber.get(
          rule.dependsOnQuestionNumber,
        )!
        const dependsOnOption = optionsByQuestionNumber
          .get(rule.dependsOnQuestionNumber)!
          .get(rule.dependsOnOptionNumber)!
        conditionalRules.push(
          ConditionalRule.create({
            questionId: question.id,
            dependsOnQuestionId: dependsOnQuestion.id,
            dependsOnQuestionNumber: rule.dependsOnQuestionNumber,
            dependsOnOptionId: dependsOnOption.id,
            dependsOnOptionNumber: rule.dependsOnOptionNumber,
            surveyId: survey.id,
          }),
        )
      }
    }

    try {
      await this.repository.createComplete({
        survey,
        questions: [...questionsByNumber.values()],
        options: [...optionsByQuestionNumber.values()].flatMap((items) => [
          ...items.values(),
        ]),
        conditionalRules,
      })
    } catch (error) {
      if (error instanceof PersistenceConflictError) return left(error)
      throw error
    }

    return right({ survey })
  }

  private validate(
    input: CreateCompleteSurveyRequest,
  ): InvalidSurveyStructureError | null {
    if (
      ![input.title, input.location, input.type].every((value) => value.trim())
    ) {
      return new InvalidSurveyStructureError('Survey fields cannot be empty')
    }

    const questionNumbers = new Set<number>()
    for (const question of input.questions ?? []) {
      if (
        !question.questionTitle.trim() ||
        !Number.isInteger(question.questionNum) ||
        question.questionNum < 1
      ) {
        return new InvalidSurveyStructureError('Invalid question')
      }
      if (questionNumbers.has(question.questionNum)) {
        return new InvalidSurveyStructureError('Duplicate question number')
      }
      questionNumbers.add(question.questionNum)

      const optionNumbers = new Set<number>()
      for (const option of question.options) {
        if (
          !option.optionTitle.trim() ||
          !Number.isInteger(option.optionNum) ||
          option.optionNum < 1
        ) {
          return new InvalidSurveyStructureError('Invalid option')
        }
        if (optionNumbers.has(option.optionNum)) {
          return new InvalidSurveyStructureError('Duplicate option number')
        }
        optionNumbers.add(option.optionNum)
      }
    }

    const questions = new Map(
      (input.questions ?? []).map((question) => [
        question.questionNum,
        question,
      ]),
    )
    for (const question of input.questions ?? []) {
      for (const rule of question.conditionalRules ?? []) {
        const dependency = questions.get(rule.dependsOnQuestionNumber)
        if (
          !dependency ||
          dependency.questionNum === question.questionNum ||
          !dependency.options.some(
            (option) => option.optionNum === rule.dependsOnOptionNumber,
          )
        ) {
          return new InvalidSurveyStructureError(
            'Conditional rule target does not exist',
          )
        }
      }
    }
    return null
  }
}
