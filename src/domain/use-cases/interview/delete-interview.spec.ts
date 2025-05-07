import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { DeleteInterviewUseCase } from './delete-interview'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { makeInterview } from 'test/factories/make-interview'

let inMemoryInterviewRepository: InMemoryInterviewRepository
let sut: DeleteInterviewUseCase

describe('Delete an interview', () => {
  beforeAll(() => {
    inMemoryInterviewRepository = new InMemoryInterviewRepository()

    sut = new DeleteInterviewUseCase(inMemoryInterviewRepository)
  })

  it('should delete an interview', async () => {
    const interview = makeInterview(
      { surveyId: new UniqueEntityID() },
      new UniqueEntityID('interview_id'),
    )

    await inMemoryInterviewRepository.create(interview)

    await sut.execute({
      interviewId: interview.id.toString(),
      accountId: interview.accountId.toString(),
    })

    expect(inMemoryInterviewRepository.items).toHaveLength(0)
  })
})
