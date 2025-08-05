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

    sut = new CreateSurveyUseCase(
      inMemorySurveyRepository,
      inMemoryQuestionRepository,
      inMemoryOptionAnswerRepository,
    )
  })

  it('should create a survey with questions and options', async () => {
    const account = makeAccount()

    const result = await sut.execute({
      title: 'Favorite programming language?',
      location: 'Global',
      type: 'multiple-choice',
      accountId: account.id.toString(),
      questions: [
        {
          questionTitle: 'Which language do you prefer?',
          questionNum: 1,
          options: [
            { optionTitle: 'JavaScript', optionNum: 1 },
            { optionTitle: 'TypeScript', optionNum: 2 },
            { optionTitle: 'Python', optionNum: 3 },
          ],
        },
      ],
    })

    expect(result.isRight()).toBe(true)

    // Verifica se survey foi criado
    expect(inMemorySurveyRepository.items).toHaveLength(1)
    expect(inMemorySurveyRepository.items[0].title).toBe(
      'Favorite programming language?',
    )

    // Verifica se pergunta foi criada
    expect(inMemoryQuestionRepository.items).toHaveLength(1)
    expect(inMemoryQuestionRepository.items[0].questionTitle).toBe(
      'Which language do you prefer?',
    )

    // Verifica se opções foram criadas
    expect(inMemoryOptionAnswerRepository.items).toHaveLength(3)
    expect(
      inMemoryOptionAnswerRepository.items.map((opt) => opt.optionTitle),
    ).toEqual(['JavaScript', 'TypeScript', 'Python'])
  })
})
