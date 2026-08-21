import { expect, beforeEach } from 'vitest'
import { InMemoryQuestionRepository } from '../../../../test/repositories/in-memory-question-repository'
import { InMemoryOptionAnswersRepository } from '../../../../test/repositories/in-memory-option-answer-repository'
import { CreateQuestionUseCase } from './create-question'
import { makeAccount } from 'test/factories/make-Account'
import { makeSurvey } from 'test/factories/make-survey'
import { makeQuestion } from 'test/factories/make-question'
import { makeOptionAnswer } from 'test/factories/make-option-answer'
import { InMemorySurveyRepository } from 'test/repositories/in-memory-survey-repository'
import { unwrapRight } from 'test/utils/either'

let inMemoryQuestionRepository: InMemoryQuestionRepository
let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let inMemorySurveyRepository: InMemorySurveyRepository
let sut: CreateQuestionUseCase

describe('Create question', () => {
  beforeEach(() => {
    inMemoryQuestionRepository = new InMemoryQuestionRepository()
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
    inMemorySurveyRepository = new InMemorySurveyRepository()

    sut = new CreateQuestionUseCase(
      inMemoryQuestionRepository,
      inMemoryOptionAnswersRepository,
      inMemorySurveyRepository,
    )
  })

  it('should create a question', async () => {
    const account = makeAccount()

    const survey = makeSurvey({ accountId: account.id })
    await inMemorySurveyRepository.create(survey)

    const createdQuestion = await sut.execute({
      questionTitle: 'What is your favorite color?',
      questionNum: 1,
      accountId: account.id.toString(),
      surveyId: survey.id.toString(),
    })

    const { question } = unwrapRight(createdQuestion)
    expect(question.questionTitle).toBe('What is your favorite color?')
    expect(question.questionNum).toBe(1)
    expect(question.accountId.toString()).toBe(account.id.toString())
    expect(question.surveyId.toString()).toBe(survey.id.toString())
  })

  it('should create a question with conditional rules', async () => {
    const account = makeAccount()

    const survey = makeSurvey({ accountId: account.id })
    await inMemorySurveyRepository.create(survey)

    const dependsOnQuestion = makeQuestion({
      surveyId: survey.id,
      questionNum: 1,
      accountId: account.id,
    })

    await inMemoryQuestionRepository.create(dependsOnQuestion)

    const optionAnswer = makeOptionAnswer({
      questionId: dependsOnQuestion.id,
      optionNum: 1,
      accountId: account.id,
    })

    await inMemoryOptionAnswersRepository.create(optionAnswer)

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

    const { question } = unwrapRight(createdQuestion)
    expect(inMemoryQuestionRepository.items[1]).toEqual(question)
    expect(inMemoryQuestionRepository.conditionalRules).toHaveLength(1)
  })

  it('should return an error if dependsOnQuestion is not found', async () => {
    const account = makeAccount()

    const survey = makeSurvey({ accountId: account.id })
    await inMemorySurveyRepository.create(survey)

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
    expect(inMemoryQuestionRepository.items).toHaveLength(0)
  })

  it('should not create a question in another account survey', async () => {
    const owner = makeAccount()
    const attacker = makeAccount()
    const survey = makeSurvey({ accountId: owner.id })
    await inMemorySurveyRepository.create(survey)

    const result = await sut.execute({
      questionTitle: 'Cross tenant question',
      questionNum: 1,
      surveyId: survey.id.toString(),
      accountId: attacker.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(inMemoryQuestionRepository.items).toHaveLength(0)
  })
})
