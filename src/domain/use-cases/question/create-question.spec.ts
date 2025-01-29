import { expect, beforeEach } from 'vitest'
import { InMemoryQuestionRepository } from '../../../test/repositories/in-memory-question-repository'
import { InMemorySurveyRepository } from '../../../test/repositories/in-memory-survey-repository'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { CreateQuestionUseCase } from './create-question'
import { CreateSurveyUseCase } from '../survey/create-survey'

let inMemoryQuestionRepository: InMemoryQuestionRepository
let inMemorySurveyRepository: InMemorySurveyRepository

describe('create an question', async () => {
  beforeEach(() => {
    inMemoryQuestionRepository = new InMemoryQuestionRepository()
    inMemorySurveyRepository = new InMemorySurveyRepository()
  })

  it('should create a question', async () => {
    const createSurvey = new CreateSurveyUseCase(inMemorySurveyRepository)
    const surveyTitle = 'any_title'

    const createdSurvey = await createSurvey.execute({ title: surveyTitle })

    const createQuestion = new CreateQuestionUseCase(inMemoryQuestionRepository)
    const questionTitle = 'any_title'
    const questionNum = 1
    const surveyId = createdSurvey.value?.survey.id as UniqueEntityID

    const createdQuestion = await createQuestion.execute({
      questionTitle,
      questionNum,
      surveyId,
    })

    expect(createdQuestion.isRight()).toBe(true)
    expect(inMemoryQuestionRepository.items[0]).toEqual(
      createdQuestion.value?.question,
    )
  })
})
