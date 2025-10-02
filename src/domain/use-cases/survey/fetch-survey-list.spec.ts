import { makeSurvey } from 'test/factories/make-survey'
import { InMemorySurveyRepository } from 'test/repositories/in-memory-survey-repository'
import { FetchSurveyListUseCase } from './fetch-survey-list'
import { makeAccount } from 'test/factories/make-Account'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'

let inMemorySurveysRepository: InMemorySurveyRepository
let sut: FetchSurveyListUseCase

describe('Get Survey List', () => {
  beforeEach(() => {
    inMemorySurveysRepository = new InMemorySurveyRepository()
    sut = new FetchSurveyListUseCase(inMemorySurveysRepository)
  })

  it('Should be able to get a list of surveys', async () => {
    const account = makeAccount()

    for (let i = 0; i < 15; i++) {
      await inMemorySurveysRepository.create(makeSurvey({ accountId: new UniqueEntityID(account.id.toString()) }))
    }

    const result = await sut.execute({
      page: 1,
      accountId: account.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (!(result.value instanceof Error)) {
      expect(result.value.surveys.length).toBe(10)
    }
  })

  it('Should be able to get a list of surveys with pagination', async () => {
    const account = makeAccount()

    for (let i = 0; i < 15; i++) {
      await inMemorySurveysRepository.create(makeSurvey({ accountId: new UniqueEntityID(account.id.toString()) }))
    }

    const resultPage1 = await sut.execute({
      page: 1,
      accountId: account.id.toString(),
    })
    const resultPage2 = await sut.execute({
      page: 2,
      accountId: account.id.toString(),
    })

    expect(resultPage1.isRight()).toBe(true)
    expect(resultPage2.isRight()).toBe(true)

    if (
      !(resultPage1.value instanceof Error) &&
      !(resultPage2.value instanceof Error)
    ) {
      expect(resultPage1.value.surveys.length).toBe(10)
      expect(resultPage2.value.surveys.length).toBe(5)
    }
  })

  it('Should return an empty list if there are no surveys', async () => {
    const account = makeAccount()

    const result = await sut.execute({
      page: 1,
      accountId: account.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (!(result.value instanceof Error)) {
      expect(result.value.surveys.length).toBe(0)
    }
  })
})
