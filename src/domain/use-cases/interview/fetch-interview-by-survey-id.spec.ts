import { makeInterview } from 'test/factories/make-interview'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { FetchInterviewsBySurveyIdUseCase } from './fetch-interview-by-survey-id'
import { makeAccount } from 'test/factories/make-Account'
import { makeSurvey } from 'test/factories/make-survey'

let inMemoryInterviewsRepository: InMemoryInterviewRepository
let sut: FetchInterviewsBySurveyIdUseCase

describe('Fetch Interviews by Survey ID', () => {
  beforeEach(() => {
    inMemoryInterviewsRepository = new InMemoryInterviewRepository()
    sut = new FetchInterviewsBySurveyIdUseCase(inMemoryInterviewsRepository)
  })

  it('should be able to fetch interviews by surveyId with pagination', async () => {
    const accountId = makeAccount().id
    const surveyId = makeSurvey({ accountId }).id
    const interview1 = makeInterview({ surveyId, accountId })
    const interview2 = makeInterview({ surveyId, accountId })

    await inMemoryInterviewsRepository.create(interview1)
    await inMemoryInterviewsRepository.create(interview2)

    const result = await sut.execute({
      surveyId: surveyId.toString(),
      accountId: accountId.toString(),
      page: 1,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.interviews).toHaveLength(2)
    }
  })

  it('should return an empty array if no interviews match the surveyId', async () => {
    const result = await sut.execute({
      surveyId: 'non-existent-survey',
      accountId: 'account-1',
      page: 1,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.interviews).toHaveLength(0)
    }
  })

  it('should be able to fetch interviews with correct pagination', async () => {
    const accountId = makeAccount().id
    const surveyId = makeSurvey({ accountId }).id

    for (let i = 0; i < 15; i++) {
      const interview = makeInterview({
        surveyId,
        accountId,
      })
      await inMemoryInterviewsRepository.create(interview)
    }

    const resultPage1 = await sut.execute({
      surveyId: surveyId.toString(),
      accountId: accountId.toString(),
      page: 1,
      limit: 10,
    })

    const resultPage2 = await sut.execute({
      surveyId: surveyId.toString(),
      accountId: accountId.toString(),
      page: 2,
      limit: 10,
    })

    expect(resultPage1.isRight()).toBe(true)
    expect(resultPage2.isRight()).toBe(true)

    if (resultPage1.isRight() && resultPage2.isRight()) {
      expect(resultPage1.value.interviews).toHaveLength(10)
      expect(resultPage2.value.interviews).toHaveLength(5)
      expect(resultPage1.value.totalPages).toBe(2)
    }
  })
})
