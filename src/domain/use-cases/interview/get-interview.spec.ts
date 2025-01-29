import { makeInterview } from 'src/test/factories/make-interview'
import { InMemoryInterviewRepository } from 'src/test/repositories/in-memory-interview-repository'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { GetInterviewUseCase } from './get-interview'

let inMemoryInterviewsRepository: InMemoryInterviewRepository
let sut: GetInterviewUseCase

describe('Get Interview', () => {
  beforeEach(() => {
    inMemoryInterviewsRepository = new InMemoryInterviewRepository()
    sut = new GetInterviewUseCase(inMemoryInterviewsRepository)
  })

  it('Should be able to get a interview', async () => {
    const interview = makeInterview(
      { surveyId: new UniqueEntityID() },
      new UniqueEntityID(),
    )

    await inMemoryInterviewsRepository.create(interview)

    const existsInterview = await sut.execute({
      interviewId: interview.id,
    })

    expect(existsInterview.isRight()).toBe(true)
    if (!(existsInterview.value instanceof Error)) {
      expect(inMemoryInterviewsRepository.items[0]).toEqual(
        existsInterview.value.interview,
      )
    }
  })
})
