import { expect, beforeEach } from 'vitest'
import { CreateQuestion } from './create-question'
import { CreateSurvey } from './create-survey'
import { InMemoryQuestionRepository } from '../../test/repositories/in-memory-questions-repository'
import { InMemorSurveyRepository } from '../../test/repositories/in-memory-survey-repository'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'

let inMemoryQuestionsRepository: InMemoryQuestionRepository
let inMemorySurveyRepository: InMemorSurveyRepository

describe('create an question', async () => {
  beforeEach(() => {
    inMemoryQuestionsRepository = new InMemoryQuestionRepository()
    inMemorySurveyRepository = new InMemorSurveyRepository()
  })

  it('should create a question', async () => {
    const createSurvey = new CreateSurvey(inMemorySurveyRepository)
    const surveyTitle = 'any_title'

    const createdSurvey = await createSurvey.execute({ title: surveyTitle })

    const createQuestion = new CreateQuestion(inMemoryQuestionsRepository)
    const questionTitle = 'any_title'
    const questionNum = 1
    const surveyId = createdSurvey.value?.survey.id as UniqueEntityID

    const createdQuestion = await createQuestion.execute({
      questionTitle,
      questionNum,
      surveyId,
    })

    expect(createdQuestion.isRight()).toBe(true)
    expect(inMemoryQuestionsRepository.items[0]).toEqual(
      createdQuestion.value?.question,
    )
  })
})
