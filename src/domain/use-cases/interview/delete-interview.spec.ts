import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { DeleteInterviewUseCase } from './delete-interview'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeInterview } from 'test/factories/make-interview'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let inMemoryInterviewRepository: InMemoryInterviewRepository
let sut: DeleteInterviewUseCase

describe('Delete an interview', () => {
  beforeEach(() => {
    inMemoryInterviewRepository = new InMemoryInterviewRepository()

    sut = new DeleteInterviewUseCase(inMemoryInterviewRepository)
  })

  it('should delete an interview', async () => {
    const interview = makeInterview(
      { surveyId: new UniqueEntityID() },
      new UniqueEntityID('interview_id'),
    )

    await inMemoryInterviewRepository.create(interview)

    const result = await sut.execute({
      interviewId: interview.id.toString(),
      accountId: interview.accountId.toString(),
    })

    expect(inMemoryInterviewRepository.items).toHaveLength(0)
    expect(result.isRight()).toBe(true)
  })

  it('returns not found for a missing interview', async () => {
    const result = await sut.execute({
      interviewId: 'missing',
      accountId: 'owner',
    })
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('does not delete another account interview', async () => {
    const interview = makeInterview()
    await inMemoryInterviewRepository.create(interview)
    const result = await sut.execute({
      interviewId: interview.id.toString(),
      accountId: 'attacker',
    })
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryInterviewRepository.items).toHaveLength(1)
  })
})
