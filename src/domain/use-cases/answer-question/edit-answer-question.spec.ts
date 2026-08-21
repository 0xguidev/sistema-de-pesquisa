import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryAnswerQuestionRepository } from 'test/repositories/in-memory-answer-question-repository'
import { EditAnswerQuestionUseCase } from './edit-answer-question'
import { makeAnswerQuestion } from 'test/factories/make-answer-question'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let inMemoryAnswerQuestionsRepository: InMemoryAnswerQuestionRepository
let sut: EditAnswerQuestionUseCase

describe('Edit AnswerQuestion', () => {
  beforeEach(() => {
    inMemoryAnswerQuestionsRepository = new InMemoryAnswerQuestionRepository()
    sut = new EditAnswerQuestionUseCase(inMemoryAnswerQuestionsRepository)
  })

  it('Should be able to edit a answerquestion', async () => {
    const answerQuestion = makeAnswerQuestion()

    await inMemoryAnswerQuestionsRepository.create(answerQuestion)

    const newOptionAnswerId = new UniqueEntityID('new-option')
    const update = vi.spyOn(inMemoryAnswerQuestionsRepository, 'update')

    const editedAnswerQuestion = await sut.execute({
      answerQuestionId: answerQuestion.id.toString(),
      optionAnswerId: newOptionAnswerId.toString(),
      accountId: answerQuestion.accountId.toString(),
      questionId: answerQuestion.questionId.toString(),
    })

    expect(editedAnswerQuestion.isRight()).toBe(true)
    expect(update).toHaveBeenCalledOnce()
    expect(inMemoryAnswerQuestionsRepository.items[0].optionAnswerId).toEqual(
      newOptionAnswerId,
    )
  })

  it('returns not found for a missing answer', async () => {
    const result = await sut.execute({
      answerQuestionId: 'missing',
      accountId: 'account-1',
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('does not edit another account answer', async () => {
    const answer = makeAnswerQuestion()
    const originalOptionId = answer.optionAnswerId
    await inMemoryAnswerQuestionsRepository.create(answer)
    const result = await sut.execute({
      answerQuestionId: answer.id.toString(),
      accountId: 'another-account',
      optionAnswerId: 'new-option',
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(answer.optionAnswerId).toEqual(originalOptionId)
  })
})
