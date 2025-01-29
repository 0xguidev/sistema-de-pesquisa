import { makeSurvey } from 'src/test/factories/make-survey'
import { EditSurveyUseCase } from './edit-survey'
import { InMemorySurveyRepository } from 'src/test/repositories/in-memory-survey-repository'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'

let inMemorySurveysRepository: InMemorySurveyRepository
let sut: EditSurveyUseCase

describe('Edit Survey', () => {
  beforeEach(() => {
    inMemorySurveysRepository = new InMemorySurveyRepository()
    sut = new EditSurveyUseCase(inMemorySurveysRepository)
  })

  it('Should be able to edit a survey', async () => {
    const survey = makeSurvey(
      { title: 'any_title' },
      new UniqueEntityID(),
    )

    await inMemorySurveysRepository.create(survey)

    const editedSurvey = await sut.execute({
      surveyId: survey.id,
      surveyTitle: 'new_title',
    })

    expect(editedSurvey.isRight()).toBe(true)
    if ('survey' in editedSurvey.value) {
      expect(inMemorySurveysRepository.items[0]).toEqual(
        editedSurvey.value.survey,
      )
    }
  })
})
