import { expect, beforeEach } from 'vitest'
import { InMemoryQuestionRepository } from '../../../../test/repositories/in-memory-question-repository'
import { CreateQuestionUseCase } from './create-question'
import { makeAccount } from 'test/factories/make-Account'
import { makeSurvey } from 'test/factories/make-survey'
import { makeQuestion } from 'test/factories/make-question'

let inMemoryQuestionRepository: InMemoryQuestionRepository
let sut: CreateQuestionUseCase

describe('create an question', async () => {
  beforeEach(() => {
    inMemoryQuestionRepository = new InMemoryQuestionRepository()

    sut = new CreateQuestionUseCase(inMemoryQuestionRepository)
  })

  it('should create a question', async () => {
    const account = makeAccount()

    const survey = makeSurvey()

    const createdQuestion = await sut.execute({
      questionTitle: 'What is your favorite color?',
      questionNum: 1,
      accountId: account.id.toString(),
      surveyId: survey.id.toString(),
    })

    expect(createdQuestion.isRight()).toBe(true)

    if (createdQuestion.isRight()) {
      expect(createdQuestion.value.question.questionTitle).toBe(
        'What is your favorite color?',
      )
      expect(createdQuestion.value.question.questionNum).toBe(1)
      expect(createdQuestion.value.question.accountId.toString()).toBe(
        account.id.toString(),
      )
      expect(createdQuestion.value.question.surveyId.toString()).toBe(
        survey.id.toString(),
      )
    }
  })

  it('should create a question with conditional rules', async () => {
    const account = makeAccount()

    const survey = makeSurvey({ accountId: account.id })

    const dependsOnQuestion = makeQuestion({
      surveyId: survey.id,
      questionNum: 1,
    })

    await inMemoryQuestionRepository.create(dependsOnQuestion)

    const createdQuestion = await sut.execute({
      questionTitle: 'What is your favorite color?',
      questionNum: 2,
      accountId: account.id.toString(),
      surveyId: survey.id.toString(),
      conditionalRules: [
        {
          dependsOnQuestionNumber: dependsOnQuestion.questionNum,
          dependsOnOptionNumber: 1,
        },
      ],
    })

    expect(createdQuestion.isRight()).toBe(true)

    if (createdQuestion.isRight()) {
      expect(inMemoryQuestionRepository.items[1]).toEqual(
        createdQuestion.value.question,
      )
      expect(inMemoryQuestionRepository.conditionalRules.length).toBe(1)
    }
  })

  it('should return an error if dependsOnQuestion is not found', async () => {
    const account = makeAccount()

    const survey = makeSurvey()

    const createdQuestion = await sut.execute({
      questionTitle: 'What is your favorite color?',
      questionNum: 1,
      accountId: account.id.toString(),
      surveyId: survey.id.toString(),
      conditionalRules: [
        {
          dependsOnQuestionNumber: 2,
          dependsOnOptionNumber: 1,
        },
      ],
    })

    expect(createdQuestion.isLeft()).toBe(true)
  })
})
