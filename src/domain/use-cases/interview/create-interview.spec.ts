import { expect, beforeEach } from 'vitest'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { CreateInterviewUseCase } from './create-interview'
import { makeSurvey } from 'test/factories/make-survey'

let inMemoryInterviewRepository: InMemoryInterviewRepository
let sut: CreateInterviewUseCase

describe('create an interview', async () => {
  beforeEach(() => {
    inMemoryInterviewRepository = new InMemoryInterviewRepository()
    sut = new CreateInterviewUseCase(inMemoryInterviewRepository)
  })

  it('should create a interview', async () => {
    const survey = makeSurvey()
    
    const createdInterview = await sut.execute({
      surveyId: survey.id.toString(),
    })

    expect(createdInterview.isRight()).toBe(true)
    expect(inMemoryInterviewRepository.items[0]).toEqual(
      createdInterview.value?.interview,
    )
  })
})
