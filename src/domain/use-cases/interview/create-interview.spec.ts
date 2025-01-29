import { expect, beforeEach } from 'vitest'
import { InMemorySurveyRepository } from '../../../test/repositories/in-memory-survey-repository'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { InMemoryInterviewRepository } from 'src/test/repositories/in-memory-interview-repository'
import { CreateInterviewUseCase } from './create-interview'
import { CreateSurveyUseCase } from '../survey/create-survey'

let inMemorySurveyRepository: InMemorySurveyRepository
let inMemoryInterviewRepository: InMemoryInterviewRepository

describe('create an option answer', async () => {
  beforeEach(() => {
    inMemorySurveyRepository = new InMemorySurveyRepository()
    inMemoryInterviewRepository = new InMemoryInterviewRepository()
  })

  it('should create a option answer', async () => {
    const createSurvey = new CreateSurveyUseCase(inMemorySurveyRepository)
    const surveyTitle = 'any_title'

    const createdSurvey = await createSurvey.execute({ title: surveyTitle })

    const createInterview = new CreateInterviewUseCase(
      inMemoryInterviewRepository,
    )
    const surveyId = createdSurvey.value?.survey.id as UniqueEntityID
    const createdInterview = await createInterview.execute({
      surveyId,
    })

    expect(createdInterview.isRight()).toBe(true)
    expect(inMemoryInterviewRepository.items[0]).toEqual(
      createdInterview.value?.interview,
    )
  })
})
