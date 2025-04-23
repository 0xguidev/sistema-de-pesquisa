import { expect, beforeEach } from 'vitest'
import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { CreateOptionAnswerUseCase } from './create-option-answer'

let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let sut: CreateOptionAnswerUseCase

describe('create an option answer', async () => {
  beforeEach(() => {
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()

    sut = new CreateOptionAnswerUseCase(inMemoryOptionAnswersRepository)
  })
  })

  it('should create a option answer', async () => {
    const result = await sut.execute({
      optionTitle: 'any_title',
      optionNum: 1,
      accountId: 'any_account_id',
      questionId: 'any_question_id',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryOptionAnswersRepository.items[0]).toEqual(result.value?.optionAnswer)
    expect(inMemoryOptionAnswersRepository.items[0].optionTitle).toEqual(
      'any_title',
    )
    expect(inMemoryOptionAnswersRepository.items[0].optionNum).toEqual(1)
    expect(inMemoryOptionAnswersRepository.items[0].accountId).toEqual(
      new UniqueEntityID('any_account_id'),
    )
    expect(inMemoryOptionAnswersRepository.items[0].questionId).toEqual(
      new UniqueEntityID('any_question_id'),
    )
})