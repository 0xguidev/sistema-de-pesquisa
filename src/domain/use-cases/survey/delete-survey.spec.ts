import { InMemorySurveyRepository } from 'src/test/repositories/in-memory-survey-repository'
import { DeleteSurveyUseCase } from './delete-survey'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { makeSurvey } from 'src/test/factories/make-survey'

let inMemorySurveyRepository: InMemorySurveyRepository
let sut: DeleteSurveyUseCase

describe('Delete an survey', () => {
  beforeAll(() => {
    inMemorySurveyRepository = new InMemorySurveyRepository()

    sut = new DeleteSurveyUseCase(inMemorySurveyRepository)
  })

  it('should delete an survey', async () => {
    const survey = makeSurvey(
      { title: 'any_title' },
      new UniqueEntityID('survey_id'),
    )

    await inMemorySurveyRepository.create(survey)

    await sut.execute({ surveyId: survey.id })

    expect(inMemorySurveyRepository.items).toHaveLength(0)
  })
})
