import { makeSurvey } from 'src/test/factories/make-survey'
import { InMemorySurveyRepository } from 'src/test/repositories/in-memory-survey-repository'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { GetSurveyUseCase } from './get-survey'

let inMemorySurveysRepository: InMemorySurveyRepository
let sut: GetSurveyUseCase

describe('Get Survey', () => {
  beforeEach(() => {
    inMemorySurveysRepository = new InMemorySurveyRepository()
    sut = new GetSurveyUseCase(inMemorySurveysRepository)
  })

  it('Should be able to get a survey', async () => {
    const survey = makeSurvey(
      { title: 'any_title' },
      new UniqueEntityID(),
    )

    await inMemorySurveysRepository.create(survey)

    const existsSurvey = await sut.execute({
      surveyId: survey.id,
    })

    expect(existsSurvey.isRight()).toBe(true)
    if (!(existsSurvey.value instanceof Error)) {
      expect(inMemorySurveysRepository.items[0]).toEqual(
        existsSurvey.value.survey,
      )
    }
  })
})
