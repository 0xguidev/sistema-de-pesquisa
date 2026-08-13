import { makeInterview } from 'test/factories/make-interview'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { FetchInterviewUseCase } from './fetch-interview-by-id'
import { makeAccount } from 'test/factories/make-Account'

let inMemoryInterviewsRepository: InMemoryInterviewRepository
let sut: FetchInterviewUseCase

describe('Get Interview', () => {
  beforeEach(() => {
    inMemoryInterviewsRepository = new InMemoryInterviewRepository()
    sut = new FetchInterviewUseCase(inMemoryInterviewsRepository)
  })

  it('Should be able to get a interview', async () => {
    const account = makeAccount()
    const interview = makeInterview({ accountId: account.id })

    await inMemoryInterviewsRepository.create(interview)

    const existsInterview = await sut.execute({
      interviewId: interview.id.toString(),
      accountId: account.id.toString(),
    })

    expect(existsInterview.isRight()).toBe(true)
    if (!(existsInterview.value instanceof Error)) {
      expect(inMemoryInterviewsRepository.items[0]).toEqual(
        existsInterview.value.interview,
      )
    }
  })

  it('Should not be able to get an interview from another account', async () => {
    const owner = makeAccount()
    const anotherAccount = makeAccount()
    const interview = makeInterview({ accountId: owner.id })

    await inMemoryInterviewsRepository.create(interview)

    const result = await sut.execute({
      interviewId: interview.id.toString(),
      accountId: anotherAccount.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
  })
})
