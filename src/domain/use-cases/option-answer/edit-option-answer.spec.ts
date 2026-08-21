import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { EditOptionAnswerUseCase } from './edit-option-answer'
import { makeOptionAnswer } from 'test/factories/make-option-answer'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let sut: EditOptionAnswerUseCase

describe('Edit OptionAnswer', () => {
  beforeEach(() => {
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
    sut = new EditOptionAnswerUseCase(inMemoryOptionAnswersRepository)
  })

  it('Should be able to edit a optionanswer', async () => {
    const optionAnswer = makeOptionAnswer()

    await inMemoryOptionAnswersRepository.create(optionAnswer)
    const save = vi.spyOn(inMemoryOptionAnswersRepository, 'save')

    const editedOptionAnswer = await sut.execute({
      optionId: optionAnswer.id.toString(),
      accountId: optionAnswer.accountId.toString(),
      optionTitle: 'new_title',
      optionNum: 2,
    })

    expect(editedOptionAnswer.isRight()).toBe(true)
    expect(save).toHaveBeenCalledOnce()
    expect(editedOptionAnswer.value).toMatchObject({
      optionAnswer: expect.objectContaining({
        optionTitle: 'new_title',
        optionNum: 2,
      }),
    })
    expect(inMemoryOptionAnswersRepository.items[0].optionTitle).toBe(
      'new_title',
    )
    expect(inMemoryOptionAnswersRepository.items[0].optionNum).toBe(2)
  })

  it('returns not found for a missing option', async () => {
    const result = await sut.execute({
      optionId: 'missing',
      accountId: 'account-1',
      optionTitle: 'new_title',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('does not edit an option owned by another account', async () => {
    const option = makeOptionAnswer()
    await inMemoryOptionAnswersRepository.create(option)

    const result = await sut.execute({
      optionId: option.id.toString(),
      accountId: 'another-account',
      optionTitle: 'forbidden',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    expect(option.optionTitle).not.toBe('forbidden')
  })
})
