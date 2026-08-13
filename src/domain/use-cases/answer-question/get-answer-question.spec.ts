import { InMemoryAnswerQuestionRepository } from 'test/repositories/in-memory-answer-question-repository'
import { GetAnswerQuestionUseCase } from './get-answer-question'
import { makeAnswerQuestion } from 'test/factories/make-answer-question'
import { makeAccount } from 'test/factories/make-Account'

let inMemoryAnswerQuestionRepository: InMemoryAnswerQuestionRepository
let sut: GetAnswerQuestionUseCase

describe('Get AnswerQuestion', () => {
  beforeEach(() => {
    inMemoryAnswerQuestionRepository = new InMemoryAnswerQuestionRepository()
    sut = new GetAnswerQuestionUseCase(inMemoryAnswerQuestionRepository)
  })

  it('Should be able to get a answerquestion', async () => {
    const account = makeAccount()
    const answerquestion = makeAnswerQuestion({ accountId: account.id })

    await inMemoryAnswerQuestionRepository.create(answerquestion)
    const existsAnswerQuestion = await sut.execute({
      answerQuestionId: answerquestion.id.toString(),
      accountId: account.id.toString(),
    })

    expect(existsAnswerQuestion.isRight()).toBe(true)
    if (!(existsAnswerQuestion.value instanceof Error)) {
      expect(inMemoryAnswerQuestionRepository.items[0]).toEqual(
        existsAnswerQuestion.value.answerQuestion,
      )
    }
  })

  it('Should not be able to get an answer from another account', async () => {
    const owner = makeAccount()
    const anotherAccount = makeAccount()
    const answerquestion = makeAnswerQuestion({ accountId: owner.id })

    await inMemoryAnswerQuestionRepository.create(answerquestion)

    const result = await sut.execute({
      answerQuestionId: answerquestion.id.toString(),
      accountId: anotherAccount.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
  })
})
