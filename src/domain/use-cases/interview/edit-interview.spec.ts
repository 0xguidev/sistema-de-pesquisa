import { makeInterview } from 'test/factories/make-interview'
import { EditInterviewUseCase } from './edit-interview'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

let inMemoryInterviewsRepository: InMemoryInterviewRepository
let sut: EditInterviewUseCase

describe('Edit Interview', () => {
  beforeEach(() => {
    inMemoryInterviewsRepository = new InMemoryInterviewRepository()
    sut = new EditInterviewUseCase(inMemoryInterviewsRepository)
  })

  it('Should be able to edit a interview', async () => {
    const interview = makeInterview()

    await inMemoryInterviewsRepository.create(interview)
    const update = vi.spyOn(inMemoryInterviewsRepository, 'update')

    const editedInterview = await sut.execute({
      interviewId: interview.id.toString(),
    })

    expect(editedInterview.isRight()).toBe(true)
    expect(update).toHaveBeenCalledWith(interview)
  })

  it('returns not found for a missing interview', async () => {
    const result = await sut.execute({ interviewId: 'missing' })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
