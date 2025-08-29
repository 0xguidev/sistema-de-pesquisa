import { makeInterview } from 'test/factories/make-interview'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { FetchInterviewUseCase } from './fetch-interview-by-id'

let inMemoryInterviewsRepository: InMemoryInterviewRepository
let sut: FetchInterviewUseCase

describe('Get Interview', () => {
  beforeEach(() => {
    inMemoryInterviewsRepository = new InMemoryInterviewRepository()
    sut = new FetchInterviewUseCase(inMemoryInterviewsRepository)
  })

  it('Should be able to get a interview', async () => {
    const interview = makeInterview()

    await inMemoryInterviewsRepository.create(interview)

    const existsInterview = await sut.execute({
      interviewId: interview.id.toString(),
    })

    expect(existsInterview.isRight()).toBe(true)
    if (!(existsInterview.value instanceof Error)) {
      expect(inMemoryInterviewsRepository.items[0]).toEqual(
        existsInterview.value.interview,
      )
    }
  })
})
