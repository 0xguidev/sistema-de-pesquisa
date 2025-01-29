import { InMemorySurveyRepository } from 'src/test/repositories/in-memory-survey-repository'
import { CreateSurveyUseCase } from './create-survey'

let inMemorySurveyRepository = new InMemorySurveyRepository()

describe('CreateSurvey', () => {
  beforeEach(() => {
    inMemorySurveyRepository = new InMemorySurveyRepository()
  })

  it('should create a survey', async () => {
    const createSurvey = new CreateSurveyUseCase(inMemorySurveyRepository)

    const createdSurvey = await createSurvey.execute({
      title: 'What is your favorite color?',
    })

    expect(createdSurvey.isRight()).toBe(true)
    expect(inMemorySurveyRepository.items[0]).toEqual(
      createdSurvey.value?.survey,
    )
  })
})
