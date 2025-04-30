import { InMemoryAnswerQuestionRepository } from 'test/repositories/in-memory-answer-question-repository'
import { DeleteAnswerQuestionUseCase } from './delete-answer-question'
import { makeAnswerQuestion } from 'test/factories/make-answer-question'
import { makeAccount } from 'test/factories/make-Account'

let inMemoryAnswerQuestionRepository: InMemoryAnswerQuestionRepository
let sut: DeleteAnswerQuestionUseCase

describe('Delete an answer answerquestion', () => {
  beforeAll(() => {
    inMemoryAnswerQuestionRepository = new InMemoryAnswerQuestionRepository()

    sut = new DeleteAnswerQuestionUseCase(inMemoryAnswerQuestionRepository)
  })

  it('should delete an answerquestion', async () => {
    const account = makeAccount()
    const answerQuestion = makeAnswerQuestion({
      accountId: account.id,
    })

    await inMemoryAnswerQuestionRepository.create(answerQuestion)

    await sut.execute({
      answerQuestionId: answerQuestion.id.toString(),
      accountId: account.id.toString(),
    })

    expect(inMemoryAnswerQuestionRepository.items).toHaveLength(0)
  })
})
