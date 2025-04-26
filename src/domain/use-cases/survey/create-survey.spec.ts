import { InMemorySurveyRepository } from 'test/repositories/in-memory-survey-repository'
import { CreateSurveyUseCase } from './create-survey'
import { makeAccount } from 'test/factories/make-Account'

let inMemorySurveyRepository = new InMemorySurveyRepository()
let sut = new CreateSurveyUseCase(inMemorySurveyRepository)

describe('CreateSurvey', () => {
  beforeEach(() => {
    inMemorySurveyRepository = new InMemorySurveyRepository()
    sut = new CreateSurveyUseCase(inMemorySurveyRepository)
  })

  it('should create a survey', async () => {
    const account = makeAccount()

    const result = await sut.execute({
      title: 'What is your favorite color?',
      location: 'New York',
      type: 'multiple-choice',
      accountId: account.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(inMemorySurveyRepository.items[0]).toEqual(result.value?.survey)
  })
})
