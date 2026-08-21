import { InMemoryAnswerQuestionRepository } from 'test/repositories/in-memory-answer-question-repository'
import { DeleteAnswerQuestionUseCase } from './delete-answer-question'
import { makeAnswerQuestion } from 'test/factories/make-answer-question'
import { makeAccount } from 'test/factories/make-Account'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let inMemoryAnswerQuestionRepository: InMemoryAnswerQuestionRepository
let sut: DeleteAnswerQuestionUseCase

describe('Delete an answer answerquestion', () => {
  beforeEach(() => {
    inMemoryAnswerQuestionRepository = new InMemoryAnswerQuestionRepository()

    sut = new DeleteAnswerQuestionUseCase(inMemoryAnswerQuestionRepository)
  })

  it('should delete an answerquestion', async () => {
    const account = makeAccount()
    const answerQuestion = makeAnswerQuestion({
      accountId: account.id,
    })

    await inMemoryAnswerQuestionRepository.create(answerQuestion)

    const result = await sut.execute({
      answerQuestionId: answerQuestion.id.toString(),
      accountId: account.id.toString(),
    })

    expect(inMemoryAnswerQuestionRepository.items).toHaveLength(0)
    expect(result.isRight()).toBe(true)
  })

  it('returns not found for a missing answer', async () => {
    const result = await sut.execute({
      answerQuestionId: 'missing',
      accountId: 'owner',
    })
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('does not delete another account answer', async () => {
    const answer = makeAnswerQuestion()
    await inMemoryAnswerQuestionRepository.create(answer)
    const result = await sut.execute({
      answerQuestionId: answer.id.toString(),
      accountId: 'attacker',
    })
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryAnswerQuestionRepository.items).toHaveLength(1)
  })
})
