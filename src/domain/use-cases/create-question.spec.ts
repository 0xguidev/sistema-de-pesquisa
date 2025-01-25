import { expect, beforeEach } from 'vitest'
import { CreateQuestion } from './create-question'
import { CreateSurvey } from './create-survey'
import { InMemoryQuestionsRepository } from '../../test/repositories/in-memory-questions-repository'
import { InMemorSurveyRepository } from '../../test/repositories/in-memory-survey-repository'

let inMemoryQuestionsRepository: InMemoryQuestionsRepository
let inMemorySurveyRepository: InMemorSurveyRepository

describe('create an question', async () => {
  beforeEach(() => {
    inMemoryQuestionsRepository = new InMemoryQuestionsRepository()
    inMemorySurveyRepository = new InMemorSurveyRepository()
  })

  it('should create a question', async () => {
    const createSurvey = new CreateSurvey(inMemorySurveyRepository)
    const surveyTitle = 'any_title'

    const createdSurvey = await createSurvey.execute({ title: surveyTitle })

    const createQuestion = new CreateQuestion(inMemoryQuestionsRepository)
    const questionTitle = 'any_title'
    const questionNum = 1
    const surveyId = createdSurvey.id

    const createdQuestion = await createQuestion.execute({
      questionTitle,
      questionNum,
      surveyId,
    })

    expect(createdQuestion.isRight()).toBe(true)
  })
})
