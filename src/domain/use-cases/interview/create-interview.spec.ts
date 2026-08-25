import { expect, beforeEach } from 'vitest'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { CreateInterviewUseCase } from './create-interview'
import { makeSurvey } from 'test/factories/make-survey'
import { InMemorySurveyRepository } from 'test/repositories/in-memory-survey-repository'
import { makeAccount } from 'test/factories/make-Account'
import { unwrapRight } from 'test/utils/either'

let inMemoryInterviewRepository: InMemoryInterviewRepository
let inMemorySurveyRepository: InMemorySurveyRepository
let sut: CreateInterviewUseCase

describe('Create interview', () => {
  beforeEach(() => {
    inMemoryInterviewRepository = new InMemoryInterviewRepository()
    inMemorySurveyRepository = new InMemorySurveyRepository()
    sut = new CreateInterviewUseCase(
      inMemoryInterviewRepository,
      inMemorySurveyRepository,
    )
  })

  it('should create a interview', async () => {
    const survey = makeSurvey()
    await inMemorySurveyRepository.create(survey)

    const createdInterview = await sut.execute({
      surveyId: survey.id.toString(),
      accountId: survey.accountId.toString(),
    })

    const { interview } = unwrapRight(createdInterview)
    expect(inMemoryInterviewRepository.items[0]).toEqual(interview)
  })

  it('should not create an interview for another account survey', async () => {
    const owner = makeAccount()
    const attacker = makeAccount()
    const survey = makeSurvey({ accountId: owner.id })
    await inMemorySurveyRepository.create(survey)

    const result = await sut.execute({
      surveyId: survey.id.toString(),
      accountId: attacker.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(inMemoryInterviewRepository.items).toHaveLength(0)
  })
})
