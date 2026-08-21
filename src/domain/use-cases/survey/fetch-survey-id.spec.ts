import { makeSurvey } from 'test/factories/make-survey'
import { InMemorySurveyRepository } from 'test/repositories/in-memory-survey-repository'
import { FetchSurveyIdUseCase } from './fetch-survey-id'
import { makeAccount } from 'test/factories/make-Account'

let inMemorySurveysRepository: InMemorySurveyRepository
let sut: FetchSurveyIdUseCase

describe('Get Survey', () => {
  beforeEach(() => {
    inMemorySurveysRepository = new InMemorySurveyRepository()
    sut = new FetchSurveyIdUseCase(inMemorySurveysRepository)
  })

  it('Should be able to get a survey', async () => {
    const account = makeAccount()
    const survey = makeSurvey({ title: 'any_title', accountId: account.id })

    await inMemorySurveysRepository.create(survey)
    const existsSurvey = await sut.execute({
      surveyId: survey.id.toString(),
      accountId: account.id.toString(),
    })

    expect(existsSurvey.isRight()).toBe(true)
    if (!(existsSurvey.value instanceof Error)) {
      expect(existsSurvey.value.survey).toMatchObject({
        title: 'any_title',
        accountId: account.id.toString(),
        questions: [],
      })
    }
  })

  it('returns an error for a missing survey', async () => {
    const result = await sut.execute({
      surveyId: 'missing',
      accountId: 'account-1',
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(Error)
  })

  it('does not expose another account survey', async () => {
    const survey = makeSurvey()
    await inMemorySurveysRepository.create(survey)
    const result = await sut.execute({
      surveyId: survey.id.toString(),
      accountId: 'attacker',
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(Error)
  })
})
