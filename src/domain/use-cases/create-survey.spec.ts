import { InMemorSurveyRepository } from 'src/test/repositories/in-memory-survey-repository'
import { CreateSurvey } from './create-survey'

let inMemorySurveyRepository = new InMemorSurveyRepository()

describe('CreateSurvey', () => {
  beforeEach(() => {
    inMemorySurveyRepository = new InMemorSurveyRepository()
  })

  it('should create a survey', async () => {
    const createSurvey = new CreateSurvey(inMemorySurveyRepository)

    const createdSurvey = await createSurvey.execute({
      title: 'What is your favorite color?',
    })

    expect(createdSurvey.isRight()).toBe(true)
    expect(inMemorySurveyRepository.items[0]).toEqual(
      createdSurvey.value?.survey,
    )
  })
})
