import { InMemoryQuestionRepository } from 'src/test/repositories/in-memory-question-repository'
import { DeleteQuestionUseCase } from './delete-question'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { makeQuestion } from 'src/test/factories/make-question'

let inMemoryQuestionRepository: InMemoryQuestionRepository
let sut: DeleteQuestionUseCase

describe('Delete an question', () => {
  beforeAll(() => {
    inMemoryQuestionRepository = new InMemoryQuestionRepository()

    sut = new DeleteQuestionUseCase(inMemoryQuestionRepository)
  })

  it('should delete an question', async () => {
    const question = makeQuestion(
      { questionTitle: 'any_title', questionNum: 1 },
      new UniqueEntityID('question_id'),
    )

    await inMemoryQuestionRepository.create(question)

    await sut.execute({ questionId: question.id })

    expect(inMemoryQuestionRepository.items).toHaveLength(0)
  })
})
