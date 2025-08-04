import { InMemorySurveyRepository } from 'test/repositories/in-memory-survey-repository'
import { CreateSurveyUseCase } from './create-survey'
import { makeAccount } from 'test/factories/make-Account'
import { makeQuestion } from 'test/factories/make-question'

let inMemorySurveyRepository = new InMemorySurveyRepository()
let sut = new CreateSurveyUseCase(inMemorySurveyRepository)

describe('CreateSurvey', () => {
  beforeEach(() => {
    inMemorySurveyRepository = new InMemorySurveyRepository()
    sut = new CreateSurveyUseCase(inMemorySurveyRepository)
  })

  it('should create a survey', async () => {
    const account = makeAccount()
    const question1 =makeQuestion({questionNum: 1})
    const question2 =makeQuestion({questionNum: 2})
    const question3 =makeQuestion({questionNum: 3})

    const result = await sut.execute({
      title: 'What is your favorite color?',
      location: 'New York',
      type: 'multiple-choice',
      accountId: account.id.toString(),
      questions: [
        question1,
        question2,
        question3
      ]
    })

    expect(result.isRight()).toBe(true)
    expect(inMemorySurveyRepository.items[0]).toEqual(result.value?.survey)
  })
})
