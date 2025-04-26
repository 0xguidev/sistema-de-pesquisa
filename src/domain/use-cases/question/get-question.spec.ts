import { makeQuestion } from 'test/factories/make-question'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { GetQuestionUseCase } from './get-question'

let inMemoryQuestionsRepository: InMemoryQuestionRepository
let sut: GetQuestionUseCase

describe('Get Question', () => {
  beforeEach(() => {
    inMemoryQuestionsRepository = new InMemoryQuestionRepository()
    sut = new GetQuestionUseCase(inMemoryQuestionsRepository)
  })

  it('Should be able to get a question', async () => {
    const question = makeQuestion(
      { questionTitle: 'any_title', questionNum: 1 },
      new UniqueEntityID(),
    )

    await inMemoryQuestionsRepository.create(question)

    const existsQuestion = await sut.execute({
      questionId: question.id.toString(),
    })

    expect(existsQuestion.isRight()).toBe(true)
    if (!(existsQuestion.value instanceof Error)) {
      expect(inMemoryQuestionsRepository.items[0]).toEqual(
        existsQuestion.value.question,
      )
    }
  })
})
