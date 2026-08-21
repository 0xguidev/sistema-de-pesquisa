import { makeAccount } from 'test/factories/make-Account'
import { makeAnswerQuestion } from 'test/factories/make-answer-question'
import { makeInterview } from 'test/factories/make-interview'
import { InMemoryAnswerQuestionRepository } from 'test/repositories/in-memory-answer-question-repository'
import { FetchAnswersByInterviewIdUseCase } from './fetch-answers-by-interview-id'

let inMemoryAnswersRepository: InMemoryAnswerQuestionRepository
let sut: FetchAnswersByInterviewIdUseCase

describe('Fetch answers by interview ID', () => {
  beforeEach(() => {
    inMemoryAnswersRepository = new InMemoryAnswerQuestionRepository()
    sut = new FetchAnswersByInterviewIdUseCase(inMemoryAnswersRepository)
  })

  it('Should fetch only answers from the interview and account', async () => {
    const account = makeAccount()
    const anotherAccount = makeAccount()
    const interview = makeInterview({ accountId: account.id })
    const anotherInterview = makeInterview({ accountId: account.id })
    const answer1 = makeAnswerQuestion({
      accountId: account.id,
      interviewId: interview.id,
    })
    const answer2 = makeAnswerQuestion({
      accountId: account.id,
      interviewId: interview.id,
    })
    const answerFromAnotherInterview = makeAnswerQuestion({
      accountId: account.id,
      interviewId: anotherInterview.id,
    })
    const answerFromAnotherAccount = makeAnswerQuestion({
      accountId: anotherAccount.id,
      interviewId: interview.id,
    })

    await inMemoryAnswersRepository.create(answer1)
    await inMemoryAnswersRepository.create(answer2)
    await inMemoryAnswersRepository.create(answerFromAnotherInterview)
    await inMemoryAnswersRepository.create(answerFromAnotherAccount)

    const result = await sut.execute({
      interviewId: interview.id.toString(),
      accountId: account.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toHaveLength(2)
    expect(result.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: answer1.id.toString() }),
        expect.objectContaining({ id: answer2.id.toString() }),
      ]),
    )
  })

  it('returns an empty list when the interview has no answers', async () => {
    const result = await sut.execute({
      interviewId: 'interview-without-answers',
      accountId: 'account-1',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual([])
  })
})
