import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { DeleteQuestionUseCase } from './delete-question'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeQuestion } from 'test/factories/make-question'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let inMemoryQuestionRepository: InMemoryQuestionRepository
let sut: DeleteQuestionUseCase

describe('Delete an question', () => {
  beforeEach(() => {
    inMemoryQuestionRepository = new InMemoryQuestionRepository()

    sut = new DeleteQuestionUseCase(inMemoryQuestionRepository)
  })

  it('should delete an question', async () => {
    const question = makeQuestion(
      { questionTitle: 'any_title', questionNum: 1 },
      new UniqueEntityID('question_id'),
    )

    await inMemoryQuestionRepository.create(question)

    const result = await sut.execute({
      questionId: question.id.toString(),
      accountId: question.accountId.toString(),
    })

    expect(inMemoryQuestionRepository.items).toHaveLength(0)
    expect(result.isRight()).toBe(true)
  })

  it('returns not found for a missing question', async () => {
    const result = await sut.execute({
      questionId: 'missing',
      accountId: 'owner',
    })
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('does not delete another account question', async () => {
    const question = makeQuestion()
    await inMemoryQuestionRepository.create(question)
    const result = await sut.execute({
      questionId: question.id.toString(),
      accountId: 'attacker',
    })
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryQuestionRepository.items).toHaveLength(1)
  })
})
