import { expect, beforeEach } from 'vitest'
import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { CreateOptionAnswerUseCase } from './create-option-answer'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { makeAccount } from 'test/factories/make-Account'
import { makeQuestion } from 'test/factories/make-question'

let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let inMemoryQuestionRepository: InMemoryQuestionRepository
let sut: CreateOptionAnswerUseCase

describe('create an option answer', async () => {
  beforeEach(() => {
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
    inMemoryQuestionRepository = new InMemoryQuestionRepository()

    sut = new CreateOptionAnswerUseCase(
      inMemoryOptionAnswersRepository,
      inMemoryQuestionRepository,
    )
  })

  it('should create a option answer', async () => {
    const account = makeAccount()
    const question = makeQuestion({ accountId: account.id })
    await inMemoryQuestionRepository.create(question)

    const result = await sut.execute({
      optionTitle: 'any_title',
      optionNum: 1,
      accountId: account.id.toString(),
      questionId: question.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryOptionAnswersRepository.items[0]).toEqual(
      result.value?.optionAnswer,
    )
    expect(inMemoryOptionAnswersRepository.items[0].optionTitle).toEqual(
      'any_title',
    )
    expect(inMemoryOptionAnswersRepository.items[0].optionNum).toEqual(1)
    expect(inMemoryOptionAnswersRepository.items[0].accountId).toEqual(
      account.id,
    )
    expect(inMemoryOptionAnswersRepository.items[0].questionId).toEqual(
      question.id,
    )
  })

  it('should not create an option for another account question', async () => {
    const owner = makeAccount()
    const attacker = makeAccount()
    const question = makeQuestion({ accountId: owner.id })
    await inMemoryQuestionRepository.create(question)

    const result = await sut.execute({
      optionTitle: 'Cross tenant option',
      optionNum: 1,
      questionId: question.id.toString(),
      accountId: attacker.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(inMemoryOptionAnswersRepository.items).toHaveLength(0)
  })
})
