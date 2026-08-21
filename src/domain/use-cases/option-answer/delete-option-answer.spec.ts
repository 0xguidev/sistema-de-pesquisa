import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { DeleteOptionAnswerUseCase } from './delete-option-answer'
import { makeOptionAnswer } from 'test/factories/make-option-answer'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let sut: DeleteOptionAnswerUseCase

describe('Delete an optionanswer', () => {
  beforeEach(() => {
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()

    sut = new DeleteOptionAnswerUseCase(inMemoryOptionAnswersRepository)
  })

  it('should delete an optionanswer', async () => {
    const optionAnswer = makeOptionAnswer()

    await inMemoryOptionAnswersRepository.create(optionAnswer)

    const result = await sut.execute({
      optionAnswerId: optionAnswer.id.toString(),
      accountId: optionAnswer.accountId.toString(),
    })

    expect(inMemoryOptionAnswersRepository.items).toHaveLength(0)
    expect(result.isRight()).toBe(true)
  })

  it('returns not found for a missing option', async () => {
    const result = await sut.execute({
      optionAnswerId: 'missing',
      accountId: 'owner',
    })
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('does not reveal another account option', async () => {
    const option = makeOptionAnswer()
    await inMemoryOptionAnswersRepository.create(option)
    const result = await sut.execute({
      optionAnswerId: option.id.toString(),
      accountId: 'attacker',
    })
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    expect(inMemoryOptionAnswersRepository.items).toHaveLength(1)
  })
})
