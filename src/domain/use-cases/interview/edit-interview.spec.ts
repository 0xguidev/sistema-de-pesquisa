import { makeInterview } from 'test/factories/make-interview'
import { EditInterviewUseCase } from './edit-interview'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'

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

    const editedInterview = await sut.execute({
      interviewId: interview.id.toString(),
    })

    expect(editedInterview.isRight()).toBe(true)
    if ('interview' in editedInterview.value) {
      expect(inMemoryInterviewsRepository.items[0]).toEqual(
        editedInterview.value.interview,
      )
    }
  })
})
