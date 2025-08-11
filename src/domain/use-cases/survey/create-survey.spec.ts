import { InMemorySurveyRepository } from 'test/repositories/in-memory-survey-repository'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { CreateSurveyUseCase } from './create-survey'
import { makeAccount } from 'test/factories/make-Account'
import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'

let inMemorySurveyRepository: InMemorySurveyRepository
let inMemoryQuestionRepository: InMemoryQuestionRepository
let inMemoryOptionAnswerRepository: InMemoryOptionAnswersRepository
let sut: CreateSurveyUseCase

describe('CreateSurveyUseCase', () => {
  beforeEach(() => {
    inMemorySurveyRepository = new InMemorySurveyRepository()
    inMemoryQuestionRepository = new InMemoryQuestionRepository()
    inMemoryOptionAnswerRepository = new InMemoryOptionAnswersRepository()

    sut = new CreateSurveyUseCase(inMemorySurveyRepository)
  })

  it('should create a survey with questions and options', async () => {
    const account = makeAccount()

    const result = await sut.execute({
      title: 'Favorite programming language?',
      location: 'Global',
      type: 'multiple-choice',
      accountId: account.id.toString(),
    })

    expect(result.isRight()).toBe(true)

    // Verifica se survey foi criado
    expect(inMemorySurveyRepository.items).toHaveLength(1)
    expect(inMemorySurveyRepository.items[0].title).toBe(
      'Favorite programming language?',
    )
  })
})
