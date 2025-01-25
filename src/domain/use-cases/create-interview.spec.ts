import { expect, beforeEach } from 'vitest'
import { CreateSurvey } from './create-survey'
import { InMemorSurveyRepository } from '../../test/repositories/in-memory-survey-repository'
import { CreateInterview } from './create-interview'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { InMemoryInterviewRepository } from 'src/test/repositories/in-memory-interview-repository'

let inMemorySurveyRepository: InMemorSurveyRepository
let inMemoryInterviewRepository: InMemoryInterviewRepository

describe('create an option answer', async () => {
  beforeEach(() => {
    inMemorySurveyRepository = new InMemorSurveyRepository()
    inMemoryInterviewRepository = new InMemoryInterviewRepository()
  })

  it('should create a option answer', async () => {
    const createSurvey = new CreateSurvey(inMemorySurveyRepository)
    const surveyTitle = 'any_title'

    const createdSurvey = await createSurvey.execute({ title: surveyTitle })

    const createInterview = new CreateInterview(inMemoryInterviewRepository)
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
