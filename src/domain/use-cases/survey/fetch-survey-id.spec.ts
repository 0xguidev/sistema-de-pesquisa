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
    inMemorySurveysRepository.items[0].questions = []

    const existsSurvey = await sut.execute({
      surveyId: survey.id.toString(),
      accountId: account.id.toString(),
    })

    expect(existsSurvey.isRight()).toBe(true)
    if (!(existsSurvey.value instanceof Error)) {
      expect(inMemorySurveysRepository.items[0]).toEqual(
        existsSurvey.value.survey,
      )
    }
  })
})
