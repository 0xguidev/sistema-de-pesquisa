import { InMemorySurveyRepository } from 'test/repositories/in-memory-survey-repository'
import { CreateSurveyUseCase } from './create-survey'

let inMemorySurveyRepository = new InMemorySurveyRepository()
let sut = new CreateSurveyUseCase(inMemorySurveyRepository)

describe('CreateSurvey', () => {
  beforeEach(() => {
    inMemorySurveyRepository = new InMemorySurveyRepository()
    sut = new CreateSurveyUseCase(inMemorySurveyRepository)
  })

  it('should create a survey', async () => {
    const result = await sut.execute({
      title: 'What is your favorite color?',
      location: 'New York',
      type: 'multiple-choice',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemorySurveyRepository.items[0]).toEqual(result.value?.survey)
  })
})
